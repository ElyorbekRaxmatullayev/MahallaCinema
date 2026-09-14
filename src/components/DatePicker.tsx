"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Custom-styled date input replacing the native <input type="date">, which
 * renders as the OS's own picker (Android Material dialog, etc.) instead of
 * matching the app's own look — same rationale as Dropdown.tsx.
 */
export default function DatePicker({
  name,
  value,
  onChange,
  className = "",
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = value ? new Date(value + "T00:00:00") : null;
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayIso = toISODate(new Date());

  return (
    <div ref={ref} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value} required />}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white flex items-center justify-between"
      >
        <span className={value ? "" : "text-gray-500"}>
          {selected ? selected.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "Выберите дату"}
        </span>
        <CalendarIcon size={16} className="text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-72 max-w-[90vw] bg-[#140c0c] border border-white/10 rounded-xl shadow-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1.5 text-gray-400 hover:text-white">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-white">
              {MONTHS[month]} {year}
            </span>
            <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1.5 text-gray-400 hover:text-white">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[10px] text-gray-500 py-1">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const iso = toISODate(new Date(year, month, day));
              const isSelected = value === iso;
              const isToday = todayIso === iso;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={`aspect-square rounded-lg text-sm flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-[#8a1f26] text-white font-bold"
                      : isToday
                        ? "text-white ring-1 ring-inset ring-white/20"
                        : "text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
