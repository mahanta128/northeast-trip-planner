"use client";

import * as RadixSlider from "@radix-ui/react-slider";
import { motion, AnimatePresence } from "framer-motion";
import {
  TRIP_TIERS,
  computeTripCost,
  formatINR,
} from "../utils/tripBudget";

function getTravelLabel(n: number): string {
  if (n === 1) return "Solo Traveller";
  if (n === 2) return "Couple Trip";
  if (n <= 5) return "Small Group";
  if (n <= 10) return "Friends Trip";
  return "Large Group";
}

/* ─── Slider value display ────────────────────────────────── */

function SliderValue({ value, suffix }: { value: number; suffix: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={value}
        initial={{ scale: 0.85, opacity: 0, y: 4 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: -4 }}
        transition={{ duration: 0.14, ease: "easeOut" }}
        className="flex items-baseline gap-1.5"
      >
        <span className="text-2xl font-bold text-[#1C2333] tabular-nums leading-none">{value}</span>
        <span className="text-sm text-[#6B7280] font-medium leading-none">{suffix}</span>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Budget card ─────────────────────────────────────────── */

function BudgetCard({
  tier,
  travelers,
  days,
  selected,
  onClick,
}: {
  tier: (typeof TRIP_TIERS)[number];
  travelers: number;
  days: number;
  selected: boolean;
  onClick: () => void;
}) {
  const { total, perPerson, discountPct } = computeTripCost(
    tier.baseRate,
    travelers,
    days
  );

  const isPremium     = tier.id === "premium";
  const isBudget      = tier.id === "budget";
  const isComfortable = tier.id === "comfortable";

  // Card backgrounds
  const cardCls = isPremium
    ? "bg-gradient-to-br from-[#1C306E] to-[#0E1C4A] border-[#1C306E]"
    : isBudget
    ? "bg-[#EEF3FB] border-[#DDE8F7]"
    : "bg-white border-[#DDE8F7]";

  // Selection ring
  const ringCls = selected
    ? isPremium
      ? "ring-2 ring-[#A0C4FF]"
      : "ring-2 ring-[#2551CC]"
    : isComfortable
    ? "ring-1 ring-[#DDE8F7]"
    : "";

  // Icon badge
  const iconBg = isPremium
    ? "bg-white/10 text-white"
    : "bg-[#DDE8F7]/60 text-[#2551CC]";

  // Tier label
  const tierLabelCls = isPremium
    ? "text-white/55"
    : "text-[#6B7280]/65";

  // Total price
  const totalCls = isPremium
    ? "text-white"
    : "text-[#1C2333]";

  // Per person
  const perPersonCls = isPremium
    ? "text-[#A0C4FF]"
    : "text-[#2551CC]";

  // Description
  const descCls = isPremium
    ? "text-white/45"
    : "text-[#6B7280]/55";

  // Discount badge
  const badgeCls = isPremium
    ? "bg-white/10 text-white/80"
    : "bg-white/70 text-[#2551CC] border border-[#DDE8F7]";

  // Divider
  const dividerCls = isPremium
    ? "border-white/10"
    : "border-[#DDE8F7]";

  // Checkmark
  const checkCls = isPremium
    ? "bg-white text-[#2551CC]"
    : "bg-[#2551CC] text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl border px-5 py-5 flex flex-col gap-4 text-left w-full",
        "cursor-pointer transition-all duration-150",
        "hover:shadow-md active:scale-[0.98]",
        cardCls,
        ringCls,
      ].join(" ")}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${iconBg}`}>
            {tier.icon}
          </span>
          <p className={`text-[10px] font-bold uppercase tracking-wider leading-tight ${tierLabelCls}`}>
            {tier.label}
          </p>
          {isComfortable && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#EEF3FB] text-[#2551CC] border border-[#DDE8F7] leading-none">
              Recommended
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {discountPct > 0 && (
            <span className={`text-[9px] font-bold px-2 py-1 rounded-full leading-none whitespace-nowrap ${badgeCls}`}>
              {discountPct}% off
            </span>
          )}
          {selected && (
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${checkCls}`}>
              ✓
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="flex flex-col gap-0.5">
        <motion.p
          key={`total-${total}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={`text-[1.6rem] font-bold tabular-nums leading-none tracking-tight ${totalCls}`}
        >
          {formatINR(total)}
        </motion.p>
        <motion.p
          key={`pp-${perPerson}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className={`text-xs tabular-nums mt-0.5 ${perPersonCls}`}
        >
          {formatINR(perPerson)} / person
        </motion.p>
      </div>

      {/* Description */}
      <div className={`border-t pt-3 ${dividerCls}`}>
        <p className={`text-[11px] leading-snug ${descCls}`}>{tier.description}</p>
      </div>
    </button>
  );
}

/* ─── Main component (controlled) ────────────────────────── */

export default function TripBudgetEstimator({
  travelers,
  days,
  onTravelersChange,
  selectedBudgetId,
  onBudgetSelect,
}: {
  travelers: number;
  days: number;
  onTravelersChange: (n: number) => void;
  selectedBudgetId: string;
  onBudgetSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">

      {/* Travelers slider */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <span className="text-[10px] font-bold text-[#6B7280]/60 uppercase tracking-[0.14em]">Travelers</span>
          <SliderValue value={travelers} suffix={travelers === 1 ? "person" : "people"} />
        </div>
        <RadixSlider.Root
          className="relative flex items-center select-none touch-none w-full h-11"
          min={1}
          max={30}
          step={1}
          value={[travelers]}
          onValueChange={([v]) => onTravelersChange(v)}
        >
          <RadixSlider.Track className="relative grow rounded-full h-1.5 bg-[#E8EFFA]">
            <RadixSlider.Range className="absolute rounded-full h-full bg-[#2551CC] transition-all duration-150" />
          </RadixSlider.Track>
          <RadixSlider.Thumb
            className={[
              "block w-8 h-8 rounded-full bg-white",
              "border-2 border-[#2551CC]",
              "shadow-[0_2px_16px_rgba(37,81,204,0.28)]",
              "hover:shadow-[0_4px_24px_rgba(37,81,204,0.38)] hover:scale-110",
              "active:scale-[1.2] active:cursor-grabbing",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2551CC] focus-visible:ring-offset-2",
              "cursor-grab transition-all duration-150 ease-out",
            ].join(" ")}
            aria-label="Number of travelers"
          />
        </RadixSlider.Root>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-[#A8B5C8]">Solo</span>
          <span className="text-[10px] text-[#A8B5C8]">30 people</span>
        </div>
      </div>

      {/* Traveler label */}
      <div className="h-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={getTravelLabel(travelers)}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15 }}
            className="text-xs font-medium text-[#2551CC]"
          >
            {getTravelLabel(travelers)}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Cards label */}
      <p className="text-[10px] font-bold text-[#6B7280]/40 uppercase tracking-[0.14em]">
        Recommended Budget · {days} {days === 1 ? "day" : "days"}
        {travelers >= 2 ? " · Group discount applied" : ""}
      </p>

      {/* Budget cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TRIP_TIERS.map((tier) => (
          <BudgetCard
            key={tier.id}
            tier={tier}
            travelers={travelers}
            days={days}
            selected={tier.id === selectedBudgetId}
            onClick={() => onBudgetSelect(tier.id)}
          />
        ))}
      </div>

    </div>
  );
}
