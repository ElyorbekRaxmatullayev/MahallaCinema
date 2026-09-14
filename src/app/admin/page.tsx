import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";
import { getCurrentUser, isAdminTelegramId } from "@/lib/telegram-auth";
import { notFound } from "next/navigation";
import AuthPending from "@/components/AuthPending";

// Opt out of caching for admin panel
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Split so a real admin's first load (before the session cookie lands)
  // gets a loading state instead of a 404 — non-admins still get notFound()
  // once we know who they are, keeping the route's existence non-obvious to them.
  const currentUser = await getCurrentUser();
  if (!currentUser) return <AuthPending />;
  if (!isAdminTelegramId(currentUser.telegramId)) return notFound();

  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
    include: { bookings: true },
  });

  const users = await prisma.user.findMany({
    include: { bookings: true },
    orderBy: { createdAt: "desc" }
  });

  const promoCodes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });

  const notifications = await prisma.notification.findMany({ orderBy: { createdAt: "desc" } });

  const allBookings = events.flatMap((e) => e.bookings);

  // Money is never refunded once collected, so cancelled/no-show bookings still count as
  // revenue — but AWAITING_PAYMENT bookings haven't actually been paid for yet, so they're excluded.
  const paidBookings = allBookings.filter((b) => b.status !== "AWAITING_PAYMENT");

  const stats = {
    totalUsers: users.length,
    totalBookings: allBookings.length,
    totalRevenue: paidBookings.reduce((acc, curr) => acc + curr.totalPrice, 0)
  };

  const eventStats = events.map((event) => {
    const { bookings, ...eventFields } = event;
    const paid = bookings.filter((b) => b.status !== "AWAITING_PAYMENT");
    return {
      ...eventFields,
      bookingsCount: bookings.length,
      poufsBooked: bookings.filter((b) => b.zone === "pouf").reduce((acc, b) => acc + b.quantity, 0),
      tapchansBooked: bookings.filter((b) => b.zone === "tapchan").reduce((acc, b) => acc + b.quantity, 0),
      completedCount: bookings.filter((b) => b.status === "COMPLETED").length,
      cancelledCount: bookings.filter((b) => b.status === "CANCELLED").length,
      revenue: paid.reduce((acc, b) => acc + b.totalPrice, 0),
    };
  });

  return (
    <AdminClient
      events={eventStats}
      users={users}
      stats={stats}
      promoCodes={promoCodes}
      notifications={notifications}
    />
  );
}
