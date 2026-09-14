"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/telegram-auth";

export async function toggleFavorite(eventId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false };

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: eventId,
        }
      }
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
    } else {
      await prisma.favorite.create({
        data: {
          userId: user.id,
          eventId: eventId,
        }
      });
    }
    
    revalidatePath("/");
    revalidatePath("/profile");
    revalidatePath("/afisha");
    
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}
