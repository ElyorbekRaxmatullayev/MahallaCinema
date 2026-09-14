import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Heart, HelpCircle, Info, Star } from "lucide-react";
import { getCurrentUser } from "@/lib/telegram-auth";
import { notFound } from "next/navigation";
import AuthPending from "@/components/AuthPending";

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

  return (
    <main className="min-h-screen pb-20 pt-28 px-4 bg-[#0a0404]">

      {/* Бонусный баланс */}
      <div className="bg-[#140c0c] rounded-2xl p-6 mb-4 border border-white/5 relative">
        <div className="text-sm text-gray-400 mb-1">Бонусный баланс</div>
        <div className="text-3xl font-bold text-white flex items-end gap-1 mb-6">
          {user.balance.toLocaleString("ru-RU")} <span className="text-lg text-gray-400 font-normal mb-1">сум</span>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>1 бонус = 1 000 сум</span>
          <ChevronRight size={14} className="text-gray-600" />
        </div>

        <div className="absolute top-6 right-6 bg-[#2a1314] p-3 rounded-xl border border-[#3a1a1b]">
          <Star size={24} className="text-white" />
        </div>
      </div>

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
