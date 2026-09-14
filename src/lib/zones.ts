import type { Prisma } from "@prisma/client";

export const ZONE_LABELS: Record<string, string> = { pouf: "Пуфики", tapchan: "Тапчан" };

function inventoryField(zone: string): "availablePoufs" | "availableTapchans" {
  return zone === "pouf" ? "availablePoufs" : "availableTapchans";
}

/**
 * Atomically reserves `quantity` seats in `zone` for `eventId` — the WHERE
 * guard (field >= quantity) closes the check-then-act race between reading
 * availability and decrementing it under concurrent bookings. Returns false
 * (no rows touched, nothing decremented) if not enough seats remained.
 */
export async function reserveInventory(
  tx: Prisma.TransactionClient,
  eventId: string,
  zone: string,
  quantity: number
): Promise<boolean> {
  const field = inventoryField(zone);
  const result = await tx.event.updateMany({
    where: { id: eventId, [field]: { gte: quantity } },
    data: { [field]: { decrement: quantity } },
  });
  return result.count > 0;
}

/** Restores `quantity` previously-reserved seats in `zone` for `eventId`. */
export async function releaseInventory(
  tx: Prisma.TransactionClient,
  eventId: string,
  zone: string,
  quantity: number
): Promise<void> {
  const field = inventoryField(zone);
  await tx.event.update({ where: { id: eventId }, data: { [field]: { increment: quantity } } });
}
