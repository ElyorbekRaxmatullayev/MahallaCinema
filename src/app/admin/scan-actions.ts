"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/telegram-auth";
import { revalidatePath } from "next/cache";

function serializeBooking(booking: {
  zone: string;
  quantity: number;
  event: { title: string };
  user: { firstName: string | null };
}) {
  return {
    eventTitle: booking.event.title,
    userName: booking.user.firstName,
    zone: booking.zone,
    quantity: booking.quantity,
  };
}

export async function scanBooking(rawCode: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Доступ запрещён" };

  const bookingId = rawCode.trim();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { event: true, user: true },
  });

  if (!booking) {
    return { success: false, error: "Бронирование не найдено" };
  }

  if (booking.status === "COMPLETED") {
    return { success: false, error: "Этот билет уже использован", booking: serializeBooking(booking) };
  }

  if (booking.status === "CANCELLED") {
    return { success: false, error: "Бронирование отменено", booking: serializeBooking(booking) };
  }

  if (booking.status === "AWAITING_PAYMENT") {
    return { success: false, error: "Оплата ещё не завершена", booking: serializeBooking(booking) };
  }

  const { count } = await prisma.booking.updateMany({
    where: { id: booking.id, status: "CONFIRMED" },
    data: { status: "COMPLETED", scannedAt: new Date() },
  });
  if (count === 0) {
    return { success: false, error: "Билет уже отсканирован или недействителен", booking: serializeBooking(booking) };
  }

  const updated = await prisma.booking.findUniqueOrThrow({
    where: { id: booking.id },
    include: { event: true, user: true },
  });

  revalidatePath("/admin");
  revalidatePath("/bookings");

  return { success: true, booking: serializeBooking(updated) };
}
