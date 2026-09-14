import { prisma } from "@/lib/prisma";
import AfishaClient from "./AfishaClient";
import { getCurrentUser } from "@/lib/telegram-auth";

export const dynamic = "force-dynamic";

export default async function AfishaPage() {
  const events = await prisma.event.findMany({
    orderBy: { date: "asc" }
  });

  const currentUser = await getCurrentUser();
  const user = currentUser
    ? await prisma.user.findUnique({ where: { id: currentUser.id }, include: { favorites: true } })
    : null;

  const favoriteIds = user?.favorites.map((f: any) => f.eventId) || [];

  return <AfishaClient events={events} favoriteIds={favoriteIds} />;
}
