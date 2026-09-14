"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Clock, Calendar, CheckCircle2, XCircle, Ticket, QrCode, AlertCircle } from "lucide-react";
import { withBasePath } from "@/lib/paths";

const AWAITING_PAYMENT_WINDOW_MS = 15 * 60 * 1000;

interface BookingRow {
  id: string;
  zone: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string | Date;
  qrDataUrl: string | null;
  event: {
    id: string;
    title: string;
    isFootball: boolean;
    date: string | Date;
    time: string;
    posterUrl: string | null;
  };
}

const TABS: { key: string; label: string; statuses: string[] }[] = [
  { key: "ACTIVE", label: "Активные", statuses: ["CONFIRMED", "AWAITING_PAYMENT"] },
  { key: "COMPLETED", label: "Завершённые", statuses: ["COMPLETED"] },
  { key: "CANCELLED", label: "Отменённые", statuses: ["CANCELLED"] },
];

const ZONE_LABELS: Record<string, string> = { pouf: "Пуфики", tapchan: "Тапчан" };

const STATUS_META: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  CONFIRMED: {
    label: "Подтверждено",
    className: "text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20",
    icon: <CheckCircle2 size={10} />,
  },
  AWAITING_PAYMENT: {
    label: "Ожидает оплаты",
    className: "text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20",
    icon: <Clock size={10} />,
  },
  COMPLETED: {
    label: "Посещено",
    className: "text-[#60a5fa] bg-[#60a5fa]/10 border border-[#60a5fa]/20",
    icon: <CheckCircle2 size={10} />,
  },
  CANCELLED: {
    label: "Отменено",
    className: "text-gray-400 bg-white/5 border border-white/10",
    icon: <XCircle size={10} />,
  },
};

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function PendingPaymentBanner({ createdAt }: { createdAt: string | Date }) {
  const deadline = new Date(createdAt).getTime() + AWAITING_PAYMENT_WINDOW_MS;
  const [remaining, setRemaining] = useState(() => deadline - Date.now());

  useEffect(() => {
    const interval = setInterval(() => setRemaining(deadline - Date.now()), 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className="flex items-center gap-3 bg-[#2d1a0a] border border-[#f59e0b]/30 rounded-xl p-3 mb-4">
      <AlertCircle size={16} className="text-[#f59e0b] flex-shrink-0" />
      <p className="text-xs text-gray-300 flex-1 leading-snug">
        Оплатите счёт в боте Telegram, чтобы места были подтверждены.
      </p>
      <span className="text-[#f59e0b] font-bold">{formatCountdown(remaining)}</span>
    </div>
  );
}

export default function BookingsClient({ bookings }: { bookings: BookingRow[] }) {
  const [activeTab, setActiveTab] = useState("ACTIVE");
  const [qrBooking, setQrBooking] = useState<BookingRow | null>(null);

  const activeTabDef = TABS.find((t) => t.key === activeTab)!;
  const filtered = bookings.filter((b) => activeTabDef.statuses.includes(b.status));

  return (
    <main className="min-h-screen pb-20 pt-28 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Мои бронирования</h1>
        <p className="text-sm text-gray-300">
          Здесь вы можете посмотреть<br />
          все свои брони и их статус.
        </p>
      </div>

      <div className="flex bg-[#140c0c] rounded-2xl p-1 mb-6 border border-white/5 overflow-x-auto">
        {TABS.map((tab) => {
          const count = bookings.filter((b) => tab.statuses.includes(b.status)).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key ? "bg-[#2d0a0d] text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              <span className="whitespace-nowrap">{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.key ? "bg-[#140c0c] text-white" : "bg-white/10 text-gray-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        {filtered.length === 0 && <div className="text-center text-gray-500 py-10">Нет бронирований</div>}

        {filtered.map((booking) => {
          const meta = STATUS_META[booking.status] ?? STATUS_META.CONFIRMED;
          return (
            <div key={booking.id} className="glass rounded-2xl overflow-hidden flex flex-col p-4">
              <div className="flex gap-4 mb-4">
                <div className="relative w-[70px] h-[95px] rounded-lg overflow-hidden flex-shrink-0 bg-[#1a1010]">
                  {booking.event.posterUrl && (
                    <Image src={withBasePath(booking.event.posterUrl)} alt={booking.event.title} fill className="object-cover" unoptimized />
                  )}
                </div>

                <div className="flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`badge ${booking.event.isFootball ? "badge-football" : "badge-kino"}`}>
                      {booking.event.isFootball ? "ФУТБОЛ" : "КИНО"}
                    </span>
                    <span className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded-md ${meta.className}`}>
                      {meta.icon}
                      {meta.label}
                    </span>
                  </div>

                  <h4 className="text-white font-bold text-[15px] mb-2 leading-tight">{booking.event.title}</h4>

                  <div className="flex justify-between text-xs text-gray-400">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(booking.event.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {booking.event.time}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 text-right items-end">
                      <span>Заказ №{booking.id.slice(-6).toUpperCase()}</span>
                      <span>{new Date(booking.createdAt).toLocaleString("ru-RU")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {booking.status === "AWAITING_PAYMENT" && <PendingPaymentBanner createdAt={booking.createdAt} />}

              <div className="w-full border-t border-dashed border-white/10 mb-4" />

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Зона</span>
                  <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                    <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
                      <Ticket size={12} className="text-gray-400" />
                    </div>
                    <div>
                      <div>{ZONE_LABELS[booking.zone] ?? booking.zone}</div>
                      <div className="text-[10px] text-gray-400 font-normal">x{booking.quantity}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Сумма</span>
                  <div className="text-white font-bold flex items-center gap-2">
                    {booking.totalPrice.toLocaleString("ru-RU")} <span className="text-xs text-gray-400 font-normal">сум</span>
                  </div>
                </div>

                {booking.qrDataUrl && (
                  <button
                    onClick={() => setQrBooking(booking)}
                    className="flex items-center gap-1.5 bg-[#8a1f26]/10 border border-[#8a1f26]/40 text-[#ffb4b9] px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#8a1f26]/20"
                  >
                    <QrCode size={16} />
                    QR-код
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {qrBooking && qrBooking.qrDataUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setQrBooking(null)}
        >
          <div
            className="bg-[#140c0c] border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 max-w-[320px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-center">{qrBooking.event.title}</h3>
            <div className="bg-white p-3 rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrBooking.qrDataUrl} alt="QR код брони" width={240} height={240} />
            </div>
            <p className="text-xs text-gray-400 text-center">Покажите этот код при входе для подтверждения брони</p>
            <button
              onClick={() => setQrBooking(null)}
              className="w-full bg-[#8a1f26] text-white font-bold py-3 rounded-xl mt-2"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
