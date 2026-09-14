import { Bot, InlineKeyboard, InputFile } from "grammy";
import path from "path";
import { isAdminTelegramId } from "@/lib/telegram-auth";
import { prisma } from "@/lib/prisma";
import { getQrBuffer } from "@/lib/qr";
import { ZONE_LABELS } from "@/lib/zones";

let bot: Bot | null = null;

function getAppUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function getProviderToken(provider: "CLICK" | "PAYME"): string {
  const token = provider === "CLICK" ? process.env.CLICK_Terminal : process.env.Payme_Terminal;
  if (!token) throw new Error(`Provider token for ${provider} is not set`);
  return token;
}

interface TicketBooking {
  id: string;
  zone: string;
  quantity: number;
  customerName: string | null;
  event: { title: string; date: Date; time: string };
}

function buildTicketCaption(booking: TicketBooking): string {
  const zoneLabel = ZONE_LABELS[booking.zone] ?? booking.zone;
  const dateStr = new Date(booking.event.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  return [
    "✅ Оплата прошла успешно!",
    "",
    booking.event.title,
    `${booking.event.time}, ${dateStr}`,
    `${zoneLabel} x${booking.quantity}`,
    booking.customerName ? `Имя: ${booking.customerName}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendTicket(chatId: number | string, booking: TicketBooking) {
  const b = getBot();
  const buffer = await getQrBuffer(booking.id);
  await b.api.sendPhoto(chatId, new InputFile(buffer, "ticket.png"), { caption: buildTicketCaption(booking) });
}

/**
 * Guarded: only actually applies the deferred bonus/promo effects and flips
 * status if this booking is still AWAITING_PAYMENT — protects against grammy
 * redelivering the same update, and against racing the expiry sweep.
 */
async function applySuccessfulPayment(payload: string, telegramChargeId: string, providerChargeId: string) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.booking.updateMany({
      where: { id: payload, status: "AWAITING_PAYMENT" },
      data: { status: "CONFIRMED", paidAt: new Date(), telegramChargeId, providerChargeId },
    });

    if (count === 0) return null;

    const booking = await tx.booking.findUniqueOrThrow({
      where: { id: payload },
      include: { event: true },
    });

    if (booking.bonusApplied > 0) {
      await tx.user.update({ where: { id: booking.userId }, data: { balance: { decrement: booking.bonusApplied } } });
    }
    if (booking.promoCodeId) {
      await tx.promoCode.update({ where: { id: booking.promoCodeId }, data: { usesCount: { increment: 1 } } });
    }

    return booking;
  });
}

export function getBot(): Bot {
  if (bot) return bot;

  bot = new Bot(process.env.BOT_TOKEN!);

  bot.command("start", async (ctx) => {
    const telegramId = String(ctx.from?.id ?? "");
    const keyboard = new InlineKeyboard().webApp("Открыть", `${getAppUrl()}/cinema`);
    if (isAdminTelegramId(telegramId)) {
      keyboard.row().webApp("Админ панель", `${getAppUrl()}/cinema/admin`);
    }

    await ctx.reply("Добро пожаловать в Mahalla Cinema! Кино под открытым небом 🍿", {
      reply_markup: keyboard,
    });
  });

  bot.on("pre_checkout_query", async (ctx) => {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: ctx.preCheckoutQuery.invoice_payload },
        select: { status: true },
      });
      if (booking?.status === "AWAITING_PAYMENT") {
        await ctx.answerPreCheckoutQuery(true);
      } else {
        await ctx.answerPreCheckoutQuery(false, "Бронирование больше не активно");
      }
    } catch (err) {
      console.error("[bot] pre_checkout_query error:", err);
      await ctx.answerPreCheckoutQuery(false, "Ошибка сервера").catch(() => { });
    }
  });

  bot.on("message:successful_payment", async (ctx) => {
    const sp = ctx.message.successful_payment;
    try {
      const booking = await applySuccessfulPayment(
        sp.invoice_payload,
        sp.telegram_payment_charge_id,
        sp.provider_payment_charge_id
      );

      if (booking) {
        await sendTicket(ctx.chat.id, booking);
        return;
      }

      // Guarded update affected 0 rows — either a genuine redelivery (already
      // CONFIRMED with this exact charge) or the expiry sweep won a race.
      const existing = await prisma.booking.findUnique({
        where: { id: sp.invoice_payload },
        include: { event: true },
      });
      if (existing?.status === "CONFIRMED" && existing.telegramChargeId === sp.telegram_payment_charge_id) {
        await sendTicket(ctx.chat.id, existing);
      } else {
        console.error(
          `[bot] successful_payment for booking ${sp.invoice_payload} could not be applied (status=${existing?.status}) — possible expiry race, charge ${sp.telegram_payment_charge_id}`
        );
      }
    } catch (err) {
      console.error("[bot] failed to process successful_payment:", err);
    }
  });

  bot.catch((err) => {
    console.error("[bot] error handling update:", err);
  });

  return bot;
}

/** Starts long-polling. Resolves only when the bot stops — must never be awaited by the caller. */
export async function startBot() {
  const b = getBot();
  await b.start({
    onStart: () => console.log("[bot] long polling started"),
  });
}

/**
 * Sends a broadcast message to one user. Photos are uploaded as local file
 * bytes (not by URL) since there's no public domain for Telegram to fetch from yet.
 */
export async function sendBroadcastToUser(
  telegramId: string,
  title: string,
  description: string,
  photoUrl?: string | null
) {
  const b = getBot();
  const text = description ? `${title}\n\n${description}` : title;

  if (photoUrl) {
    const absPath = path.join(process.cwd(), "public", photoUrl);
    await b.api.sendPhoto(telegramId, new InputFile(absPath), { caption: text });
  } else {
    await b.api.sendMessage(telegramId, text);
  }
}

/**
 * Sends a real Telegram invoice for the given booking. photo_url is only
 * included when posterUrl is an already-public https URL — Telegram's
 * servers must be able to fetch it themselves (unlike sendPhoto, sendInvoice
 * has no local-file-upload variant), so a locally-uploaded poster (no public
 * domain yet) is silently omitted rather than erroring.
 */
export async function sendBookingInvoice(params: {
  telegramId: string;
  bookingId: string;
  title: string;
  description: string;
  amount: number;
  posterUrl?: string | null;
  provider: "CLICK" | "PAYME";
}) {
  const b = getBot();
  const providerToken = getProviderToken(params.provider);
  const title = params.title.slice(0, 32);
  const photoUrl = params.posterUrl && /^https:\/\//.test(params.posterUrl) ? params.posterUrl : undefined;

  await b.api.sendInvoice(
    params.telegramId,
    title,
    params.description.slice(0, 255),
    params.bookingId,
    "UZS",
    [{ label: title, amount: params.amount * 100 }],
    {
      provider_token: providerToken,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    }
  );
}
