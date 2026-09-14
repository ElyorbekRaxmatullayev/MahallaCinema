import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/telegram-auth";
import { getQrDataUrl } from "@/lib/qr";
import BookingsClient from "./BookingsClient";
import AuthPending from "@/components/AuthPending";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const user = await getCurrentUser();
  if (!user) return <AuthPending />;

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });

  const bookingsWithQr = await Promise.all(
    bookings.map(async (booking) => ({
      ...booking,
      qrDataUrl: booking.status === "CONFIRMED" ? await getQrDataUrl(booking.id) : null,
    }))
  );

  return <BookingsClient bookings={bookingsWithQr} />;
}
