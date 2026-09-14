"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
}

/**
 * Custom-styled select replacing the native <select>, which renders as a
 * broken full-screen native picker overlay inside Telegram's mobile in-app browser.
 * Exposes a hidden <input name=...> so it still works with FormData-based Server Actions.
 */
export default function Dropdown({
  options,
  value,
  onChange,
  name,
  className = "",
}: {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white flex items-center justify-between"
      >
        <span>{selected?.label ?? "Выбрать"}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full bg-[#140c0c] border border-white/10 rounded-xl overflow-hidden shadow-xl">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                opt.value === value ? "bg-[#8a1f26] text-white" : "text-gray-300 hover:bg-white/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
