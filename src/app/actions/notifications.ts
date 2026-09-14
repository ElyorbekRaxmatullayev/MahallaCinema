"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/telegram-auth";

export async function getNotifications() {
  const user = await getCurrentUser();
  if (!user) return [];

  const notifications = await prisma.notification.findMany({
    where: { scheduledAt: { lte: new Date() } },
    orderBy: { scheduledAt: "desc" },
    include: { reads: { where: { userId: user.id } } },
  });

  return notifications.map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    photoUrl: n.photoUrl,
    scheduledAt: n.scheduledAt,
    isRead: n.reads.length > 0,
  }));
}

export async function markNotificationRead(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  await prisma.notificationRead.upsert({
    where: { userId_notificationId: { userId: user.id, notificationId } },
    update: {},
    create: { userId: user.id, notificationId },
  });

  return { success: true };
}
