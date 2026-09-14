"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { getNotifications, markNotificationRead } from "@/app/actions/notifications";
import { withBasePath } from "@/lib/paths";

interface NotificationItem {
  id: string;
  title: string;
  description: string | null;
  photoUrl: string | null;
  scheduledAt: string | Date;
  isRead: boolean;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getNotifications().then((data) => {
      setItems(data as NotificationItem[]);
      setLoaded(true);
    });
  }, []);

  const unreadCount = items.filter((i) => !i.isRead).length;

  async function handleItemClick(item: NotificationItem) {
    if (item.isRead) return;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i)));
    await markNotificationRead(item.id);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white backdrop-blur-md hover:bg-white/10 transition-colors relative z-10"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#e94553] rounded-full border border-[#0a0404]" />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-full max-w-[360px] bg-[#0a0404] border-l border-white/10 shadow-2xl flex flex-col slide-in-right">
            <div className="flex items-center justify-between p-4 border-b border-white/5 flex-shrink-0">
              <h2 className="text-white font-bold text-lg">Уведомления</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {loaded && items.length === 0 && (
                <div className="text-center text-gray-500 py-10 text-sm">Пока нет уведомлений</div>
              )}
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`text-left bg-[#140c0c] border rounded-2xl p-3 flex gap-3 transition-colors ${
                    item.isRead ? "border-white/5" : "border-[#8a1f26]/40"
                  }`}
                >
                  {item.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={withBasePath(item.photoUrl)}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-[#1a1010]"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!item.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#e94553] flex-shrink-0" />}
                      <span className="text-white font-bold text-sm truncate">{item.title}</span>
                    </div>
                    {item.description && <p className="text-xs text-gray-400 line-clamp-2 mb-1">{item.description}</p>}
                    <span className="text-[10px] text-gray-500">{new Date(item.scheduledAt).toLocaleString("ru-RU")}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
