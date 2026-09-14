"use server";

import { prisma } from "@/lib/prisma";
import { verifyInitData, createSessionCookie } from "@/lib/telegram-auth";

export async function verifyAndLogin(initData: string) {
  const data = verifyInitData(initData);
  if (!data) return { success: false, error: "Не удалось проверить данные Telegram" };

  await prisma.user.upsert({
    where: { telegramId: data.id },
    update: { firstName: data.firstName, photoUrl: data.photoUrl },
    create: { telegramId: data.id, firstName: data.firstName, photoUrl: data.photoUrl },
  });

  await createSessionCookie(data.id);

  return { success: true };
}
