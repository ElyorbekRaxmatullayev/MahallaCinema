"use client";

import { ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";

/**
 * No bar/title anymore — each page shows its own heading where the bar used
 * to be. Just the back button and notification bell float in the corners.
 */
export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname.startsWith("/movie/") || pathname === "/profile") {
    return null;
  }

  const isBookPage = pathname.startsWith("/book/");
  const showBack = isBookPage || pathname === "/help" || pathname === "/profile/favorites";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-md mx-auto px-4 pt-8 flex justify-between items-center">
        <div className="w-10 pointer-events-auto">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white backdrop-blur-md hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={20} className="mr-0.5" />
            </button>
          )}
        </div>

        <div className="pointer-events-auto">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
