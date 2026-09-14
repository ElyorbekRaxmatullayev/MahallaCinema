"use server";

import { getCurrentUser } from "@/lib/telegram-auth";
import { validatePromoCode } from "@/lib/promo";

type PromoCheckResult = { valid: true; type: "PERCENT" | "FIXED"; value: number } | { valid: false; error: string };

export async function checkPromoCode(code: string): Promise<PromoCheckResult> {
  const user = await getCurrentUser();
  if (!user) return { valid: false, error: "Пользователь не найден" };

  const result = await validatePromoCode(user.id, code);
  if (!result.valid) return result;

  return { valid: true, type: result.promo.type as "PERCENT" | "FIXED", value: result.promo.value };
}
