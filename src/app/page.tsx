import Link from "next/link";
import Image from "next/image";
import { Clock, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import FavoriteButton from "@/components/FavoriteButton";
import { getCurrentUser } from "@/lib/telegram-auth";
import { withBasePath } from "@/lib/paths";
import { isEventPast } from "@/lib/event-time";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Bounded at the DB level (not just today: yesterday's date can still have
  // a not-yet-past event across a timezone/midnight edge) — isEventPast still
  // does the exact filtering, this just avoids scanning the whole history.
  const startOfYesterday = new Date();
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);

  const upcomingEvents = await prisma.event.findMany({
    where: { date: { gte: startOfYesterday } },
    orderBy: { date: "asc" },
    take: 20,
  });
  const events = upcomingEvents.filter((e) => !isEventPast(e.date, e.time)).slice(0, 5);

  const currentUser = await getCurrentUser();
  const user = currentUser
    ? await prisma.user.findUnique({ where: { id: currentUser.id }, include: { favorites: true } })
    : null;
  const favoriteIds = user?.favorites.map(f => f.eventId) || [];

  return (
    <main className="min-h-screen pb-20">
      <section className="relative w-full h-[280px]">
        {/* Hero Background Image */}
        <Image
          src={withBasePath("/hero-bg.png")}
          alt="Mahalla Cinema"
          fill
          className="object-cover"
          priority
          unoptimized={true}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0404] via-[#0a0404]/50 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 px-4 text-center">
          <p className="text-gray-300 text-sm max-w-[280px] leading-relaxed">
            Кино под звёздами, футбол на большом экране и атмосфера, которую хочется повторить.
          </p>
        </div>
      </section>

      <div className="px-4">
        {/* Weekly Schedule Header */}
        <div className="flex items-center justify-between mb-4 mt-2">
          <h2 className="text-xl font-bold text-white">Афиша недели</h2>
        </div>

        {/* Event Cards */}
        <div className="flex flex-col gap-3 mb-6">
          {events.length === 0 && (
            <div className="text-center text-gray-400 py-10 bg-[#140c0c] rounded-xl border border-white/5">
              Сеансов пока нет
            </div>
          )}
          {events.map((event) => (
            <div key={event.id} className="glass p-3 flex gap-4 h-[120px] relative">
              <FavoriteButton eventId={event.id} isFav={favoriteIds.includes(event.id)} />
              
              <div className="relative w-[80px] h-full rounded-xl overflow-hidden flex-shrink-0">
                {event.posterUrl ? (
                  <Image src={withBasePath(event.posterUrl)} alt={event.title} fill className="object-cover" unoptimized={true} />
                ) : (
                  <div className="w-full h-full bg-[#1a1010]" />
                )}
              </div>
              
              <div className="flex flex-col flex-1 justify-between py-1">
                <div>
                  <span className={`badge mb-2 ${event.isFootball ? 'badge-football' : 'badge-kino'}`}>
                    {event.isFootball ? 'ФУТБОЛ' : 'КИНО'}
                  </span>
                  <h4 className="text-white font-bold text-[15px] leading-tight mb-1 truncate pr-6">{event.title}</h4>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock size={12} />
                      {event.time}, {event.date.toLocaleDateString("ru-RU", { day: 'numeric', month: 'long' })}
                    </div>
                  </div>
                  <Link href={`/movie/${event.id}`} prefetch={true} className="bg-transparent border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/5">
                    Подробнее
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
