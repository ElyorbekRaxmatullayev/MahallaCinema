import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Clock, Tv, ChevronLeft } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import { getCurrentUser } from "@/lib/telegram-auth";
import { withBasePath } from "@/lib/paths";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const currentUser = await getCurrentUser();
  const user = currentUser
    ? await prisma.user.findUnique({
        where: { id: currentUser.id },
        include: { favorites: { include: { event: true } } }
      })
    : null;

  const favorites = user?.favorites || [];

  return (
    <main className="min-h-screen pb-20 pt-28 px-4 bg-[#0a0404]">
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <h1 className="text-xl font-bold text-white">Избранное</h1>
      </div>

      <div className="flex flex-col gap-3">
        {favorites.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            Нет добавленных сеансов
          </div>
        )}
        {favorites.map((fav) => {
          const event = fav.event;
          return (
            <div key={event.id} className="glass p-3 flex gap-4 h-[130px] relative">
              <FavoriteButton eventId={event.id} isFav={true} />
              <div className="relative w-[90px] h-full rounded-xl overflow-hidden flex-shrink-0">
                <Image src={withBasePath(event.posterUrl)} alt={event.title} fill className="object-cover" unoptimized={true} />
              </div>
              
              <div className="flex flex-col flex-1 py-1">
                <div>
                  <span className={`badge mb-2 ${event.isFootball ? 'badge-football' : 'badge-kino'}`}>
                    {event.isFootball ? 'ФУТБОЛ' : 'КИНО'}
                  </span>
                  <h4 className="text-white font-bold text-[16px] leading-tight mb-2 truncate pr-6">{event.title}</h4>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-auto">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    {event.time}, {new Date(event.date).toLocaleDateString("ru-RU", { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <Link href={`/book/${event.id}`} className="flex items-center gap-1.5 bg-transparent border border-[#8a1f26] text-[#ffb4b9] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#8a1f26]/10 ml-auto">
                    <Tv size={14} />
                    Перейти
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
