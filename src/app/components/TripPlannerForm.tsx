"use client";

import { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInCalendarDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import DateRangePicker from "./DateRangePicker";
import TripBudgetEstimator from "./TripBudgetEstimator";
import {
  computeBudget, getSeasonData, PERMIT_INFO, getFestivals,
  type BudgetTier, type ComputedBudget, type SeasonData, type PermitData, type FestivalData,
} from "../lib/tripData";

/* ─── Constants ───────────────────────────────────────────── */

const DESTINATIONS = [
  { name: "Meghalaya",          short: "Meghalaya",   emoji: "🌿", active: true  },
  { name: "Arunachal Pradesh",  short: "Arunachal",   emoji: "🏔", active: false },
  { name: "Sikkim",             short: "Sikkim",       emoji: "❄️", active: false },
];

const VIBES   = ["Relaxed", "Adventure", "Photography", "Cafes", "Nature"];
const STEPS   = ["Finding best travel route", "Matching budget", "Building itinerary"];

const BUDGET_LEVELS = [
  {
    key:         "Budget",
    label:       "Budget Explorer",
    budgetTier:  "budget",
    budgetRange: "₹8k–15k",
    budgetStyle: "Shared transport, budget stays, local food.",
  },
  {
    key:         "Comfortable",
    label:       "Comfortable Trip",
    budgetTier:  "comfortable",
    budgetRange: "₹20k–35k",
    budgetStyle: "Good hotels, cafés, mixed transport.",
  },
  {
    key:         "Premium",
    label:       "Premium Escape",
    budgetTier:  "premium",
    budgetRange: "₹40k+",
    budgetStyle: "Boutique stays, private transport, slower travel.",
  },
];

/* ─── Types ───────────────────────────────────────────────── */

interface FormState {
  origin: string;
  destination: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  budget: string;
  vibes: string[];
  travelers: number;
}

interface TransportLeg {
  mode: string; leg: string; duration: string; cost: string;
}

interface TripPlan {
  tripTitle: string;
  summary: string;
  tripFit: { score: string; summary: string; reasons: string[] };
  transport: TransportLeg[];
  stay: { base: string; priceRange: string; bestFor: string[] };
  budget: { transport: string; stay: string; food: string; localTravel: string };
  itinerary: { day: number; location: string; highlights: string[] }[];
  realityCheck: string[];
}

const INITIAL: FormState = {
  origin: "", destination: "Meghalaya",
  startDate: undefined, endDate: undefined,
  budget: "Comfortable", vibes: [], travelers: 2,
};

interface TripContext {
  days: number;
  travelers: number;
  destination: string;
  startDateFormatted: string;
  endDateFormatted: string;
  month: number;
  budget: ComputedBudget;
  season: SeasonData | null;
  permit: PermitData;
  festivals: FestivalData[];
}

/* ─── Divider ─────────────────────────────────────────────── */

function Divider() {
  return (
    <div className="relative mb-9">
      <div className="border-t border-[#DDE8F7]/70" />
      <div className="absolute left-0 top-0 h-px w-8 bg-[#2551CC]/18" />
    </div>
  );
}

/* ─── Pill ────────────────────────────────────────────────── */

function Pill({
  selected, onClick, disabled, children,
}: {
  selected: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className={`relative px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${
        disabled
          ? "border-[#DDE8F7] bg-[#F9FBFF] text-[#A8B5C8] cursor-not-allowed"
          : selected
          ? "border-[#2551CC] bg-[#2551CC] text-white shadow-sm"
          : "border-[#DDE8F7] bg-transparent text-[#6B7280] hover:border-[#2551CC]/50 hover:text-[#2551CC] cursor-pointer"
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Season Snippet (in-form) ───────────────────────────── */

function SeasonSnippet({ destination, startDate }: { destination: string; startDate: Date | undefined }) {
  if (!startDate) return null;
  const month = startDate.getMonth() + 1;
  const season = getSeasonData(destination, month);
  const permit = PERMIT_INFO[destination];
  const festivals = getFestivals(destination, month);

  if (!season && !permit?.required && festivals.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className="rounded-2xl border border-[#DDE8F7] bg-[#EEF3FB]/60 px-4 py-3.5 flex flex-col gap-2.5"
      >
        {season && (
          <div className="flex items-start gap-2.5">
            <span className="text-base leading-none mt-0.5">{season.emoji}</span>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-bold text-[#1C2333]">
                {season.name} <span className="font-normal text-[#A8B5C8]">({season.months})</span>
              </p>
              <p className="text-xs text-[#6B7280] leading-snug">{season.weather}</p>
              {season.pacing && (
                <p className="text-xs text-[#2551CC] font-medium mt-0.5">{season.pacing}</p>
              )}
            </div>
          </div>
        )}
        {permit?.required && (
          <div className="flex items-start gap-2 pt-2 border-t border-[#DDE8F7]/60">
            <span className="text-[11px] font-bold text-[#A2272B] shrink-0 mt-px">⚠</span>
            <p className="text-xs text-[#7B4A2A] leading-snug">
              <span className="font-semibold">{permit.name}</span> required — apply before travel
            </p>
          </div>
        )}
        {festivals.length > 0 && (
          <div className="flex items-start gap-2 pt-2 border-t border-[#DDE8F7]/60">
            <span className="text-xs shrink-0 mt-px">🎪</span>
            <p className="text-xs text-[#6B7280] leading-snug">
              <span className="font-semibold">{festivals[0].name}</span> falls during your travel window ·{" "}
              <span className="text-[#A8B5C8]">{festivals[0].location}</span>
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Loading ─────────────────────────────────────────────── */

function LoadingState() {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        const next = prev < STEPS.length - 1 ? prev + 1 : prev;
        setCompletedSteps((c) => (c.includes(prev) ? c : [...c, prev]));
        return next;
      });
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#EEF3FB] flex flex-col items-center justify-center gap-8 pt-16 px-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-[#DDE8F7]" />
        <div className="absolute inset-0 rounded-full border-4 border-t-[#2551CC] animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-xl">🧭</span>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-[#1C2333]">Crafting your Northeast journey</p>
        <p className="text-sm text-[#A8B5C8] mt-1">This takes a few moments</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {STEPS.map((step, i) => {
          const done   = completedSteps.includes(i);
          const active = activeStep === i && !done;
          return (
            <div
              key={step}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-500 ${
                done   ? "border-[#DDE8F7] bg-[#EEF3FB]"
                : active ? "border-[#2551CC]/25 bg-white shadow-sm"
                : "border-[#DDE8F7] bg-white opacity-40"
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center shrink-0">
                {done ? (
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="8" fill="#DDE8F7" />
                    <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="#2551CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : active ? (
                  <span className="w-3 h-3 rounded-full bg-[#2551CC] animate-pulse" />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-[#DDE8F7]" />
                )}
              </span>
              <span className={`text-sm font-medium ${done ? "text-[#2551CC]" : active ? "text-[#1C2333]" : "text-[#A8B5C8]"}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Reality Layer classifier ───────────────────────────── */

type InsightStyle = {
  icon: string; label: string;
  bg: string; border: string;
  iconBg: string; iconColor: string;
  labelColor: string; textColor: string;
  text: string;
};

function classify(item: string): InsightStyle {
  const isWarn = item.startsWith("⚠");
  const text   = item.replace(/^[✓⚠]\s*/, "").trim();
  const t      = text.toLowerCase();

  if (isWarn) {
    if (/rain|monsoon|weather|flood|storm|cloud|fog|mist|temperature|climate/.test(t))
      return {
        icon: "🌧", label: "Weather Advisory",
        bg: "bg-[#EFF8FF]", border: "border-[#BAE0FD]",
        iconBg: "bg-[#DBEAFE]", iconColor: "text-[#1D4ED8]",
        labelColor: "text-[#1D4ED8]", textColor: "text-[#1E3A5F]", text,
      };
    if (/road|landslide|traffic|route|drive|highway|motorable|jeep|vehicle|km|hour/.test(t))
      return {
        icon: "🛣", label: "Road Advisory",
        bg: "bg-[#FFF7ED]", border: "border-[#FDBA74]",
        iconBg: "bg-[#FFEDD5]", iconColor: "text-[#C2410C]",
        labelColor: "text-[#C2410C]", textColor: "text-[#7C2D12]", text,
      };
    return {
      icon: "⚠", label: "Warning",
      bg: "bg-[#FFFBEB]", border: "border-[#FDE68A]",
      iconBg: "bg-[#FEF3C7]", iconColor: "text-[#B45309]",
      labelColor: "text-[#B45309]", textColor: "text-[#78350F]", text,
    };
  }

  if (/^(book|bring|carry|check|consider|avoid|plan|note|remember|ensure|verify|download|ask|arrange|use|opt|hire|get|buy|pay)/i.test(text))
    return {
      icon: "💡", label: "Travel Tip",
      bg: "bg-[#F9FBFF]", border: "border-[#DDE8F7]",
      iconBg: "bg-[#EEF3FB]", iconColor: "text-[#2551CC]",
      labelColor: "text-[#2551CC]", textColor: "text-[#1C2333]", text,
    };

  return {
    icon: "✓", label: "Confirmed",
    bg: "bg-[#F0FDF4]", border: "border-[#BBF7D0]",
    iconBg: "bg-[#DCFCE7]", iconColor: "text-[#16A34A]",
    labelColor: "text-[#16A34A]", textColor: "text-[#14532D]", text,
  };
}

function parseMidpoint(val: string): number {
  const nums = val.replace(/[₹,\s]/g, "").match(/[\d.]+[kLl]?/g) ?? [];
  const toNum = (s: string): number => {
    const n = parseFloat(s);
    if (/[Ll]/.test(s)) return n * 100_000;
    if (/k/.test(s))    return n * 1_000;
    return n;
  };
  if (!nums.length)  return 0;
  if (nums.length === 1) return toNum(nums[0]);
  return (toNum(nums[0]!) + toNum(nums[nums.length - 1]!)) / 2;
}

function getTransportContext(leg: { mode: string; leg: string }): string | null {
  const route = leg.leg.toLowerCase();
  const mode  = leg.mode;
  if (/✈|flight|air/i.test(mode) || /airport|airline/.test(route))
    return "Book 3–4 weeks ahead for best fares";
  if (/🚂|🚃|train|rail/i.test(mode) || /railway|station/.test(route))
    return "Reserve berths early — trains fill quickly";
  if (/⛴|🛥|ferry|boat/i.test(mode) || /river|brahmaputra|ferry|cruise/.test(route))
    return "Check seasonal ferry schedules in advance";
  if (/mountain|hill|cherrapunji|dawki|mawlynnong|tawang|ziro|mechuka|dzukou|arunachal|sikkim|manipur/.test(route))
    return "Mountain roads — plan arrival before sunset";
  if (/kaziranga|manas|park|reserve|sanctuary/.test(route))
    return "Entry permits required — arrange ahead";
  if (/scenic|valley|tea garden|plantation/.test(route))
    return "Scenic stretch — allow time for stops";
  return null;
}

/* ─── Itinerary helpers ───────────────────────────────────── */

const THEME_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Adventure:    { bg: "bg-[#FFF7ED]", text: "text-[#C2410C]", border: "border-[#FDBA74]" },
  Cultural:     { bg: "bg-[#F5F3FF]", text: "text-[#7C3AED]", border: "border-[#DDD6FE]" },
  Nature:       { bg: "bg-[#F0FDF4]", text: "text-[#16A34A]", border: "border-[#BBF7D0]" },
  Spiritual:    { bg: "bg-[#FFFBEB]", text: "text-[#92400E]", border: "border-[#FDE68A]" },
  Scenic:       { bg: "bg-[#EFF8FF]", text: "text-[#1D4ED8]", border: "border-[#BAE0FD]" },
  "Travel Day": { bg: "bg-[#F9FBFF]", text: "text-[#6B7280]", border: "border-[#DDE8F7]" },
  Explore:      { bg: "bg-[#EEF3FB]", text: "text-[#2551CC]", border: "border-[#DDE8F7]" },
};

function getDayTheme(location: string, highlights: string[]): string {
  const t = [location, ...highlights].join(" ").toLowerCase();
  if (/trek|hike|climb|waterfall|cave|raft|zipline/.test(t))   return "Adventure";
  if (/market|local food|tribe|festival|heritage|museum/.test(t)) return "Cultural";
  if (/garden|forest|wildlife|bird|sanctuary|national park/.test(t)) return "Nature";
  if (/temple|monastery|church|sacred|prayer|spiritual/.test(t)) return "Spiritual";
  if (/lake|beach|river|scenic|valley|viewpoint/.test(t))       return "Scenic";
  if (/transfer|check.?in|drive|arrive|depart/.test(t))         return "Travel Day";
  return "Explore";
}

function distributeHighlights(hs: string[]): [string[], string[], string[]] {
  const n = hs.length;
  if (n <= 1) return [hs, [], []];
  if (n === 2) return [[hs[0]], [hs[1]], []];
  if (n === 3) return [[hs[0]], [hs[1]], [hs[2]]];
  const a = Math.ceil(n / 3);
  const b = Math.ceil((n - a) / 2);
  return [hs.slice(0, a), hs.slice(a, a + b), hs.slice(a + b)];
}

function getDayNote(location: string, highlights: string[], realityCheck: string[]): string | null {
  const locWord = location.split(/[,\s]/)[0].toLowerCase();
  const match   = realityCheck.find(r =>
    r.startsWith("⚠") && r.toLowerCase().includes(locWord)
  );
  if (match) return match.replace(/^⚠\s*/, "").trim();
  const t = [location, ...highlights].join(" ").toLowerCase();
  if (/monsoon|rain|flood/.test(t))       return "Rain likely — carry waterproofs";
  if (/mountain|hill|road|pass/.test(t))  return "Mountain roads — plan arrivals before sunset";
  return null;
}

/* ─── Destination Hero ─────────────────────────────────────── */

interface DestHeroTheme {
  tagline: string;
  gradient: string;
  orb1: string;
  orb2: string;
  mistColor: string;
  textAccent: string;
  badgeBg: string;
  badgeBorder: string;
  highlights: string[];
  terrain: "hills" | "peaks";
  terrainFar: string;
  terrainMid: string;
  terrainNear: string;
  overlayBottom: string;
}

const DEST_HERO_THEMES: Record<string, DestHeroTheme> = {
  Meghalaya: {
    tagline: "Abode of Clouds",
    gradient: "linear-gradient(162deg, #061812 0%, #0D2518 42%, #0A1E26 72%, #051016 100%)",
    orb1: "radial-gradient(circle, rgba(28,90,48,0.58) 0%, transparent 68%)",
    orb2: "radial-gradient(circle, rgba(12,70,90,0.32) 0%, transparent 68%)",
    mistColor: "radial-gradient(ellipse, rgba(48,128,72,0.24) 0%, transparent 68%)",
    textAccent: "#86EFAC",
    badgeBg: "rgba(34,197,94,0.12)",
    badgeBorder: "rgba(34,197,94,0.26)",
    highlights: ["Cherrapunji", "Root Bridges", "Dawki River", "Mawlynnong"],
    terrain: "hills",
    terrainFar:  "rgba(18,56,28,0.52)",
    terrainMid:  "rgba(10,38,18,0.72)",
    terrainNear: "rgba(5,20,10,0.90)",
    overlayBottom: "rgba(3,10,5,0.97)",
  },
  "Arunachal Pradesh": {
    tagline: "Land of the Rising Sun",
    gradient: "linear-gradient(162deg, #060A18 0%, #091228 42%, #180A08 72%, #050818 100%)",
    orb1: "radial-gradient(circle, rgba(28,58,155,0.52) 0%, transparent 68%)",
    orb2: "radial-gradient(circle, rgba(130,55,20,0.28) 0%, transparent 68%)",
    mistColor: "radial-gradient(ellipse, rgba(50,80,200,0.18) 0%, transparent 68%)",
    textAccent: "#93C5FD",
    badgeBg: "rgba(59,130,246,0.12)",
    badgeBorder: "rgba(59,130,246,0.26)",
    highlights: ["Tawang Monastery", "Sela Pass", "Ziro Valley", "Namdapha"],
    terrain: "peaks",
    terrainFar:  "rgba(14,24,52,0.52)",
    terrainMid:  "rgba(9,16,36,0.72)",
    terrainNear: "rgba(4,8,20,0.90)",
    overlayBottom: "rgba(3,5,12,0.97)",
  },
  Sikkim: {
    tagline: "Where Mountains Meet Sky",
    gradient: "linear-gradient(162deg, #050D1A 0%, #071622 42%, #081A2C 72%, #040B18 100%)",
    orb1: "radial-gradient(circle, rgba(38,98,200,0.46) 0%, transparent 68%)",
    orb2: "radial-gradient(circle, rgba(140,200,255,0.10) 0%, transparent 68%)",
    mistColor: "radial-gradient(ellipse, rgba(80,148,240,0.18) 0%, transparent 68%)",
    textAccent: "#7DD3FC",
    badgeBg: "rgba(14,165,233,0.12)",
    badgeBorder: "rgba(14,165,233,0.26)",
    highlights: ["Gangtok", "Pelling", "Tsomgo Lake", "Nathu La"],
    terrain: "peaks",
    terrainFar:  "rgba(14,28,52,0.50)",
    terrainMid:  "rgba(8,18,36,0.70)",
    terrainNear: "rgba(4,10,22,0.90)",
    overlayBottom: "rgba(3,6,14,0.97)",
  },
};

function TerrainSVG({ terrain, far, mid, near }: { terrain: "hills" | "peaks"; far: string; mid: string; near: string }) {
  if (terrain === "hills") {
    return (
      <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 800 200" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,108 Q70,65 145,86 Q220,48 295,72 Q370,36 445,62 Q520,28 595,52 Q668,36 738,48 L800,46 L800,200 L0,200 Z" fill={far} />
        <path d="M0,138 Q85,102 165,122 Q255,86 340,110 Q425,76 510,100 Q595,84 680,102 Q745,93 800,90 L800,200 L0,200 Z" fill={mid} />
        <path d="M0,170 Q110,154 210,165 Q305,152 400,167 Q495,153 595,166 Q695,155 800,160 L800,200 L0,200 Z" fill={near} />
      </svg>
    );
  }
  return (
    <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 800 200" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,122 L58,48 L112,92 L175,22 L232,76 L302,12 L372,66 L444,18 L504,60 L574,26 L634,64 L704,36 L754,56 L800,42 L800,200 L0,200 Z" fill={far} />
      <path d="M0,148 L65,90 L125,126 L188,68 L254,106 L335,54 L405,96 L482,65 L548,97 L618,63 L682,94 L752,73 L800,85 L800,200 L0,200 Z" fill={mid} />
      <path d="M0,172 L85,152 L175,168 L272,153 L372,170 L472,155 L572,169 L672,157 L800,164 L800,200 L0,200 Z" fill={near} />
    </svg>
  );
}

function DestinationHero({
  plan, context, onReset,
}: {
  plan: TripPlan;
  context: TripContext | null;
  onReset: () => void;
}) {
  const dest   = context?.destination ?? "Meghalaya";
  const theme  = DEST_HERO_THEMES[dest] ?? DEST_HERO_THEMES["Meghalaya"]!;
  const season = context?.season;
  const scoreNum     = parseInt(plan.tripFit.score);
  const scoreDisplay = scoreNum > 10 ? `${scoreNum}%` : `${scoreNum * 10}%`;
  const scoreColor   = scoreNum >= 8 || scoreNum > 80 ? theme.textAccent : scoreNum >= 6 || scoreNum > 60 ? "#FCD34D" : "#FCA5A5";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.018 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-[32px] h-[370px] sm:h-[430px] shadow-[0_20px_70px_rgba(0,0,0,0.30),0_6px_20px_rgba(0,0,0,0.14)]"
    >
      {/* 1. Base gradient */}
      <div className="absolute inset-0" style={{ background: theme.gradient }} />

      {/* 2. Atmospheric depth orbs */}
      <div
        className="absolute -top-[18%] -left-[8%] w-[56%] h-[66%] pointer-events-none"
        style={{ background: theme.orb1, filter: "blur(78px)" }}
      />
      <div
        className="absolute top-[5%] -right-[12%] w-[48%] h-[56%] pointer-events-none"
        style={{ background: theme.orb2, filter: "blur(65px)" }}
      />

      {/* 3. Drifting mist (animated) */}
      <motion.div
        className="absolute left-[8%] top-[22%] w-[52%] h-[46%] pointer-events-none"
        style={{ background: theme.mistColor, filter: "blur(58px)" }}
        animate={{ x: [0, 24, 0], opacity: [0.65, 0.95, 0.65] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[6%] top-[38%] w-[38%] h-[38%] pointer-events-none"
        style={{ background: theme.mistColor, filter: "blur(46px)", opacity: 0.45 }}
        animate={{ x: [0, -17, 0], opacity: [0.35, 0.60, 0.35] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3.5 }}
      />

      {/* 4. Film grain texture */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.032]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "160px 160px",
        }}
      />

      {/* 5. Terrain silhouette */}
      <TerrainSVG terrain={theme.terrain} far={theme.terrainFar} mid={theme.terrainMid} near={theme.terrainNear} />

      {/* 6. Bottom text-readability gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(to top, ${theme.overlayBottom} 0%, ${theme.overlayBottom.replace("0.97", "0.72")} 28%, ${theme.overlayBottom.replace("0.97", "0.18")} 56%, transparent 80%)` }}
      />

      {/* 7. Content */}
      <div className="relative h-full flex flex-col justify-between p-6 sm:p-8">

        {/* Top: destination identity + plan-again */}
        <div className="flex items-start justify-between">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.20, duration: 0.50 }}
            className="flex flex-col gap-1"
          >
            <p className="text-[9px] font-bold tracking-[0.24em] uppercase" style={{ color: `${theme.textAccent}60` }}>
              Northeast India
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white/92 text-[13px] font-bold tracking-tight">{dest}</span>
              {season && (
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full leading-none"
                  style={{ background: theme.badgeBg, border: `1px solid ${theme.badgeBorder}`, color: theme.textAccent }}
                >
                  {season.emoji} {season.name}
                </span>
              )}
            </div>
          </motion.div>

          <button
            onClick={onReset}
            className="print-hide shrink-0 text-[11px] text-white/30 border border-white/10 rounded-full px-3.5 py-1.5 hover:bg-white/8 transition-all font-medium backdrop-blur-sm"
          >
            ← Plan Again
          </button>
        </div>

        {/* Bottom: title + highlights + season/score */}
        <div className="flex flex-col gap-3.5">

          {/* Tagline, title, meta */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.10, duration: 0.68, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="text-[9px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: `${theme.textAccent}65` }}>
              {theme.tagline}
            </p>
            <h1 className="text-[1.90rem] sm:text-[2.20rem] font-bold text-white leading-[1.13] tracking-[-0.01em]">
              {plan.tripTitle}
            </h1>
            {context && (
              <p className="text-white/36 text-[12px] mt-1.5 font-medium">
                {context.startDateFormatted} – {context.endDateFormatted}
                {" · "}{context.travelers} Traveller{context.travelers !== 1 ? "s" : ""}
                {" · "}{context.days} Day{context.days !== 1 ? "s" : ""}
              </p>
            )}
          </motion.div>

          {/* Destination highlights */}
          <motion.div
            className="flex flex-wrap gap-1.5"
            initial={{ opacity: 0, y: 13 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.52 }}
          >
            {theme.highlights.map((h) => (
              <span
                key={h}
                className="text-[10px] font-medium px-2.5 py-1 rounded-full backdrop-blur-[6px]"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.60)",
                }}
              >
                {h}
              </span>
            ))}
          </motion.div>

          {/* Season weather + Trip match score */}
          <motion.div
            className="flex items-end justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.44, duration: 0.48 }}
          >
            {season ? (
              <p className="text-[11px] font-medium leading-snug max-w-[58%]" style={{ color: "rgba(255,255,255,0.38)" }}>
                {season.weather}
              </p>
            ) : <div />}
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <motion.span
                initial={{ scale: 0.68, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.36, duration: 0.46, ease: "easeOut" }}
                className="text-[2.1rem] font-bold leading-none tabular-nums"
                style={{ color: scoreColor }}
              >
                {scoreDisplay}
              </motion.span>
              <span className="text-[8px] uppercase tracking-[0.20em] font-bold" style={{ color: "rgba(255,255,255,0.26)" }}>
                Trip Match
              </span>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}

/* ─── Results ─────────────────────────────────────────────── */

function TripResults({ plan, context, onReset }: { plan: TripPlan; context: TripContext | null; onReset: () => void }) {
  const scoreNum     = parseInt(plan.tripFit.score);
  const warningCount  = plan.realityCheck.filter(r => r.startsWith("⚠")).length;
  const base          = scoreNum > 10 ? Math.min(scoreNum, 98) : Math.min(scoreNum * 10, 98);
  const confidence    = Math.max(52, base - warningCount * 7);
  const confColor     = confidence >= 82 ? "#16A34A" : confidence >= 65 ? "#2551CC" : "#D97706";
  const confLabel     = confidence >= 82 ? "High confidence" : confidence >= 65 ? "Plan with awareness" : "Careful planning needed";
  const circumference = 87.96;
  const [openDay,    setOpenDay]    = useState<number>(plan.itinerary[0]?.day ?? 1);
  const [showCTA,    setShowCTA]    = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollable = document.body.scrollHeight - window.innerHeight;
      setShowCTA(scrollable > 0 && window.scrollY / scrollable > 0.30);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keyboard Cmd+P / Ctrl+P: expand all days via CSS, collapse after
  useEffect(() => {
    const before = () => setIsPrinting(true);
    const after  = () => setIsPrinting(false);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint",  after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint",  after);
    };
  }, []);

  function handleSave() {
    // flushSync forces React to re-render synchronously before window.print() captures the DOM
    flushSync(() => {
      setSaved(true);
      setIsPrinting(true);
    });
    window.print();
    setIsPrinting(false);
    setTimeout(() => setSaved(false), 1800);
  }

  function getPace(): string {
    const text = [...plan.tripFit.reasons, plan.tripFit.summary].join(" ").toLowerCase();
    if (/relaxed|leisurely|slow|unhurried/.test(text)) return "Relaxed";
    if (/adventure|active|trek|hiking|strenuous/.test(text)) return "Active";
    return "Comfortable";
  }

  function getBestFor(): string {
    return plan.tripFit.summary
      .replace(/^(great|perfect|ideal|best) for /i, "")
      .replace(/^(this trip is )?(great|perfect|ideal|best) for /i, "");
  }

  return (
    <div className={`min-h-screen bg-[#EEF3FB] pt-24 px-4 transition-[padding] duration-300 ${showCTA ? "pb-36 md:pb-20" : "pb-20"}`}>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* ── Cinematic Destination Hero ── */}
        <DestinationHero plan={plan} context={context} onReset={onReset} />

        {/* ── Trip Fit Overview ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="bg-white rounded-3xl border border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.04)] px-6 py-5 flex flex-col gap-4"
        >
          {/* Trust badges */}
          <div className="flex items-center gap-5 flex-wrap">
            {(["Reality Checked", context?.season ? "Weather Aware" : null, "Budget Matched"] as (string | null)[])
              .filter(Boolean)
              .map((badge) => (
                <span key={badge as string} className="flex items-center gap-1.5 text-[11px] text-[#6B7280] font-medium">
                  <span className="text-[#2551CC] font-bold text-xs">✓</span>
                  {badge}
                </span>
              ))}
          </div>

          {/* Reason tags */}
          {plan.tripFit.reasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {plan.tripFit.reasons.map((r, i) => {
                const warn = r.startsWith("⚠");
                return (
                  <span
                    key={i}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                      warn
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-[#EEF3FB] text-[#6B7280] border border-[#DDE8F7]"
                    }`}
                  >
                    {r}
                  </span>
                );
              })}
            </div>
          )}

          {/* Stat grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: "Weather",      value: context?.season ? `${context.season.emoji} ${context.season.name}` : "—" },
              { label: "Budget",       value: context?.budget.formatted ?? "—" },
              { label: "Travel Pace",  value: getPace() },
              { label: "Best For",     value: getBestFor() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#F9FBFF] rounded-2xl px-4 py-3.5 flex flex-col gap-1 border border-[#DDE8F7]">
                <span className="text-[9px] text-[#A8B5C8] uppercase tracking-[0.18em] font-bold">{label}</span>
                <span className="text-[13px] font-semibold text-[#1C2333] leading-snug">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Local Reality Layer ── */}
        <div className="bg-white rounded-3xl border border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.04)] p-7">

          {/* Header + Confidence Score */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-[1.25rem] font-bold text-[#1C2333] leading-tight tracking-tight">Local Reality Layer</h2>
              <p className="text-[13px] text-[#9CA3AF] mt-1.5 leading-snug">What you actually need to know · {confLabel}</p>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-1.5">
              <div className="relative w-14 h-14">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#EEF3FB" strokeWidth="2.5" />
                  <circle
                    cx="18" cy="18" r="14"
                    fill="none"
                    stroke={confColor}
                    strokeWidth="2.5"
                    strokeDasharray={`${(confidence / 100) * circumference} ${circumference}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#1C2333]">
                  {confidence}%
                </span>
              </div>
              <span className="text-[9px] text-[#A8B5C8] uppercase tracking-[0.14em] font-medium">Confidence</span>
            </div>
          </div>

          {/* Insight cards */}
          <div className="flex flex-col gap-2.5">
            {plan.realityCheck.map((item, i) => {
              const { icon, label, bg, border, iconBg, iconColor, labelColor, textColor, text } = classify(item);
              return (
                <div key={i} className={`flex gap-3.5 items-start px-4 py-4 rounded-2xl border ${bg} ${border}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${iconBg} ${iconColor}`}>
                    {icon}
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className={`text-[11px] font-medium ${labelColor}`}>{label}</span>
                    <p className={`text-[0.9375rem] leading-relaxed mt-0.5 ${textColor}`}>{text}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Travel Intelligence — 3 premium cards */}
        {context?.season && (() => {
          const s  = context.season;
          const p  = context.permit;

          const weatherNote = s.caveats.find(c =>
            /rain|monsoon|fog|cold|humid|temp|cloud|storm|snow/i.test(c)
          ) ?? s.caveats[0] ?? null;

          const roadNote = s.caveats.find(c =>
            /road|landslide|drive|pass|snow|closure|vehicle/i.test(c)
          ) ?? (p?.required ? p.tip : null) ?? null;

          const tradeoffNote = s.caveats.find(c =>
            /book|crowd|peak|busy|accommodation|reservation/i.test(c)
          ) ?? s.caveats[s.caveats.length - 1] ?? null;

          return (
            <div className="flex flex-col gap-3">

              {/* ── Card 1: Weather Snapshot ── */}
              <div className="rounded-[28px] border border-[#C0D8F5] overflow-hidden">
                <div className="bg-gradient-to-br from-[#EEF5FF] to-white px-6 pt-6 pb-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-[#DBEAFE] flex items-center justify-center text-xl shrink-0">
                      {s.emoji}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#9CA3AF] leading-none mb-1.5">Weather Snapshot</p>
                      <p className="text-xs font-semibold text-[#1D4ED8] leading-none">{s.name} · {s.months}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3.5">
                    {[s.weather, s.pacing].map((insight, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="w-1 h-1 rounded-full bg-[#2551CC]/35 mt-[7px] shrink-0" />
                        <p className="text-[0.9375rem] text-[#1C2333] leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {weatherNote && (
                  <div className="px-6 py-3.5 bg-[#EEF5FF]/60 border-t border-[#C0D8F5]/60">
                    <p className="text-[11px] text-[#2551CC] leading-snug">
                      <span className="font-bold">Note · </span>{weatherNote}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Card 2: Road & Permit Reality ── */}
              <div className="rounded-[28px] border border-[#F0CFA0] overflow-hidden">
                <div className="bg-gradient-to-br from-[#FFFBF0] to-white px-6 pt-6 pb-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] flex items-center justify-center text-xl shrink-0">
                      🛣
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#9CA3AF] leading-none mb-1.5">Road & Permit Reality</p>
                      {p?.required
                        ? <p className="text-xs font-semibold text-[#D97706] leading-none">{p.name} required</p>
                        : <p className="text-xs font-semibold text-[#059669] leading-none">No permit required</p>
                      }
                    </div>
                  </div>
                  <div className="flex flex-col gap-3.5">
                    <div className="flex gap-3 items-start">
                      <div className="w-1 h-1 rounded-full bg-[#D97706]/50 mt-[7px] shrink-0" />
                      <p className="text-[0.9375rem] text-[#1C2333] leading-relaxed">{s.roads}</p>
                    </div>
                    {p?.required ? (
                      <>
                        <div className="flex gap-3 items-start">
                          <div className="w-1 h-1 rounded-full bg-[#D97706]/50 mt-[7px] shrink-0" />
                          <p className="text-[0.9375rem] text-[#1C2333] leading-relaxed">Apply at {p.applyAt} before your trip</p>
                        </div>
                        <div className="flex gap-3 items-start">
                          <div className="w-1 h-1 rounded-full bg-[#D97706]/50 mt-[7px] shrink-0" />
                          <p className="text-[0.9375rem] text-[#1C2333] leading-relaxed">{p.cost} · valid for {p.validity}</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex gap-3 items-start">
                        <div className="w-1 h-1 rounded-full bg-[#D97706]/50 mt-[7px] shrink-0" />
                        <p className="text-[0.9375rem] text-[#1C2333] leading-relaxed">Open to all Indian travellers — no prior documentation needed</p>
                      </div>
                    )}
                  </div>
                </div>
                {(p?.tip ?? roadNote) && (
                  <div className="px-6 py-3.5 bg-[#FFFBF0]/80 border-t border-[#F0CFA0]/70">
                    <p className="text-[11px] text-[#92400E] leading-snug">
                      <span className="font-bold">Note · </span>{p?.tip ?? roadNote}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Card 3: Why This Season Works ── */}
              <div className="rounded-[28px] border border-[#A8E0BC] overflow-hidden">
                <div className="bg-gradient-to-br from-[#F0FDF6] to-white px-6 pt-6 pb-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-[#DCFCE7] flex items-center justify-center text-xl shrink-0">
                      ✨
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#9CA3AF] leading-none mb-1.5">Why This Season Works</p>
                      <p className="text-xs font-semibold text-[#16A34A] leading-none">{s.pacing.split(";")[0].split("—")[0].trim()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3.5">
                    {s.highlights.map((h, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="w-1 h-1 rounded-full bg-[#16A34A]/45 mt-[7px] shrink-0" />
                        <p className="text-[0.9375rem] text-[#1C2333] leading-relaxed">{h}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {tradeoffNote && (
                  <div className="px-6 py-3.5 bg-[#F0FDF6]/80 border-t border-[#A8E0BC]/70">
                    <p className="text-[11px] text-[#166534] leading-snug">
                      <span className="font-bold">Tradeoff · </span>{tradeoffNote}
                    </p>
                  </div>
                )}
              </div>

            </div>
          );
        })()}

        {/* Festival Alert */}
        {context && context.festivals.length > 0 && (
          <div className="rounded-3xl border border-[#DDE8F7] bg-[#EEF3FB] px-7 py-5 flex flex-col gap-3">
            <p className="text-base font-bold text-[#1C2333] tracking-tight">Festivals During Your Trip</p>
            {context.festivals.map((f) => (
              <div key={f.name} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base">🎪</span>
                  <p className="text-sm font-bold text-[#1C2333]">{f.name}</p>
                  <span className="text-xs bg-white border border-[#DDE8F7] text-[#A8B5C8] rounded-full px-2 py-0.5">{f.duration}</span>
                </div>
                <p className="text-xs text-[#6B7280] ml-7 leading-snug">{f.location} · {f.tip}</p>
              </div>
            ))}
          </div>
        )}

        {/* Getting There — Premium Timeline */}
        <div className="bg-white rounded-3xl border border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.04)] px-6 py-6 flex flex-col gap-5">
          <h2 className="text-[1.15rem] font-bold text-[#1C2333] tracking-tight">Getting There</h2>

          <div className="flex flex-col">
            {plan.transport.map((leg, i) => {
              const hint   = getTransportContext(leg);
              const isLast = i === plan.transport.length - 1;
              const parts  = leg.leg.split(/\s*[→\-–]\s*|\s+to\s+/i);
              const origin = parts[0]?.trim();
              const dest   = parts[1]?.trim();

              return (
                <div key={i} className="relative flex items-start gap-3">
                  {/* Connector line */}
                  {!isLast && (
                    <div className="absolute left-[19px] top-11 bottom-0 w-px bg-gradient-to-b from-[#DDE8F7] via-[#DDE8F7]/50 to-transparent" />
                  )}

                  {/* Transport icon badge */}
                  <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-2xl bg-[#EEF3FB] border border-[#DDE8F7]/80 flex items-center justify-center text-base shadow-[0_1px_4px_rgba(37,81,204,0.06)] mt-0.5">
                    {leg.mode}
                  </div>

                  {/* Segment card */}
                  <div className={`flex-1 bg-[#F9FBFF] rounded-2xl border border-[#DDE8F7] px-4 py-3.5 ${!isLast ? "mb-3" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        {origin && dest ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[0.9375rem] font-semibold text-[#1C2333]">{origin}</span>
                            <span className="text-xs text-[#A8B5C8] leading-none font-medium">→</span>
                            <span className="text-[0.9375rem] font-semibold text-[#1C2333]">{dest}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-[#1C2333]">{leg.leg}</span>
                        )}
                        {hint && (
                          <p className="text-[11px] text-[#6B7280] leading-snug">{hint}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {leg.duration && (
                          <span className="text-[11px] text-[#A8B5C8] bg-white border border-[#DDE8F7] rounded-full px-2.5 py-1 whitespace-nowrap leading-none">
                            {leg.duration}
                          </span>
                        )}
                        <span className="text-base font-bold text-[#2551CC] tabular-nums">{leg.cost}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stay */}
        <div className="bg-white rounded-3xl border border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.04)] px-6 py-5 flex flex-col gap-2">
          <h2 className="text-[1.15rem] font-bold text-[#1C2333] tracking-tight">Where You&apos;ll Stay</h2>
          <div className="flex items-center gap-2.5 mt-1">
            <span className="text-xl">🏨</span>
            <span className="text-lg font-bold text-[#1C2333]">{plan.stay.base}</span>
          </div>
          <p className="text-xl font-bold text-[#2551CC] tabular-nums">{plan.stay.priceRange}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {plan.stay.bestFor.map((tag) => (
              <span key={tag} className="text-xs bg-[#F9FBFF] text-[#6B7280] rounded-full px-2.5 py-1 font-medium border border-[#DDE8F7]">{tag}</span>
            ))}
          </div>
        </div>

        {/* Budget Estimate — Premium Spending Summary */}
        {(() => {
          const rows: { label: string; icon: string; val: string; color: string }[] = [
            { label: "Transport",  icon: "🚌", val: context?.budget.breakdown.transport ?? plan.budget.transport,  color: "from-[#2551CC] to-[#4A6FDB]" },
            { label: "Stay",       icon: "🏨", val: context?.budget.breakdown.stay      ?? plan.budget.stay,       color: "from-[#059669] to-[#10B981]" },
            { label: "Food",       icon: "🍛", val: context?.budget.breakdown.food      ?? plan.budget.food,       color: "from-[#D97706] to-[#F59E0B]" },
            { label: "Activities", icon: "🛺", val: context?.budget.breakdown.local     ?? plan.budget.localTravel, color: "from-[#7C3AED] to-[#A78BFA]" },
          ];
          const mids  = rows.map((r) => parseMidpoint(r.val));
          const total = mids.reduce((a, b) => a + b, 0) || 1;

          return (
            <div className="bg-white rounded-3xl border border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.04)] overflow-hidden">

              {/* Header */}
              <div className="relative px-6 pt-6 pb-5 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#EEF3FB] via-[#F4F8FF] to-white pointer-events-none" />
                <div className="absolute top-[-40px] right-[-20px] w-[180px] h-[180px] rounded-full bg-[#2551CC]/7 blur-[55px] pointer-events-none" />
                <div className="relative z-10">
                  <p className="text-xs text-[#9CA3AF] mb-4">Your estimated spend</p>
                  {context ? (
                    <>
                      <motion.p
                        key={context.budget.formatted}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="text-[2.5rem] font-bold text-[#1C2333] tabular-nums leading-none tracking-tight"
                      >
                        {context.budget.formatted}
                      </motion.p>
                      <p className="text-sm text-[#6B7280] mt-2.5 font-medium">
                        For {context.travelers} traveller{context.travelers !== 1 ? "s" : ""}
                        {" · "}{context.days} day{context.days !== 1 ? "s" : ""}
                      </p>
                    </>
                  ) : (
                    <p className="text-base font-bold text-[#6B7280]">Estimated cost breakdown</p>
                  )}
                </div>
              </div>

              {/* Category bars */}
              <div className="px-6 pb-6 pt-5 flex flex-col gap-4 border-t border-[#DDE8F7]/60">
                {rows.map(({ label, icon, val, color }, i) => {
                  const pct = Math.max(5, Math.round((mids[i] / total) * 100));
                  return (
                    <div key={label} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{icon}</span>
                          <span className="text-[0.9375rem] font-medium text-[#1C2333]">{label}</span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-xs text-[#A8B5C8] tabular-nums w-7 text-right">{pct}%</span>
                          <span className="text-[0.9375rem] font-semibold text-[#1C2333] tabular-nums min-w-[80px] text-right">{val}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[#EEF3FB] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 * i }}
                          className={`h-full rounded-full bg-gradient-to-r ${color}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })()}

        {/* Itinerary — Accordion */}
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[1.15rem] font-bold text-[#1C2333] tracking-tight px-1 mb-2">Day-by-Day Journey</h2>

          {plan.itinerary.map((day) => {
            const isOpen = isPrinting || openDay === day.day;
            const theme  = getDayTheme(day.location, day.highlights);
            const ts     = THEME_STYLES[theme] ?? THEME_STYLES.Explore;
            const [morning, afternoon, evening] = distributeHighlights(day.highlights);
            const note   = getDayNote(day.location, day.highlights, plan.realityCheck);
            const slots  = [
              { icon: "🌅", label: "Morning",   items: morning },
              { icon: "☀️",  label: "Afternoon", items: afternoon },
              { icon: "🌙", label: "Evening",   items: evening },
            ].filter(s => s.items.length > 0);

            return (
              <div
                key={day.day}
                className={`rounded-2xl border bg-white overflow-hidden transition-shadow duration-200 ${
                  isOpen
                    ? "border-[#C8D9F5] shadow-[0_4px_20px_rgba(37,81,204,0.08)]"
                    : "border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.03)]"
                }`}
              >
                {/* Card header — always visible, hidden on print */}
                <button
                  type="button"
                  onClick={() => setOpenDay(isPrinting ? day.day : isOpen ? -1 : day.day)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[#FAFBFF] transition-colors duration-150 print-hide"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-colors duration-200 ${
                      isOpen ? "bg-[#2551CC] text-white" : "bg-[#EEF3FB] text-[#2551CC]"
                    }`}>
                      {day.day}
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-[0.9375rem] font-bold text-[#1C2333] leading-tight truncate">{day.location}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit leading-none ${ts.bg} ${ts.text} ${ts.border}`}>
                        {theme}
                      </span>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="flex-shrink-0 text-[#A8B5C8]"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                </button>

                {/* Expandable body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: "hidden" }}
                      className="accordion-body"
                    >
                      <div className="px-5 pb-5 pt-4 flex flex-col gap-4 border-t border-[#DDE8F7]/70">

                        {/* Time slots */}
                        {slots.map((slot, si) => (
                          <div key={slot.label} className="flex gap-3">
                            {/* Icon + connector line */}
                            <div className="flex flex-col items-center shrink-0 pt-0.5">
                              <span className="text-[1.05rem] leading-none">{slot.icon}</span>
                              {si < slots.length - 1 && (
                                <div className="w-px flex-1 bg-gradient-to-b from-[#DDE8F7] to-[#DDE8F7]/20 mt-2 min-h-[16px]" />
                              )}
                            </div>
                            {/* Content */}
                            <div className="flex flex-col gap-1.5 pb-1 min-w-0">
                              <p className="text-[11px] font-medium text-[#A8B5C8] leading-none">{slot.label}</p>
                              {slot.items.map((item, ii) => (
                                <p key={ii} className="text-[0.9375rem] text-[#1C2333] leading-relaxed">{item}</p>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* Reality note */}
                        {note && (
                          <div className="flex items-start gap-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-3.5 py-3">
                            <span className="text-sm leading-none mt-0.5 shrink-0">⚡</span>
                            <p className="text-[11px] text-[#92400E] leading-snug">{note}</p>
                          </div>
                        )}

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── Desktop: floating bottom-right card ── */}
      <AnimatePresence>
        {showCTA && (
          <motion.div
            key="cta-desktop"
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="print-hide hidden md:flex fixed bottom-7 right-7 z-50 flex-col gap-3 p-5 w-[222px] rounded-[24px] bg-white/85 backdrop-blur-[22px] border border-white/60 shadow-[0_12px_48px_rgba(14,22,64,0.16),0_2px_8px_rgba(14,22,64,0.07),inset_0_1px_0_rgba(255,255,255,0.92)]"
          >
            <p className="text-sm font-bold text-[#1C2333] leading-snug">Love this trip?</p>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#2551CC] to-[#163099] text-white text-sm font-semibold rounded-2xl px-4 py-2.5 hover:opacity-90 active:scale-[0.97] transition-all shadow-sm"
            >
              {saved ? (
                <><span>✓</span><span>Saved!</span></>
              ) : (
                <><span>🔖</span><span>Save Itinerary</span></>
              )}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex items-center justify-center gap-1.5 bg-[#EEF3FB] text-[#2551CC] text-sm font-semibold rounded-2xl px-4 py-2.5 hover:bg-[#DDE8F7] active:scale-[0.97] transition-all border border-[#DDE8F7]"
            >
              <span>←</span><span>Plan Another Trip</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile: sticky bottom action bar ── */}
      <AnimatePresence>
        {showCTA && (
          <motion.div
            key="cta-mobile"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: 24 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="print-hide flex md:hidden fixed bottom-0 inset-x-0 z-50 flex-col gap-2.5 px-4 pt-4 pb-[max(1.75rem,env(safe-area-inset-bottom,1.75rem))] bg-white/90 backdrop-blur-[24px] border-t border-[#DDE8F7]/50 shadow-[0_-6px_32px_rgba(14,22,64,0.11),inset_0_1px_0_rgba(255,255,255,0.85)]"
          >
            <p className="text-[10px] font-bold text-[#A8B5C8] text-center uppercase tracking-[0.16em]">Love this trip?</p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#2551CC] to-[#163099] text-white text-sm font-semibold rounded-2xl py-3.5 hover:opacity-90 active:scale-[0.97] transition-all shadow-sm"
              >
                {saved ? "✓ Saved!" : "🔖 Save"}
              </button>
              <button
                type="button"
                onClick={onReset}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#EEF3FB] text-[#2551CC] text-sm font-semibold rounded-2xl py-3.5 hover:bg-[#DDE8F7] active:scale-[0.97] transition-all border border-[#DDE8F7]"
              >
                ← Plan Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

/* ─── Homepage ────────────────────────────────────────────── */

function HomePage({
  form, setForm, onSubmit, error,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  error: string;
}) {
  const tripDays = form.startDate && form.endDate
    ? differenceInCalendarDays(form.endDate, form.startDate) + 1
    : form.startDate ? 1 : 5;

  const isReady =
    form.origin.trim() !== "" &&
    form.startDate !== undefined &&
    form.endDate   !== undefined &&
    form.travelers >= 1 &&
    form.vibes.length > 0;

  function toggleVibe(v: string) {
    setForm((prev) => ({
      ...prev,
      vibes: prev.vibes.includes(v) ? prev.vibes.filter((x) => x !== v) : [...prev.vibes, v],
    }));
  }

  return (
    <div>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#1D3050] pt-16 pb-56 md:pb-64 flex flex-col justify-center min-h-[80vh]">

        {/* Bright sky glow — wide dawn light from high above the ridge */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_130%_65%_at_50%_-8%,_#2E5485_0%,_transparent_58%)]" />

        {/* Left-side mountain atmosphere — fog drifting through valley */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(110,158,230,0.16)_0%,_transparent_52%)]" />

        {/* Right-side sky warmth — morning light diffusing through mist */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(140,180,240,0.10)_0%,_transparent_50%)]" />

        {/* Wide diffuse mist orb — soft pre-dawn cloud light from left */}
        <div className="absolute top-[-8%] left-[-10%] w-[780px] h-[560px] rounded-full bg-[#5088C0]/9 blur-[130px] pointer-events-none" />

        {/* Centre sky glow — the brightening horizon behind the clouds */}
        <div className="absolute top-[5%] right-[2%] w-[620px] h-[620px] rounded-full bg-[#2551CC]/10 blur-[120px] pointer-events-none" />

        {/* Horizontal mist band — fog line draped across the mountain ridges */}
        <div className="absolute top-[38%] inset-x-0 h-[260px] bg-[radial-gradient(ellipse_100%_100%_at_50%_50%,_rgba(170,210,248,0.07)_0%,_transparent_100%)] pointer-events-none" />

        {/* Low valley mist — soft haze at the base */}
        <div className="absolute bottom-[15%] inset-x-0 h-[180px] bg-[radial-gradient(ellipse_80%_100%_at_50%_100%,_rgba(180,215,250,0.05)_0%,_transparent_100%)] pointer-events-none" />

        {/* Vignette — barely-there edge depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_52%,_rgba(14,24,46,0.22)_100%)] pointer-events-none" />

        {/* Bottom fog fade — smooth dissolve into form card */}
        <div className="absolute bottom-0 inset-x-0 h-56 bg-gradient-to-t from-[#EEF3FB]/28 to-transparent pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-5 sm:px-6 text-center pt-6 sm:pt-0">

          {/* Premium badge */}
          <div className="inline-flex items-center gap-2.5 bg-white/8 text-white/55 text-[10px] font-medium px-5 py-2 rounded-full mb-12 sm:mb-10 border border-white/12 tracking-[0.2em] uppercase">
            <span className="w-1 h-1 rounded-full bg-[#89B4FF] inline-block shrink-0" />
            Northeast India · Planned Properly
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white leading-[1.06] tracking-tight mb-7 sm:mb-6">
            Plan Northeast India<br />
            <span className="bg-gradient-to-r from-[#89B4FF] to-[#C0D8FF] bg-clip-text text-transparent">
              Without The Research Rabbit Hole
            </span>
          </h1>

          <p className="text-base md:text-lg text-white/50 max-w-xl mx-auto leading-relaxed font-light mb-10 sm:mb-8">
            Real routes, local intelligence and practical itineraries —<br />without hours of research.
          </p>
          <p className="text-xs text-white/35 tracking-[0.18em] uppercase font-medium">
            Built for travellers planning real Northeast journeys
          </p>

        </div>
      </section>

      {/* ── Floating Planner Card ── */}
      <div id="planner" className="relative z-10 max-w-4xl mx-auto px-4 -mt-48 md:-mt-56 scroll-mt-20">
        <form
          onSubmit={onSubmit}
          noValidate
          className="bg-white/62 backdrop-blur-[28px] rounded-3xl shadow-[0_32px_120px_rgba(14,22,46,0.20),0_8px_32px_rgba(14,22,46,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] border border-white/35 p-8 md:p-12"
        >
          <p className="text-[10px] font-bold text-[#6B7280]/40 uppercase tracking-[0.16em] mb-9">Plan your trip</p>

          {/* Row 1: From + Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-9 mb-9">

            <div className="flex flex-col gap-2.5">
              <label className="text-[10px] font-bold text-[#6B7280]/45 uppercase tracking-[0.14em]">From</label>
              <input
                type="text"
                placeholder="Your city — Delhi, Bangalore, Kolkata..."
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                className="rounded-2xl border border-[#DDE8F7] bg-white/70 px-5 py-4 text-sm text-[#1C2333] placeholder-[#A8B5C8] outline-none focus:border-[#2551CC] focus:ring-2 focus:ring-[#2551CC]/10 transition"
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-[10px] font-bold text-[#6B7280]/45 uppercase tracking-[0.14em]">Destination</label>
              <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1 pt-3">
                {DESTINATIONS.map((d) => (
                  <div key={d.name} className="relative flex-shrink-0">
                    <Pill selected={form.destination === d.name} onClick={() => setForm({ ...form, destination: d.name })} disabled={!d.active}>
                      {d.emoji} {d.short}
                    </Pill>
                    {!d.active && (
                      <span className="absolute -top-2 -right-1.5 text-[9px] font-bold bg-[#DDE8F7] text-[#6B7280] px-1.5 py-0.5 rounded-full leading-none">Soon</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Row 2: Travel Dates */}
          <div className="mb-9">
            <div className="flex flex-col gap-2.5">
              <label className="text-[10px] font-bold text-[#6B7280]/45 uppercase tracking-[0.14em]">Travel Dates</label>
              <DateRangePicker
                value={form.startDate ? { from: form.startDate, to: form.endDate } : undefined}
                onChange={(range: DateRange | undefined) =>
                  setForm((prev) => ({ ...prev, startDate: range?.from, endDate: range?.to }))
                }
              />
            </div>
          </div>

          {/* Season Snippet */}
          {form.startDate && (
            <div className="mb-9">
              <SeasonSnippet destination={form.destination} startDate={form.startDate} />
            </div>
          )}

          <Divider />

          {/* Estimate Your Budget */}
          <div className="mb-9">
            <TripBudgetEstimator
              travelers={form.travelers}
              days={tripDays}
              onTravelersChange={(n) => setForm({ ...form, travelers: n })}
              selectedBudgetId={form.budget.toLowerCase()}
              onBudgetSelect={(id) =>
                setForm({ ...form, budget: id.charAt(0).toUpperCase() + id.slice(1) })
              }
            />
          </div>

          <Divider />

          {/* Travel Mood */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold text-[#6B7280]/45 uppercase tracking-[0.14em]">Travel Mood</label>
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => (
                <Pill key={v} selected={form.vibes.includes(v)} onClick={() => toggleVibe(v)}>{v}</Pill>
              ))}
            </div>
          </div>

          {error && <p className="mt-5 text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            className={`mt-10 w-full rounded-2xl bg-gradient-to-r from-[#2551CC] to-[#1C306E] text-white py-4 text-base font-semibold hover:opacity-95 active:scale-[0.99] transition-all tracking-wide ${isReady ? "cta-ready" : "shadow-sm opacity-80"}`}
          >
            Generate My Trip →
          </button>

        </form>
      </div>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 pt-28 pb-20 scroll-mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          {[
            {
              num: "01",
              label: "Realistic Routes",
              desc: "No impossible itineraries. Every route follows real Northeast travel patterns — road conditions, shared transport and actual journey times.",
            },
            {
              num: "02",
              label: "Local Intelligence",
              desc: "Seasonal caveats, permit requirements and road closures are baked into every plan — not mentioned as an afterthought.",
            },
            {
              num: "03",
              label: "Budget Transparency",
              desc: "Trips matched to what you actually want to spend, with honest per-person estimates across transport, stays and food.",
            },
          ].map(({ num, label, desc }) => (
            <div key={label} className="flex flex-col gap-4">
              <span className="text-[11px] font-bold text-[#2551CC]/40 tracking-[0.22em] uppercase">{num}</span>
              <div className="w-6 h-px bg-[#DDE8F7]" />
              <h3 className="text-[15px] font-bold text-[#1C2333] leading-snug">{label}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Destinations ── */}
      <section id="destinations" className="max-w-6xl mx-auto px-4 pb-24 scroll-mt-20">
        <h2 className="text-2xl font-bold text-[#1C2333] mb-2">Destinations</h2>
        <p className="text-sm text-[#A8B5C8] mb-8">Northeast India, planned properly.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              name: "Meghalaya",
              tagline: "Living root bridges. Monsoon clouds. Clean air.",
              places: "Shillong · Cherrapunji · Dawki",
              from: "from-[#0C1730]", via: "via-[#112045]", to: "to-[#0D1A38]",
              badge: "Available Now", badgeBg: "bg-[#2551CC]",
              emoji: "🌿",
            },
            {
              name: "Arunachal Pradesh",
              tagline: "Tawang monastery. Sunrise at Sela Pass.",
              places: "Tawang · Ziro · Bomdila",
              from: "from-[#2A1A0D]", via: "via-[#4A2C14]", to: "to-[#3A2010]",
              badge: "Coming Soon", badgeBg: "bg-[#6B4020]/70",
              emoji: "🏔",
            },
            {
              name: "Sikkim",
              tagline: "Himalayan views. Tsomgo Lake. Quiet mountain towns.",
              places: "Gangtok · Lachung · Pelling",
              from: "from-[#182030]", via: "via-[#223348]", to: "to-[#1A2A3C]",
              badge: "Coming Soon", badgeBg: "bg-[#3A5070]/70",
              emoji: "❄️",
            },
          ].map((dest) => (
            <div
              key={dest.name}
              className={`bg-gradient-to-br ${dest.from} ${dest.via} ${dest.to} rounded-3xl p-8 flex flex-col gap-5 min-h-[280px] relative overflow-hidden`}
            >
              <div className="absolute bottom-0 right-4 text-[110px] opacity-[0.07] leading-none select-none pointer-events-none">
                {dest.emoji}
              </div>
              <span className={`${dest.badgeBg} text-white/90 text-[10px] font-semibold px-3 py-1.5 rounded-full self-start tracking-[0.12em] uppercase`}>
                {dest.badge}
              </span>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{dest.name}</h3>
                <p className="text-white/50 text-sm leading-snug">{dest.tagline}</p>
              </div>
              <p className="text-white/30 text-xs font-medium mt-auto tracking-wide">{dest.places}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

/* ─── Root component ──────────────────────────────────────── */

export default function TripPlannerForm() {
  const [form, setForm]               = useState<FormState>(INITIAL);
  const [loading, setLoading]         = useState(false);
  const [plan, setPlan]               = useState<TripPlan | null>(null);
  const [tripContext, setTripContext]  = useState<TripContext | null>(null);
  const [error, setError]             = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.origin.trim()) { setError("Please enter your origin city."); return; }
    if (!form.startDate)     { setError("Please select your travel dates."); return; }
    if (!form.budget)        { setError("Please select a budget.");          return; }

    const tripDays = form.endDate
      ? differenceInCalendarDays(form.endDate, form.startDate) + 1
      : 1;

    const month = form.startDate.getMonth() + 1;
    const context: TripContext = {
      days:               tripDays,
      travelers:          form.travelers,
      destination:        form.destination,
      startDateFormatted: format(form.startDate, "d MMM yyyy"),
      endDateFormatted:   form.endDate ? format(form.endDate, "d MMM yyyy") : format(form.startDate, "d MMM yyyy"),
      month,
      budget:    computeBudget(form.budget as BudgetTier, tripDays, form.travelers, form.destination),
      season:    getSeasonData(form.destination, month),
      permit:    PERMIT_INFO[form.destination] ?? PERMIT_INFO["Meghalaya"],
      festivals: getFestivals(form.destination, month),
    };

    const computedBudget = context.budget;

    setError("");
    setLoading(true);
    setPlan(null);
    setTripContext(context);

    try {
      const budgetMeta = BUDGET_LEVELS.find((l) => l.key === form.budget);
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin:         form.origin.trim(),
          destination:    form.destination,
          startDate:      format(form.startDate, "yyyy-MM-dd"),
          endDate:        form.endDate ? format(form.endDate, "yyyy-MM-dd") : format(form.startDate, "yyyy-MM-dd"),
          days:           tripDays,
          budget:         form.budget,
          vibes:          form.vibes,
          travelers:      form.travelers,
          budgetTier:     budgetMeta?.budgetTier,
          budgetStyle:    budgetMeta?.budgetStyle,
          budgetRange:    computedBudget.formatted,
          seasonName:     context.season?.name ?? "",
          seasonNote:     context.season ? `${context.season.weather}. ${context.season.roads}` : "",
          permitRequired: context.permit.required,
          permitName:     context.permit.name,
          festivals:      context.festivals.map((f) => f.name),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); return; }
      setPlan(data.plan);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPlan(null);
    setTripContext(null);
    setForm(INITIAL);
  }

  if (loading) return <LoadingState />;
  if (plan)    return <TripResults plan={plan} context={tripContext} onReset={handleReset} />;

  return <HomePage form={form} setForm={setForm} onSubmit={handleSubmit} error={error} />;
}
