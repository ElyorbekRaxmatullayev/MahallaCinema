import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight, Heart, HelpCircle, Info } from "lucide-react";
import { getCurrentUser } from "@/lib/telegram-auth";
import { notFound } from "next/navigation";
import AuthPending from "@/components/AuthPending";
import { getCardNumber, formatCardNumber } from "@/lib/card";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return <AuthPending />;

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    include: {
      favorites: {
        include: { event: true }
      }
    }
  });
  if (!user) return notFound();

  const menuItems = [
    { icon: <Heart size={20} className="text-[#e94553]" />, label: "Избранное", href: "/profile/favorites" },
    { icon: <HelpCircle size={20} className="text-[#e94553]" />, label: "Помощь и поддержка", href: "/help" },
    { icon: <Info size={20} className="text-[#e94553]" />, label: "О приложении", href: "#" },
  ];

  const initial = (user.firstName || "?").trim().charAt(0).toUpperCase();
  const cardNumber = formatCardNumber(getCardNumber(user.telegramId));

  return (
    <main className="min-h-screen pb-20 pt-28 px-4 bg-[#0a0404]">

      {/* Фото и имя */}
      <div className="flex flex-col items-center mb-6">
        {user.photoUrl ? (
          // Telegram CDN — external, unconfigured domain, so a plain <img> instead of next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoUrl}
            alt={user.firstName || "Профиль"}
            className="w-20 h-20 rounded-full object-cover border-2 border-white/10"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[#2a1314] border-2 border-white/10 flex items-center justify-center text-2xl font-bold text-white">
            {initial}
          </div>
        )}
        <div className="text-white font-bold text-lg mt-3">{user.firstName || "Без имени"}</div>
      </div>

      {/* Карта / бонусный баланс */}
      <div className="relative rounded-2xl p-5 mb-4 overflow-hidden bg-gradient-to-br from-[#3a1216] via-[#5c161b] to-[#1a0608] border border-white/10 shadow-lg shadow-black/40">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -right-2 top-10 w-20 h-20 rounded-full bg-white/5" />

        <div className="relative flex justify-between items-start mb-8">
          <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest">Mahalla Cinema</span>
          <span className="text-[11px] text-white/50 uppercase tracking-widest">Bonus card</span>
        </div>

        <div className="relative text-xl font-bold text-white tracking-widest font-mono mb-6">{cardNumber}</div>

        <div className="relative flex justify-between items-end gap-3">
          <div className="min-w-0">
            <div className="text-[10px] text-white/50 uppercase tracking-wide">Держатель карты</div>
            <div className="text-sm font-bold text-white uppercase truncate">{user.firstName || "Без имени"}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[10px] text-white/50 uppercase tracking-wide">Баланс</div>
            <div className="text-lg font-bold text-white whitespace-nowrap">
              {user.balance.toLocaleString("ru-RU")} <span className="text-xs font-normal text-white/60">сум</span>
            </div>
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-500 mb-6 px-1">1 бонус = 1 000 сум</div>

      {/* Меню */}
      <div className="flex flex-col gap-2">
        {menuItems.map((item, index) => (
          <Link key={index} href={item.href} className="bg-[#140c0c] border border-white/5 p-4 rounded-2xl flex items-center justify-between group transition-colors hover:bg-white/5">
            <div className="flex items-center gap-4">
              {item.icon}
              <span className="font-bold text-white text-[15px]">{item.label}</span>
            </div>
            <ChevronRight size={20} className="text-gray-600 group-hover:text-white transition-colors" />
          </Link>
        ))}
      </div>

    </main>
  );
}
