"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Clock, Tv } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import { withBasePath } from "@/lib/paths";
import { isEventPast } from "@/lib/event-time";

export default function AfishaClient({ events, favoriteIds }: { events: any[], favoriteIds: string[] }) {
  // Generate next 7 days for the date picker
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      day: d.toLocaleDateString("ru-RU", { weekday: "short" }),
      date: d.getDate().toString(),
      month: d.toLocaleDateString("ru-RU", { month: "short" }),
      fullDate: d.toDateString() // to filter
    };
  });

  const [activeDateObj, setActiveDateObj] = useState(weekDays[0]);

  // Filter events for the active date, excluding ones that have already started/passed
  const filteredEvents = events
    .filter(e => new Date(e.date).toDateString() === activeDateObj.fullDate)
    .filter(e => !isEventPast(e.date, e.time));

  const dateStr = `${activeDateObj.day} / ${activeDateObj.date} ${activeDateObj.month}`;

  return (
    <main className="min-h-screen pb-20 pt-28 px-4">
      <p className="text-sm text-gray-300 mb-4">
        Выберите день, чтобы посмотреть<br />
        сеансы и забронировать места
      </p>

      {/* Days — all 7 fit in one row, no scroll needed */}
      <div className="grid grid-cols-7 gap-1.5 mb-5">
        {weekDays.map((d, i) => (
          <button
            key={i}
            onClick={() => setActiveDateObj(d)}
            className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl transition-all ${
              activeDateObj.date === d.date
                ? "bg-[#8a1f26] text-white shadow-[0_0_14px_rgba(138,31,38,0.45)]"
                : "bg-[#140c0c] border border-white/5 text-gray-400"
            }`}
          >
            <span className="text-[10px] uppercase tracking-wide">{d.day}</span>
            <span className="text-lg font-bold leading-none">{d.date}</span>
          </button>
        ))}
      </div>

      {/* Schedule List */}
      <div className="flex flex-col gap-6">
        {filteredEvents.length === 0 && (
          <div className="flex justify-center py-6">
            <Image
              src={withBasePath("/logos/no-films.png")}
              alt="Фильмов пока не имеется"
              width={220}
              height={220}
              className="object-contain w-full max-w-[220px] h-auto"
              unoptimized
            />
          </div>
        )}
        
        {filteredEvents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-[#8a1f26] rounded-full" />
              <h3 className="text-base font-bold text-white capitalize">{dateStr}</h3>
            </div>

            <div className="flex flex-col gap-3">
              {filteredEvents.map((event) => (
                <div key={event.id} className="glass p-3 flex gap-4 h-[130px] relative">
                  <FavoriteButton eventId={event.id} isFav={favoriteIds.includes(event.id)} />
                  <div className="relative w-[90px] h-full rounded-xl overflow-hidden flex-shrink-0">
                    {event.posterUrl ? (
                      <Image src={withBasePath(event.posterUrl)} alt={event.title} fill className="object-cover" unoptimized={true} />
                    ) : (
                      <div className="w-full h-full bg-[#1a1010]" />
                    )}
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
                        {event.time}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-gray-400">
                        Мест: {event.availablePoufs + event.availableTapchans}
                      </span>
                      <Link href={`/book/${event.id}`} className="flex items-center gap-1.5 bg-transparent border border-[#8a1f26] text-[#ffb4b9] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#8a1f26]/10">
                        <Tv size={14} />
                        Забронировать
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
