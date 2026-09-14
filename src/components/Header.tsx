"use client";

import { ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";

// Same background as the page itself (var(--background), blurred) instead of
// the old solid near-black bar — and each route's own title instead of the
// static "Mahalla Cinema" branding that used to sit there on every page.
const PAGE_TITLES: Record<string, string> = {
  "/": "Афиша недели",
  "/afisha": "Афиша",
  "/bookings": "Мои бронирования",
  "/help": "Помощь и поддержка",
  "/profile/favorites": "Избранное",
  "/admin": "Админ панель",
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname.startsWith("/movie/") || pathname === "/profile") {
    return null;
  }

  const isBookPage = pathname.startsWith("/book/");
  const showBack = isBookPage || pathname === "/help" || pathname === "/profile/favorites";
  const title = PAGE_TITLES[pathname] ?? (isBookPage ? "Бронирование" : "");

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-[var(--background)]/85 backdrop-blur-md border-b border-white/5" />

      <div className="relative max-w-md mx-auto px-4 pb-4 flex items-center gap-3 min-h-[80px] pt-[calc(var(--tg-safe-area-top,0px)+2rem)]">
        <div className="w-9 flex-shrink-0">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white backdrop-blur-md hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={20} className="mr-0.5" />
            </button>
          )}
        </div>

        <h1 className="flex-1 text-white font-bold text-[18px] leading-tight truncate">{title}</h1>

        <NotificationBell />
      </div>
    </header>
  );
}
