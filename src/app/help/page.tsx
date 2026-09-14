import Link from "next/link";
import { ChevronLeft, MapPin, Phone, MessageCircle } from "lucide-react";

export default function HelpPage() {
  return (
    <main className="min-h-screen pt-[calc(var(--tg-safe-area-top,0px)+7rem)] pb-20 px-4">
      <div className="bg-[#140c0c] border border-white/5 rounded-2xl p-6 flex flex-col gap-6">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Свяжитесь с нами</h2>
          <p className="text-gray-400 text-sm">Мы всегда рады помочь вам с бронированием и ответить на любые вопросы.</p>
        </div>

        <div className="flex items-center gap-4 text-white p-4 bg-white/5 rounded-xl">
          <div className="bg-[#8a1f26]/20 p-3 rounded-full text-[#ffb4b9]">
            <MapPin size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-400">Наш адрес</div>
            <div className="font-bold">Yunusabad Gallery | Tashkent</div>
          </div>
        </div>

        <a href="tel:+998908281080" className="flex items-center gap-4 text-white p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
          <div className="bg-[#8a1f26]/20 p-3 rounded-full text-[#ffb4b9]">
            <Phone size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-400">Телефон</div>
            <div className="font-bold">+998 (90) 828-10-80</div>
          </div>
        </a>

        <a href="https://t.me/mahalla_cinema" target="_blank" className="flex items-center gap-4 text-white p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
          <div className="bg-[#8a1f26]/20 p-3 rounded-full text-[#ffb4b9]">
            <MessageCircle size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-400">Telegram поддержка</div>
            <div className="font-bold">Написать нам</div>
          </div>
        </a>
      </div>
    </main>
  );
}
