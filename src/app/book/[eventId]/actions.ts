"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/telegram-auth";
import { isEventPast } from "@/lib/event-time";
import { sendBookingInvoice } from "@/lib/bot";
import { ZONE_LABELS, reserveInventory, releaseInventory } from "@/lib/zones";
import { validatePromoCode, type ValidPromo } from "@/lib/promo";

const CASHBACK_MIN_BALANCE = 10000;

class SeatsUnavailableError extends Error {}
class PromoExhaustedError extends Error {}

export interface ConfirmBookingInput {
  eventId: string;
  zone: string;
  quantity: number;
  useBonuses: boolean;
  promoCode?: string;
  customerName: string;
  customerPhone: string;
  provider?: "CLICK" | "PAYME";
}

export async function confirmBooking(input: ConfirmBookingInput) {
  const { eventId, zone, quantity, useBonuses, promoCode, provider } = input;
  const customerName = input.customerName.trim();
  const customerPhone = input.customerPhone.trim();

  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Пользователь не найден" };

    if (!customerName || !customerPhone) {
      return { success: false, error: "Укажите имя и номер телефона" };
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { success: false, error: "Сеанс не найден" };

    if (isEventPast(event.date, event.time)) {
      return { success: false, error: "Показ уже прошёл" };
    }

    if (zone === "pouf" && event.availablePoufs < quantity) {
      return { success: false, error: "Недостаточно пуфиков" };
    }
    if (zone === "tapchan" && event.availableTapchans < quantity) {
      return { success: false, error: "Недостаточно тапчанов" };
    }

    const price = zone === "pouf" ? event.poufPrice : event.tapchanPrice;
    const rawTotal = price * quantity;

    // Promo code and cashback are mutually exclusive — never trust a client-computed
    // discount, and never trust the client's choice of which one to apply either.
    let promo: ValidPromo | null = null;
    let actualPaid = rawTotal;
    let bonusDeduction = 0;

    if (promoCode) {
      const result = await validatePromoCode(user.id, promoCode);
      if (!result.valid) return { success: false, error: result.error };

      const discount = result.promo.type === "PERCENT" ? Math.floor((rawTotal * result.promo.value) / 100) : result.promo.value;
      actualPaid = Math.max(0, rawTotal - discount);
      promo = result.promo;
    } else if (useBonuses && user.balance > CASHBACK_MIN_BALANCE) {
      bonusDeduction = Math.min(user.balance, rawTotal);
      actualPaid = rawTotal - bonusDeduction;
    }

    if (actualPaid > 0 && provider !== "CLICK" && provider !== "PAYME") {
      return { success: false, error: "Выберите способ оплаты" };
    }

    const needsPayment = actualPaid > 0;

    const booking = await prisma.$transaction(async (tx) => {
      // Guarded conditional update — only succeeds if there is still enough
      // inventory at write time, closing the check-then-act race between the
      // plain read above and this decrement under concurrent bookings.
      if (!(await reserveInventory(tx, eventId, zone, quantity))) throw new SeatsUnavailableError();

      if (!needsPayment) {
        // Nothing to pay — apply promo/bonus effects immediately, exactly like before this feature existed.
        if (bonusDeduction > 0) {
          await tx.user.update({ where: { id: user.id }, data: { balance: { decrement: bonusDeduction } } });
        }
        if (promo) {
          // Same guard for the promo's own maxUses race.
          const promoUpdate = await tx.promoCode.updateMany({
            where: {
              id: promo.id,
              ...(promo.maxUses !== null ? { usesCount: { lt: promo.maxUses } } : {}),
            },
            data: { usesCount: { increment: 1 } },
          });
          if (promoUpdate.count === 0) throw new PromoExhaustedError();
        }
      }

      return tx.booking.create({
        data: {
          userId: user.id,
          eventId: event.id,
          zone,
          quantity,
          totalPrice: actualPaid,
          promoCodeId: promo?.id,
          customerName,
          customerPhone,
          status: needsPayment ? "AWAITING_PAYMENT" : "CONFIRMED",
          provider: needsPayment ? provider : null,
          // Bonus deduction is only snapshotted here (not applied to balance)
          // when payment is still pending — applied for real once payment succeeds.
          bonusApplied: needsPayment ? bonusDeduction : 0,
        },
      });
    });

    if (needsPayment) {
      const zoneLabel = ZONE_LABELS[zone] ?? zone;
      try {
        await sendBookingInvoice({
          telegramId: user.telegramId,
          bookingId: booking.id,
          title: event.title,
          description: `${zoneLabel} x${quantity}. Имя: ${customerName}. Тел: ${customerPhone}`,
          amount: actualPaid,
          posterUrl: event.posterUrl,
          provider: provider as "CLICK" | "PAYME",
        });
      } catch (err) {
        console.error("[booking] failed to send invoice, releasing reservation:", err);
        await prisma.$transaction(async (tx) => {
          const { count } = await tx.booking.updateMany({
            where: { id: booking.id, status: "AWAITING_PAYMENT" },
            data: { status: "CANCELLED" },
          });
          if (count > 0) await releaseInventory(tx, eventId, zone, quantity);
        });
        return { success: false, error: "Не удалось отправить счёт на оплату в Telegram. Попробуйте снова." };
      }
    }

    revalidatePath("/bookings");
    revalidatePath("/afisha");
    revalidatePath("/admin");
    revalidatePath(`/book/${eventId}`);

    return { success: true, needsPayment };
  } catch (error) {
    if (error instanceof SeatsUnavailableError) {
      return { success: false, error: zone === "pouf" ? "Недостаточно пуфиков" : "Недостаточно тапчанов" };
    }
    if (error instanceof PromoExhaustedError) {
      return { success: false, error: "Промокод исчерпан" };
    }
    console.error(error);
    return { success: false, error: "Внутренняя ошибка сервера" };
  }
}
