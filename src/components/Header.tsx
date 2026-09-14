"use client";

import { ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";

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
      <div className="absolute inset-0 bg-[#0a0404]/95 backdrop-blur-md border-b border-white/5 pointer-events-none" />
      
      <div className="relative max-w-md mx-auto px-4 pt-8 pb-4 flex justify-between items-center min-h-[80px] pointer-events-auto">
        {/* Left Action (Back Button for Book page) */}
        <div className="w-10">
          {showBack && (
            <button 
              onClick={() => router.back()} 
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white backdrop-blur-md hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={20} className="mr-0.5" />
            </button>
          )}
        </div>
        {/* Centered Title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center text-center w-[70%]">
          <h1 className="text-white font-bold text-[17px] leading-tight tracking-wide whitespace-nowrap">
            Mahalla Cinema
          </h1>
          <span className="text-[9px] text-gray-400 font-medium tracking-widest uppercase mt-0.5">
            Кино под открытым небом
          </span>
        </div>
        
        {/* Notifications (Right) */}
        <NotificationBell />
      </div>
    </header>
  );
}
