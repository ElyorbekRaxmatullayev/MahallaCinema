"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/telegram-auth";

export async function addEvent(data: FormData) {
  if (!(await requireAdmin())) return;

  const title = data.get("title") as string;
  const description = data.get("description") as string;
  const type = data.get("type") as string;
  const dateStr = data.get("date") as string;
  const time = data.get("time") as string;
  const posterUrl = data.get("posterUrl") as string;
  
  const totalPoufs = parseInt(data.get("totalPoufs") as string) || 50;
  const poufPrice = parseInt(data.get("poufPrice") as string) || 80000;
  const totalTapchans = parseInt(data.get("totalTapchans") as string) || 10;
  const tapchanPrice = parseInt(data.get("tapchanPrice") as string) || 320000;

  await prisma.event.create({
    data: {
      title,
      description,
      isFootball: type === "ФУТБОЛ",
      date: new Date(dateStr),
      time,
      posterUrl,
      totalPoufs,
      availablePoufs: totalPoufs,
      poufPrice,
      totalTapchans,
      availableTapchans: totalTapchans,
      tapchanPrice,
    },
  });

  revalidatePath("/");
  revalidatePath("/afisha");
  revalidatePath("/admin");
}

export async function deleteEvent(id: string) {
  if (!(await requireAdmin())) return;

  await prisma.booking.deleteMany({ where: { eventId: id } });
  await prisma.favorite.deleteMany({ where: { eventId: id } });
  await prisma.event.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/afisha");
  revalidatePath("/admin");
}

export async function queueNotification(data: FormData) {
  if (!(await requireAdmin())) return;

  const title = data.get("title") as string;
  const description = data.get("description") as string;
  const photoUrl = data.get("photoUrl") as string;
  const scheduledAtRaw = data.get("scheduledAt") as string;

  await prisma.notification.create({
    data: {
      title,
      description: description || null,
      photoUrl: photoUrl || null,
      scheduledAt: new Date(scheduledAtRaw),
    },
  });

  revalidatePath("/admin");
}

export async function addPromoCode(data: FormData) {
  if (!(await requireAdmin())) return;

  const code = (data.get("code") as string).trim().toUpperCase();
  const type = data.get("type") as string;
  const value = parseInt(data.get("value") as string) || 0;
  const maxUsesRaw = data.get("maxUses") as string;

  await prisma.promoCode.create({
    data: {
      code,
      type,
      value,
      maxUses: maxUsesRaw ? parseInt(maxUsesRaw) : null,
    },
  });

  revalidatePath("/admin");
}

export async function togglePromoCode(id: string, isActive: boolean) {
  if (!(await requireAdmin())) return;

  await prisma.promoCode.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin");
}

export async function deletePromoCode(id: string) {
  if (!(await requireAdmin())) return;

  await prisma.booking.updateMany({ where: { promoCodeId: id }, data: { promoCodeId: null } });
  await prisma.promoCode.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function adjustUserBalance(userId: string, amount: number) {
  if (!(await requireAdmin())) return;
  if (!Number.isFinite(amount) || amount === 0) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  await prisma.user.update({
    where: { id: userId },
    data: { balance: Math.max(0, user.balance + amount) },
  });

  revalidatePath("/admin");
}
