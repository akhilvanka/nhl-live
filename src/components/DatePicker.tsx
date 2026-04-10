"use client";

import { useState, useRef, useEffect } from "react";

interface DatePickerProps {
  date: string;
  onChange: (date: string) => void;
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function DatePicker({ date, onChange }: DatePickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewYear, setViewYear] = useState(0);
  const [viewMonth, setViewMonth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = new Date(date + "T12:00:00");
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [date]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const selectedDate = new Date(date + "T12:00:00");

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div ref={ref} className="relative">
      {/* Calendar popup */}
      {calendarOpen && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3 w-[260px] z-50">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
                else { setViewMonth((m) => m - 1); }
              }}
              className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-white transition-colors text-xs"
            >
              ‹
            </button>
            <span className="text-[10px] font-semibold text-white">{monthLabel}</span>
            <button
              onClick={() => {
                if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
                else { setViewMonth((m) => m + 1); }
              }}
              className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-white transition-colors text-xs"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-center text-[9px] text-muted py-0.5">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const thisDate = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected =
                day === selectedDate.getDate() &&
                viewMonth === selectedDate.getMonth() &&
                viewYear === selectedDate.getFullYear();
              const isToday =
                day === new Date().getDate() &&
                viewMonth === new Date().getMonth() &&
                viewYear === new Date().getFullYear();

              return (
                <button
                  key={day}
                  onClick={() => { onChange(thisDate); setCalendarOpen(false); }}
                  className={`w-7 h-7 flex items-center justify-center rounded text-[10px] transition-colors ${
                    isSelected
                      ? "bg-white text-black font-bold"
                      : isToday
                        ? "border border-white/30 text-white"
                        : "hover:bg-white/10 text-white/60"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => { onChange(new Date().toISOString().split("T")[0]); setCalendarOpen(false); }}
            className="mt-2 w-full text-center text-[9px] text-white/50 hover:text-white font-medium tracking-wider uppercase"
          >
            Today
          </button>
        </div>
      )}

      {/* Slim pill */}
      <div className="flex items-center bg-[#0a0a0a] border border-[#1a1a1a] rounded-full h-7">
        <button
          onClick={() => onChange(shiftDate(date, -1))}
          className="w-7 h-7 flex items-center justify-center rounded-full text-muted hover:text-white transition-colors text-xs"
          aria-label="Previous day"
        >
          ‹
        </button>
        <button
          onClick={() => setCalendarOpen((v) => !v)}
          className="px-2 h-7 text-[10px] font-medium text-white/70 hover:text-white transition-colors whitespace-nowrap"
        >
          {formatDateDisplay(date)}
        </button>
        <button
          onClick={() => onChange(shiftDate(date, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-full text-muted hover:text-white transition-colors text-xs"
          aria-label="Next day"
        >
          ›
        </button>
      </div>
    </div>
  );
}
