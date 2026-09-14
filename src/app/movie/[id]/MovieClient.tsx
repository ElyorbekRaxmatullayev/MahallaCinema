"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Clock, Users, Tv, AlertCircle } from "lucide-react";
import { withBasePath } from "@/lib/paths";
import { isEventPast } from "@/lib/event-time";

interface EventData {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  time: string;
  posterUrl: string | null;
  isFootball: boolean;
  totalPoufs: number;
  availablePoufs: number;
  totalTapchans: number;
  availableTapchans: number;
}

export default function MovieClient({ event }: { event: EventData }) {
  const router = useRouter();
  const isPast = isEventPast(event.date, event.time);

  return (
    <main className="min-h-screen pb-24">
      <div className="relative h-[360px] w-full flex items-center justify-center overflow-hidden">
        {event.posterUrl ? (
          <>
            <Image src={withBasePath(event.posterUrl)} alt={event.title} fill className="object-cover opacity-30 blur-xl scale-110" unoptimized priority />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0404] via-[#0a0404]/30 to-[#0a0404]/70" />
            <div className="relative w-[180px] h-[260px] rounded-2xl overflow-hidden shadow-2xl mt-8 z-10 border border-white/10">
              <Image src={withBasePath(event.posterUrl)} alt={event.title} fill className="object-cover" unoptimized priority />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-[#140c0c]" />
        )}

        <div className="absolute top-4 left-4 z-20 flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg">
            <ChevronLeft size={24} />
          </button>
          <span className="text-white font-medium drop-shadow-md">Назад</span>
        </div>
      </div>

      <div className="px-4 mt-6">
        <span className={`badge mb-3 ${event.isFootball ? "badge-football" : "badge-kino"}`}>
          {event.isFootball ? "ФУТБОЛ" : "КИНО"}
        </span>
        <h1 className="text-3xl font-bold text-white mb-4 leading-tight">{event.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6 bg-[#140c0c] p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-gray-500" />
            {event.time}, {new Date(event.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
          </div>
          <div className="w-[1px] h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Users size={16} className="text-gray-500" />
            Пуфики: {event.availablePoufs}/{event.totalPoufs} · Тапчаны: {event.availableTapchans}/{event.totalTapchans}
          </div>
        </div>

        {event.description && (
          <>
            <h3 className="text-lg font-bold text-white mb-2">Описание</h3>
            <p className="text-gray-300 leading-relaxed text-sm opacity-90">{event.description}</p>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0404] via-[#0a0404] to-transparent z-50">
        <div className="max-w-md mx-auto">
          {isPast ? (
            <button
              disabled
              className="w-full bg-gray-800 text-gray-500 font-bold py-4 rounded-xl flex justify-center items-center gap-2 cursor-not-allowed"
            >
              <AlertCircle size={20} />
              Показ уже прошёл
            </button>
          ) : (
            <Link
              href={`/book/${event.id}`}
              className="w-full bg-[#8a1f26] hover:bg-[#a6252e] text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(138,31,38,0.3)] transition-all flex justify-center items-center gap-2"
            >
              <Tv size={18} />
              Забронировать
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
