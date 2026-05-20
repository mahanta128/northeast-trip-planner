"use client";

import { useState, useEffect, useRef } from "react";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { format, differenceInCalendarDays, startOfDay } from "date-fns";

interface Props {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}

export default function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [numMonths, setNumMonths] = useState(2);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setNumMonths(window.innerWidth < 768 ? 1 : 2);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const today = startOfDay(new Date());
  const from = value?.from;
  const to = value?.to;

  let label = "";
  let meta = "";
  if (from && to) {
    const nights = differenceInCalendarDays(to, from);
    label = `${format(from, "d MMM")} → ${format(to, "d MMM")}`;
    meta = `${nights} night${nights !== 1 ? "s" : ""} · ${nights + 1} days`;
  } else if (from) {
    label = `${format(from, "d MMM")} → select end date`;
  }

  function handleSelect(range: DateRange | undefined) {
    onChange(range);
    if (range?.from && range?.to && differenceInCalendarDays(range.to, range.from) > 0) setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full text-left rounded-2xl border px-5 py-3 text-sm transition-all ${
          open
            ? "border-[#2551CC] ring-2 ring-[#2551CC]/12 bg-white"
            : "border-[#DDE8F7] bg-[#F9FBFF] hover:border-[#2551CC]/40"
        }`}
      >
        {label ? (
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-[#1C2333]">{label}</span>
            {meta && (
              <span className="shrink-0 text-xs font-semibold text-[#2551CC] bg-[#DDE8F7] px-2.5 py-1 rounded-full">
                {meta}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[#A8B5C8]">Select travel dates</span>
        )}
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgba(37,81,204,0.12),0_2px_8px_rgba(0,0,0,0.04)] border border-[#DDE8F7] p-5 w-max max-w-[calc(100vw-2rem)]">
          <DayPicker
            mode="range"
            selected={value}
            onSelect={handleSelect}
            numberOfMonths={numMonths}
            disabled={{ before: today }}
            showOutsideDays={false}
            classNames={{
              root: "",
              months: "flex gap-8",
              month: "flex flex-col",
              month_caption: "relative flex items-center justify-center h-9 mb-1",
              caption_label: "text-sm font-bold text-[#1C2333]",
              nav: "absolute inset-x-0 top-0 flex items-center justify-between z-10",
              button_previous:
                "w-9 h-9 flex items-center justify-center rounded-full text-[#A8B5C8] hover:bg-[#EEF3FB] hover:text-[#2551CC] transition-colors",
              button_next:
                "w-9 h-9 flex items-center justify-center rounded-full text-[#A8B5C8] hover:bg-[#EEF3FB] hover:text-[#2551CC] transition-colors",
              chevron: "w-4 h-4",
              weekdays: "grid grid-cols-7 mb-0.5",
              weekday:
                "h-8 flex items-center justify-center text-[10px] font-bold text-[#A8B5C8] uppercase",
              weeks: "flex flex-col",
              week: "grid grid-cols-7",
              day: "rdp-day h-9 relative flex items-center justify-center",
              day_button: [
                "rdp-btn relative z-10 w-9 h-9",
                "flex items-center justify-center",
                "text-sm font-medium text-[#1C2333]",
                "rounded-full cursor-pointer select-none",
                "transition-colors hover:bg-[#EEF3FB]",
              ].join(" "),
              selected: "",
              range_start: "rdp-range-start",
              range_end: "rdp-range-end",
              range_middle: "rdp-range-mid",
              today: "rdp-today",
              disabled: "rdp-off",
              outside: "rdp-out",
            }}
          />
        </div>
      )}
    </div>
  );
}
