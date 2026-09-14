import { prisma } from "@/lib/prisma";
import { sendBroadcastToUser } from "@/lib/bot";
import { getEventDateTime } from "@/lib/event-time";
import { releaseInventory } from "@/lib/zones";

const NO_SHOW_GRACE_MS = 3 * 60 * 60 * 1000; // 3 hours after showtime
const AWAITING_PAYMENT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes to complete payment

export async function runSweep() {
  await sweepDueNotifications();
  await sweepExpiredBookings();
  await sweepExpiredPendingPayments();
}

async function sweepDueNotifications() {
  // Without a bot token there's no way to deliver these — leave them PENDING
  // so they get sent once a token is configured, instead of marking them SENT
  // with nothing actually delivered.
  if (!process.env.BOT_TOKEN) return;

  const due = await prisma.notification.findMany({
    where: { status: "PENDING", scheduledAt: { lte: new Date() } },
  });

  for (const notification of due) {
    const users = await prisma.user.findMany({ select: { telegramId: true } });

    for (const u of users) {
      try {
        await sendBroadcastToUser(u.telegramId, notification.title, notification.description || "", notification.photoUrl);
      } catch (err) {
        console.error(`[scheduler] failed to send notification ${notification.id} to ${u.telegramId}:`, err);
      }
    }

    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "SENT", sentAt: new Date() },
    });
  }
}

async function sweepExpiredBookings() {
  const confirmed = await prisma.booking.findMany({
    where: { status: "CONFIRMED" },
    include: { event: true },
  });

  const now = Date.now();

  for (const booking of confirmed) {
    const eventDateTime = getEventDateTime(booking.event.date, booking.event.time);
    if (now - eventDateTime.getTime() > NO_SHOW_GRACE_MS) {
      await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
    }
  }
}

/**
 * Unlike sweepExpiredBookings (no-show, money already collected, never
 * refunded), a booking still AWAITING_PAYMENT never actually collected
 * anything — so expiring it must also restore the reserved inventory.
 * Guarded update protects against racing a payment that completes at the
 * same moment (see bot.ts's applySuccessfulPayment).
 */
async function sweepExpiredPendingPayments() {
  const pending = await prisma.booking.findMany({
    where: { status: "AWAITING_PAYMENT", createdAt: { lt: new Date(Date.now() - AWAITING_PAYMENT_WINDOW_MS) } },
  });

  for (const booking of pending) {
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.booking.updateMany({
        where: { id: booking.id, status: "AWAITING_PAYMENT" },
        data: { status: "CANCELLED" },
      });
      if (count === 0) return; // a payment completed in the same instant — leave inventory alone

      await releaseInventory(tx, booking.eventId, booking.zone, booking.quantity);
    });
  }
}
