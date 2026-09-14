"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  addEvent,
  deleteEvent,
  queueNotification,
  addPromoCode,
  togglePromoCode,
  deletePromoCode,
  adjustUserBalance,
  adjustBalanceByCard,
} from "./actions";
import { uploadFile } from "@/lib/upload";
import Dropdown from "@/components/Dropdown";
import DatePicker from "@/components/DatePicker";
import TimePicker from "@/components/TimePicker";
import QrScanner from "@/components/QrScanner";
import { getCardNumber, formatCardNumber } from "@/lib/card";

interface EventStat {
  id: string;
  title: string;
  date: Date | string;
  time: string;
  isFootball: boolean;
  bookingsCount: number;
  poufsBooked: number;
  tapchansBooked: number;
  completedCount: number;
  cancelledCount: number;
  revenue: number;
}

interface UserRow {
  id: string;
  telegramId: string;
  firstName: string | null;
  balance: number;
  bookings: unknown[];
}

interface PromoCodeRow {
  id: string;
  code: string;
  type: string;
  value: number;
  isActive: boolean;
  maxUses: number | null;
  usesCount: number;
}

interface NotificationRow {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: Date | string;
  status: string;
}

interface Stats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
}

const TABS = [
  { key: "movies", label: "Сеансы" },
  { key: "users", label: "Пользователи" },
  { key: "stats", label: "Статистика" },
  { key: "promocodes", label: "Промокоды" },
  { key: "broadcast", label: "Рассылка" },
  { key: "scanner", label: "Сканер" },
];

const EVENT_TYPE_OPTIONS = [
  { value: "КИНО", label: "КИНО" },
  { value: "ФУТБОЛ", label: "ФУТБОЛ" },
];

const PROMO_TYPE_OPTIONS = [
  { value: "PERCENT", label: "Процент" },
  { value: "FIXED", label: "Фиксированная сумма" },
];

function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="bg-white/5 rounded-lg p-3">
      <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`font-bold ${accent ? "text-[#e94553]" : "text-white"}`}>{value}</div>
    </div>
  );
}

function UserBalanceControl({ userId }: { userId: string }) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const handleAdjust = async (sign: 1 | -1) => {
    const value = parseInt(amount, 10);
    if (!value || value <= 0) return;
    setBusy(true);
    await adjustUserBalance(userId, value * sign);
    setBusy(false);
    setAmount("");
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Сумма"
        className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm"
      />
      <button
        onClick={() => handleAdjust(1)}
        disabled={busy || !amount}
        className="bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-40 flex-shrink-0"
      >
        Начислить
      </button>
      <button
        onClick={() => handleAdjust(-1)}
        disabled={busy || !amount}
        className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-40 flex-shrink-0"
      >
        Списать
      </button>
    </div>
  );
}

function CardBalanceControl() {
  const [cardNumber, setCardNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleAdjust = async (sign: 1 | -1) => {
    const value = parseInt(amount, 10);
    if (!cardNumber.trim() || !value || value <= 0) return;
    setBusy(true);
    setMessage(null);
    const res = await adjustBalanceByCard(cardNumber, value * sign);
    setBusy(false);
    if (res?.success) {
      setMessage({ ok: true, text: `Готово: ${res.userName}` });
      setCardNumber("");
      setAmount("");
    } else {
      setMessage({ ok: false, text: res?.error || "Ошибка" });
    }
  };

  return (
    <div className="bg-[#140c0c] p-4 rounded-2xl border border-white/5 mb-8">
      <h2 className="text-lg font-bold text-white mb-4">Баланс по номеру карты</h2>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          placeholder="Номер карты"
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Сумма"
            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl p-3 text-white"
          />
          <button
            onClick={() => handleAdjust(1)}
            disabled={busy || !amount || !cardNumber.trim()}
            className="bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 px-4 py-3 rounded-xl text-sm font-medium disabled:opacity-40 flex-shrink-0"
          >
            Начислить
          </button>
          <button
            onClick={() => handleAdjust(-1)}
            disabled={busy || !amount || !cardNumber.trim()}
            className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-3 rounded-xl text-sm font-medium disabled:opacity-40 flex-shrink-0"
          >
            Списать
          </button>
        </div>
        {message && (
          <div className={`text-sm ${message.ok ? "text-green-400" : "text-red-400"}`}>{message.text}</div>
        )}
      </div>
    </div>
  );
}

export default function AdminClient({
  events,
  users,
  stats,
  promoCodes,
  notifications,
}: {
  events: EventStat[];
  users: UserRow[];
  stats: Stats;
  promoCodes: PromoCodeRow[];
  notifications: NotificationRow[];
}) {
  const [activeTab, setActiveTab] = useState("movies");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Add-event form state
  const [isUploading, setIsUploading] = useState(false);
  const [posterUrl, setPosterUrl] = useState("");
  const [eventType, setEventType] = useState("КИНО");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");

  // Broadcast form state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [broadcastPhotoUrl, setBroadcastPhotoUrl] = useState("");
  const [broadcastDate, setBroadcastDate] = useState("");
  const [broadcastTime, setBroadcastTime] = useState("");

  // Promo code form state
  const [promoType, setPromoType] = useState("PERCENT");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    const result = await uploadFile(formData);
    setIsUploading(false);
    if ("url" in result) {
      setPosterUrl(result.url);
    } else {
      alert(result.error);
    }
  };

  const handleBroadcastPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    const result = await uploadFile(formData);
    setIsUploadingPhoto(false);
    if ("url" in result) {
      setBroadcastPhotoUrl(result.url);
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="min-h-screen p-4 pt-28">
      <h1 className="text-2xl font-bold text-white mb-6">Админ панель</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.key ? "bg-[#8a1f26] text-white" : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "movies" && (
        <div>
          <div className="bg-[#140c0c] p-4 rounded-2xl border border-white/5 mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Добавить сеанс</h2>
            <form
              action={async (formData) => {
                await addEvent(formData);
                setPosterUrl("");
                setEventType("КИНО");
                setEventDate("");
                setEventTime("");
              }}
              className="flex flex-col gap-4"
            >
              <input type="text" name="title" placeholder="Название фильма" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
              <textarea name="description" placeholder="Описание" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white h-24" />

              <div className="flex gap-4">
                <Dropdown className="w-1/2" name="type" value={eventType} onChange={setEventType} options={EVENT_TYPE_OPTIONS} />
                <DatePicker className="w-1/2" name="date" value={eventDate} onChange={setEventDate} />
              </div>

              <div className="flex gap-4">
                <TimePicker className="w-1/2" name="time" value={eventTime} onChange={setEventTime} />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Обложка (фото)</label>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="text-white text-sm" />
                <input type="hidden" name="posterUrl" value={posterUrl} required />
                {isUploading && <span className="text-sm text-[#ffb4b9] ml-2">Загрузка...</span>}
                {posterUrl && <span className="text-sm text-green-400 ml-2">Загружено!</span>}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="text-xs text-gray-400">Кол-во пуфиков</label>
                  <input type="number" name="totalPoufs" defaultValue="50" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Цена пуфика</label>
                  <input type="number" name="poufPrice" defaultValue="80000" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Кол-во тапчанов</label>
                  <input type="number" name="totalTapchans" defaultValue="10" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Цена тапчана</label>
                  <input type="number" name="tapchanPrice" defaultValue="320000" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
                </div>
              </div>

              <button type="submit" className="w-full bg-[#8a1f26] text-white font-bold py-3 rounded-xl mt-2">
                Добавить сеанс
              </button>
            </form>
          </div>

          <h2 className="text-lg font-bold text-white mb-4">Список сеансов</h2>
          <div className="flex flex-col gap-3">
            {events.map((e) => (
              <div key={e.id} className="bg-[#140c0c] border border-white/5 rounded-xl overflow-hidden">
                <div className="p-4 flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <div className="text-white font-bold truncate">{e.title}</div>
                    <div className="text-sm text-gray-400">{e.time}, {new Date(e.date).toLocaleDateString("ru-RU")}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => setExpandedEventId(expandedEventId === e.id ? null : e.id)}
                      className="text-gray-400 hover:text-white text-sm font-medium flex items-center gap-1"
                    >
                      Статистика
                      <ChevronDown size={14} className={`transition-transform ${expandedEventId === e.id ? "rotate-180" : ""}`} />
                    </button>
                    <button onClick={() => deleteEvent(e.id)} className="text-red-400 hover:text-red-300 text-sm font-medium">
                      Удалить
                    </button>
                  </div>
                </div>

                {expandedEventId === e.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-3">
                      <StatTile label="Бронирований" value={e.bookingsCount} />
                      <StatTile label="Доход" value={`${e.revenue.toLocaleString("ru-RU")} сум`} accent />
                      <StatTile label="Пуфиков забронировано" value={e.poufsBooked} />
                      <StatTile label="Тапчанов забронировано" value={e.tapchansBooked} />
                      <StatTile label="Завершено" value={e.completedCount} />
                      <StatTile label="Отменено" value={e.cancelledCount} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div>
          <CardBalanceControl />

          <h2 className="text-lg font-bold text-white mb-4">Пользователи</h2>
          <div className="flex flex-col gap-3">
            {users.map((u) => (
              <div key={u.id} className="bg-[#140c0c] border border-white/5 p-4 rounded-xl">
                <div className="text-white font-bold">{u.firstName || "Без имени"}</div>
                <div className="text-sm text-gray-400">ID: {u.telegramId}</div>
                <div className="text-xs text-gray-500 font-mono mt-0.5">{formatCardNumber(getCardNumber(u.telegramId))}</div>
                <div className="text-sm text-[#ffb4b9] mt-1">Баланс: {u.balance.toLocaleString("ru-RU")} сум</div>
                <div className="text-xs text-gray-500 mt-2">Бронирований: {u.bookings.length}</div>
                <UserBalanceControl userId={u.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#140c0c] border border-white/5 p-4 rounded-xl">
            <div className="text-sm text-gray-400">Пользователей</div>
            <div className="text-2xl text-white font-bold">{stats.totalUsers}</div>
          </div>
          <div className="bg-[#140c0c] border border-white/5 p-4 rounded-xl">
            <div className="text-sm text-gray-400">Бронирований</div>
            <div className="text-2xl text-white font-bold">{stats.totalBookings}</div>
          </div>
          <div className="bg-[#140c0c] border border-white/5 p-4 rounded-xl col-span-2">
            <div className="text-sm text-gray-400">Сумма всех покупок</div>
            <div className="text-2xl text-[#e94553] font-bold">{stats.totalRevenue.toLocaleString("ru-RU")} сум</div>
          </div>
        </div>
      )}

      {activeTab === "promocodes" && (
        <div>
          <div className="bg-[#140c0c] p-4 rounded-2xl border border-white/5 mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Добавить промокод</h2>
            <form
              action={async (formData) => {
                await addPromoCode(formData);
                setPromoType("PERCENT");
              }}
              className="flex flex-col gap-4"
            >
              <input
                type="text"
                name="code"
                placeholder="Код (например SUMMER10)"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white uppercase placeholder:normal-case"
              />
              <div className="flex gap-4">
                <Dropdown className="w-1/2" name="type" value={promoType} onChange={setPromoType} options={PROMO_TYPE_OPTIONS} />
                <input
                  type="number"
                  name="value"
                  placeholder={promoType === "PERCENT" ? "Например 10" : "Например 20000"}
                  required
                  className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                />
              </div>
              <input
                type="number"
                name="maxUses"
                placeholder="Макс. использований (необязательно)"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
              />
              <button type="submit" className="w-full bg-[#8a1f26] text-white font-bold py-3 rounded-xl mt-2">
                Добавить промокод
              </button>
            </form>
          </div>

          <h2 className="text-lg font-bold text-white mb-4">Активные промокоды</h2>
          <div className="flex flex-col gap-3">
            {promoCodes.length === 0 && <div className="text-center text-gray-500 py-6">Промокодов пока нет</div>}
            {promoCodes.map((p) => (
              <div key={p.id} className="bg-[#140c0c] border border-white/5 p-4 rounded-xl flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <div className="text-white font-bold truncate">{p.code}</div>
                  <div className="text-sm text-gray-400">
                    {p.type === "PERCENT" ? `${p.value}%` : `${p.value.toLocaleString("ru-RU")} сум`} · Использован {p.usesCount}
                    {p.maxUses ? `/${p.maxUses}` : ""} раз
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => togglePromoCode(p.id, !p.isActive)}
                    className={`text-sm font-medium ${p.isActive ? "text-green-400" : "text-gray-500"}`}
                  >
                    {p.isActive ? "Активен" : "Выключен"}
                  </button>
                  <button onClick={() => deletePromoCode(p.id)} className="text-red-400 hover:text-red-300 text-sm font-medium">
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "broadcast" && (
        <div>
          <div className="bg-[#140c0c] p-4 rounded-2xl border border-white/5 mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Новая рассылка</h2>
            <form
              action={async (formData) => {
                formData.set("scheduledAt", `${broadcastDate}T${broadcastTime}`);
                await queueNotification(formData);
                setBroadcastPhotoUrl("");
                setBroadcastDate("");
                setBroadcastTime("");
              }}
              className="flex flex-col gap-4"
            >
              <input type="text" name="title" placeholder="Название" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
              <textarea name="description" placeholder="Описание" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white h-24" />

              <div>
                <label className="block text-sm text-gray-400 mb-2">Фото (по желанию)</label>
                <input type="file" accept="image/*" onChange={handleBroadcastPhotoUpload} className="text-white text-sm" />
                <input type="hidden" name="photoUrl" value={broadcastPhotoUrl} />
                {isUploadingPhoto && <span className="text-sm text-[#ffb4b9] ml-2">Загрузка...</span>}
                {broadcastPhotoUrl && <span className="text-sm text-green-400 ml-2">Загружено!</span>}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Дата уведомления</label>
                <div className="flex gap-4">
                  <DatePicker className="w-1/2" value={broadcastDate} onChange={setBroadcastDate} />
                  <TimePicker className="w-1/2" value={broadcastTime} onChange={setBroadcastTime} />
                </div>
              </div>

              <button
                type="submit"
                disabled={!broadcastDate || !broadcastTime}
                className="w-full bg-[#8a1f26] text-white font-bold py-3 rounded-xl mt-2 disabled:opacity-40"
              >
                Отправить
              </button>
            </form>
          </div>

          <h2 className="text-lg font-bold text-white mb-4">История рассылок</h2>
          <div className="flex flex-col gap-3">
            {notifications.length === 0 && <div className="text-center text-gray-500 py-6">Рассылок пока нет</div>}
            {notifications.map((n) => (
              <div key={n.id} className="bg-[#140c0c] border border-white/5 p-4 rounded-xl">
                <div className="flex justify-between items-start gap-2">
                  <div className="text-white font-bold">{n.title}</div>
                  <span
                    className={`text-[10px] px-2 py-1 rounded-md flex-shrink-0 ${
                      n.status === "SENT"
                        ? "text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20"
                        : "text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20"
                    }`}
                  >
                    {n.status === "SENT" ? "Отправлено" : "Ожидает"}
                  </span>
                </div>
                {n.description && <p className="text-sm text-gray-400 mt-1">{n.description}</p>}
                <div className="text-xs text-gray-500 mt-2">{new Date(n.scheduledAt).toLocaleString("ru-RU")}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "scanner" && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Сканер QR-кодов</h2>
          <QrScanner />
        </div>
      )}
    </div>
  );
}
