"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Ticket, Info, Users, AlertCircle, Tag, Check, X, User as UserIcon, Phone, CreditCard } from "lucide-react";
import { confirmBooking } from "./actions";
import { checkPromoCode } from "./promo-actions";
import { isEventPast } from "@/lib/event-time";
import { withBasePath } from "@/lib/paths";

const CASHBACK_MIN_BALANCE = 10000;

const PAYMENT_PROVIDERS: { id: "CLICK" | "UZUM" | "CASH"; label: string; logo: string }[] = [
  { id: "CLICK", label: "Click", logo: "/logos/click.png" },
  { id: "UZUM", label: "Uzum", logo: "/logos/uzum.png" },
  { id: "CASH", label: "Наличными", logo: "/logos/cash.png" },
];

interface EventData {
  id: string;
  title: string;
  isFootball: boolean;
  date: Date | string;
  time: string;
  poufPrice: number;
  availablePoufs: number;
  tapchanPrice: number;
  availableTapchans: number;
}

export default function BookClient({ event, userBalance }: { event: EventData; userBalance: number }) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedZone, setSelectedZone] = useState("pouf");
  const [quantity, setQuantity] = useState(1);
  const [useBonuses, setUseBonuses] = useState(false);
  const [provider, setProvider] = useState<"CLICK" | "UZUM" | "CASH" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; type: "PERCENT" | "FIXED"; value: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);

  const zones = [
    {
      id: "pouf",
      title: "Пуфики",
      price: event.poufPrice,
      subtitle: "Детский 50.000 сум (оплата на месте)",
      icon: Info,
      available: event.availablePoufs
    },
    {
      id: "tapchan",
      title: "Тапчан",
      price: event.tapchanPrice,
      subtitle: "Вместимость до 5и человек",
      icon: Users,
      available: event.availableTapchans
    },
  ];

  const selectedZoneData = zones.find(z => z.id === selectedZone)!;
  const rawTotalPrice = selectedZoneData.price * quantity;

  // Promo code and cashback are mutually exclusive.
  const promoDiscount = promo
    ? promo.type === "PERCENT"
      ? Math.floor((rawTotalPrice * promo.value) / 100)
      : Math.min(promo.value, rawTotalPrice)
    : 0;
  const bonusDiscount = !promo && useBonuses ? Math.min(userBalance, rawTotalPrice) : 0;
  const finalPrice = rawTotalPrice - promoDiscount - bonusDiscount;
  const needsPayment = finalPrice > 0;

  const canUseCashback = userBalance > CASHBACK_MIN_BALANCE;
  const isSoldOut = selectedZoneData.available === 0;
  const isPast = isEventPast(event.date, event.time);

  const canSubmit =
    !isPast && !isSoldOut && customerName.trim() && customerPhone.trim() && (!needsPayment || provider);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setCheckingPromo(true);
    setPromoError(null);
    const res = await checkPromoCode(promoInput);
    setCheckingPromo(false);
    if (res.valid) {
      setPromo({ code: promoInput.trim().toUpperCase(), type: res.type, value: res.value });
      setUseBonuses(false);
    } else {
      setPromo(null);
      setPromoError(res.error || "Промокод недействителен");
    }
  };

  const handleRemovePromo = () => {
    setPromo(null);
    setPromoInput("");
    setPromoError(null);
  };

  const handleConfirmYes = async () => {
    setIsLoading(true);
    const res = await confirmBooking({
      eventId: event.id,
      zone: selectedZone,
      quantity,
      useBonuses,
      promoCode: promo?.code,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      provider: needsPayment ? provider ?? undefined : undefined,
    });
    setIsLoading(false);
    setShowConfirm(false);

    if (res.success) {
      if (typeof window !== "undefined" && window.Telegram?.WebApp?.close) {
        window.Telegram.WebApp.close();
      } else {
        router.push("/bookings");
      }
    } else {
      alert(res.error || "Ошибка бронирования");
    }
  };

  return (
    <main className="min-h-screen pt-28 pb-40 px-4 bg-[#0a0404]">
      {/* Event Info */}
      <div className="mb-8">
        <span className={`badge mb-3 ${event.isFootball ? 'badge-football' : 'badge-kino'}`}>
          {event.isFootball ? 'ФУТБОЛ' : 'КИНО'}
        </span>
        <h1 className="text-3xl font-bold text-white mb-2 leading-tight">{event.title}</h1>
        <div className="text-[#e94553] font-medium text-[15px]">
          {event.time}, {new Date(event.date).toLocaleDateString("ru-RU", { day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Contact Info */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon size={20} className="text-[#8a1f26]" />
          <h2 className="text-lg font-bold text-white">Ваши данные</h2>
        </div>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Имя"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-white"
            />
          </div>
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Номер телефона"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-white"
            />
          </div>
        </div>
      </div>

      {/* Zone Selection */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Ticket size={20} className="text-[#8a1f26]" />
          <h2 className="text-lg font-bold text-white">Выберите зону посадки</h2>
        </div>

        <div className="flex flex-col gap-3">
          {zones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => {
                setSelectedZone(zone.id);
                setQuantity(1); // reset quantity on zone change
              }}
              className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                selectedZone === zone.id
                  ? "bg-[#2d0a0d] border-[#8a1f26]"
                  : "bg-[#140c0c] border-white/5 hover:border-white/10"
              }`}
            >
              <div className="flex justify-between items-center mb-1.5 w-full">
                <span className="text-[17px] font-bold text-white">{zone.title}</span>
                <span className="text-[#ffb4b9] font-bold">{zone.price.toLocaleString("ru-RU")} сум</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <zone.icon size={12} />
                {zone.subtitle}
              </div>
              <div className="text-[10px] text-gray-500 mt-2">Осталось мест: {zone.available}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Selection */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Количество мест</h2>
        <div className="inline-flex items-center bg-[#140c0c] rounded-xl border border-white/5 p-1">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={isSoldOut}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors bg-white/5 rounded-lg disabled:opacity-50"
          >
            -
          </button>
          <div className="w-14 text-center font-bold text-white text-lg">
            {quantity}
          </div>
          <button
            onClick={() => setQuantity(Math.min(selectedZoneData.available, quantity + 1))}
            disabled={isSoldOut || quantity >= selectedZoneData.available}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors bg-white/5 rounded-lg disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      {/* Promo code */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Tag size={20} className="text-[#8a1f26]" />
          <h2 className="text-lg font-bold text-white">Промокод</h2>
        </div>

        {promo ? (
          <div className="bg-[#140c0c] border border-[#22c55e]/30 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[#22c55e] font-bold">
              <Check size={16} />
              {promo.code} применён
            </div>
            <button onClick={handleRemovePromo} className="text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="Введите промокод"
              disabled={useBonuses}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white uppercase placeholder:normal-case disabled:opacity-40"
            />
            <button
              onClick={handleApplyPromo}
              disabled={checkingPromo || !promoInput.trim() || useBonuses}
              className="bg-white/10 text-white font-medium px-5 rounded-xl disabled:opacity-40"
            >
              {checkingPromo ? "..." : "Применить"}
            </button>
          </div>
        )}
        {promoError && <div className="text-xs text-red-400 mt-2">{promoError}</div>}
        {useBonuses && !promo && (
          <div className="text-xs text-gray-500 mt-2">Отключите кешбек, чтобы использовать промокод</div>
        )}
      </div>

      {/* Cashback */}
      {canUseCashback && (
        <div className="bg-[#140c0c] border border-white/5 p-4 rounded-xl mb-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-bold text-white">Использовать кешбек: {userBalance.toLocaleString("ru-RU")} сум</div>
              <div className="text-xs text-gray-400 mt-1">Спишется полностью при подтверждении заказа</div>
            </div>
            <label className={`relative inline-flex items-center ${promo ? "cursor-not-allowed" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                className="sr-only peer"
                checked={useBonuses}
                disabled={!!promo}
                onChange={() => setUseBonuses(!useBonuses)}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e94553] peer-disabled:opacity-40"></div>
            </label>
          </div>
          {promo && <div className="text-xs text-gray-500 mt-2">Недоступно вместе с промокодом</div>}
        </div>
      )}

      {/* Payment method */}
      {needsPayment && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={20} className="text-[#8a1f26]" />
            <h2 className="text-lg font-bold text-white">Способ оплаты</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all min-w-0 ${
                  provider === p.id
                    ? "bg-[#2d0a0d] border-[#8a1f26]"
                    : "bg-[#140c0c] border-white/5 hover:border-white/10"
                }`}
              >
                <Image src={withBasePath(p.logo)} alt={p.label} width={36} height={36} className="object-contain h-9 w-auto" unoptimized />
                <span className={`text-[11px] font-medium truncate ${provider === p.id ? "text-white" : "text-gray-400"}`}>
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Total summary */}
      <div className="bg-[#140c0c] rounded-2xl p-4 border border-white/5 flex flex-col gap-2">
        {promo && promoDiscount > 0 && (
          <div className="flex justify-between items-center text-sm text-green-400">
            <span>Скидка по промокоду:</span>
            <span>-{promoDiscount.toLocaleString("ru-RU")} сум</span>
          </div>
        )}
        {useBonuses && bonusDiscount > 0 && (
           <div className="flex justify-between items-center text-sm text-green-400">
             <span>Скидка бонусами:</span>
             <span>-{bonusDiscount.toLocaleString("ru-RU")} сум</span>
           </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Итого к оплате:</span>
          <div className="text-white font-bold text-2xl flex items-baseline gap-1">
            {finalPrice.toLocaleString("ru-RU")} <span className="text-sm font-normal text-gray-400">сум</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0404] via-[#0a0404] to-transparent z-50">
        <div className="max-w-md mx-auto">
          {isPast ? (
            <button
              disabled
              className="w-full bg-gray-800 text-gray-500 font-bold py-4 rounded-xl flex justify-center items-center gap-2 cursor-not-allowed"
            >
              <AlertCircle size={20} />
              Показ уже прошёл
            </button>
          ) : isSoldOut ? (
            <button
              disabled
              className="w-full bg-gray-800 text-gray-500 font-bold py-4 rounded-xl flex justify-center items-center gap-2 cursor-not-allowed"
            >
              <AlertCircle size={20} />
              Мест нет
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!canSubmit}
              className="w-full bg-[#8a1f26] hover:bg-[#a6252e] text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(138,31,38,0.3)] transition-all flex justify-center items-center disabled:opacity-40"
            >
              Забронировать
            </button>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => !isLoading && setShowConfirm(false)}
        >
          <div
            className="bg-[#140c0c] border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 max-w-[320px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg text-center">Вы подтверждаете бронь?</h3>
            <button
              onClick={handleConfirmYes}
              disabled={isLoading}
              className="w-full bg-[#8a1f26] hover:bg-[#a6252e] text-white font-bold py-3 rounded-xl disabled:opacity-60"
            >
              {isLoading ? "Обработка..." : "Да"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isLoading}
              className="w-full bg-[#0a0404] border border-white/10 text-white font-medium py-3 rounded-xl disabled:opacity-60"
            >
              Нет
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
