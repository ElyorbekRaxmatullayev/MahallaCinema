"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Ticket, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/book/") || pathname.startsWith("/movie/")) {
    return null;
  }

  const navItems = [
    { label: "Главная", icon: Home, href: "/" },
    { label: "Афиша", icon: Calendar, href: "/afisha" },
    { label: "Бронирования", icon: Ticket, href: "/bookings" },
    { label: "Профиль", icon: User, href: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2">
      <div className="max-w-md mx-auto relative">
        {/* Navigation background */}
        <div className="absolute inset-0 bg-[#0a0404]/90 backdrop-blur-xl border-y border-white/10 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]" />
        
        <div className="relative flex justify-between items-center px-6 py-3">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={idx} 
                href={item.href}
                className="flex flex-col items-center gap-1.5 min-w-[64px]"
              >
                <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                  isActive ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                }`}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-white" : "text-gray-500"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
