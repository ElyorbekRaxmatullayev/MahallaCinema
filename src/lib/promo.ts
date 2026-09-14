import { prisma } from "@/lib/prisma";

export type ValidPromo = { id: string; type: string; value: number; maxUses: number | null };
export type PromoValidationResult = { valid: true; promo: ValidPromo } | { valid: false; error: string };

/** Shared promo-code validation used by both the optimistic client-side check and confirmBooking's authoritative check. */
export async function validatePromoCode(userId: string, code: string): Promise<PromoValidationResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { valid: false, error: "Введите промокод" };

  const promo = await prisma.promoCode.findUnique({ where: { code: normalized } });
  if (!promo || !promo.isActive) return { valid: false, error: "Промокод недействителен" };

  if (promo.maxUses !== null && promo.usesCount >= promo.maxUses) {
    return { valid: false, error: "Промокод исчерпан" };
  }

  const alreadyUsed = await prisma.booking.findFirst({ where: { userId, promoCodeId: promo.id } });
  if (alreadyUsed) return { valid: false, error: "Вы уже использовали этот промокод" };

  return { valid: true, promo };
}
