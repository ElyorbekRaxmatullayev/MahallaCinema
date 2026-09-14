"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

/** Custom-styled time input replacing the native <input type="time"> OS picker — see DatePicker.tsx. */
export default function TimePicker({
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
  const [h, m] = value ? value.split(":") : ["", ""];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function set(hh: string, mm: string) {
    onChange(`${hh}:${mm}`);
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value} required />}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white flex items-center justify-between"
      >
        <span className={value ? "" : "text-gray-500"}>{value || "Выберите время"}</span>
        <Clock size={16} className="text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 bg-[#140c0c] border border-white/10 rounded-xl shadow-xl p-2 flex gap-2">
          <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5 pr-1 scrollbar-hide">
            {HOURS.map((hh) => (
              <button
                key={hh}
                type="button"
                onClick={() => set(hh, m || "00")}
                className={`px-3 py-1.5 rounded-lg text-sm text-center ${
                  hh === h ? "bg-[#8a1f26] text-white font-bold" : "text-gray-300 hover:bg-white/10"
                }`}
              >
                {hh}
              </button>
            ))}
          </div>
          <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5 scrollbar-hide">
            {MINUTES.map((mm) => (
              <button
                key={mm}
                type="button"
                onClick={() => set(h || "00", mm)}
                className={`px-3 py-1.5 rounded-lg text-sm text-center ${
                  mm === m ? "bg-[#8a1f26] text-white font-bold" : "text-gray-300 hover:bg-white/10"
                }`}
              >
                {mm}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
