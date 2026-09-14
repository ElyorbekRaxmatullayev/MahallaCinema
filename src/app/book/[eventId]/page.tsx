import { prisma } from "@/lib/prisma";
import BookClient from "./BookClient";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/telegram-auth";
import AuthPending from "@/components/AuthPending";

export const dynamic = "force-dynamic";

export default async function BookEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    return notFound();
  }

  const user = await getCurrentUser();
  if (!user) return <AuthPending />;

  return (
    <BookClient event={event} userBalance={user.balance} />
  );
}
