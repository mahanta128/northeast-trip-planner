"use client";

import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInCalendarDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import dynamic from "next/dynamic";
import Image from "next/image";
import DateRangePicker from "./DateRangePicker";
import TripBudgetEstimator from "./TripBudgetEstimator";
import { PremiumIcon, InlineIcon } from "./ui/Icon";
import {
  computeBudget, getSeasonData, PERMIT_INFO, getFestivals,
  type BudgetTier, type ComputedBudget, type SeasonData, type PermitData, type FestivalData,
} from "../lib/tripData";

const JourneyMap = dynamic(() => import("./JourneyMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#F4F7FD] animate-pulse rounded-b-3xl">
      <span className="text-[12px] text-[#A8B5C8] font-medium">Loading map…</span>
    </div>
  ),
});

/* ─── Constants ───────────────────────────────────────────── */

const DESTINATIONS = [
  { name: "Meghalaya",          short: "Meghalaya",  icon: "tree-pine", active: true  },
  { name: "Arunachal Pradesh",  short: "Arunachal",  icon: "mountain",  active: false },
  { name: "Sikkim",             short: "Sikkim",     icon: "snowflake", active: false },
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
  origin: string;
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
  selected, onClick, disabled, children, accentColor,
}: {
  selected: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode;
  accentColor?: string;
}) {
  const selectedOverride = selected && !disabled && accentColor
    ? { background: accentColor, borderColor: accentColor }
    : {};
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      style={selectedOverride}
      className={`relative px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
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

function SeasonSnippet({ destination, startDate, moodBorder, moodBg }: {
  destination: string;
  startDate: Date | undefined;
  moodBorder?: string;
  moodBg?: string;
}) {
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
        className="rounded-2xl border px-4 py-3.5 flex flex-col gap-2.5 transition-colors duration-500"
        style={{ borderColor: moodBorder ?? "#DDE8F7", background: moodBg ?? "rgba(238,243,251,0.6)" }}
      >
        {season && (
          <div className="flex items-start gap-2.5">
            <PremiumIcon name={season.icon} size={14} containerSize={28} radius={9} strokeWidth={1.75} shadow="none" className="mt-0.5" />
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
            <InlineIcon name="warning" size={13} strokeWidth={1.75} className="shrink-0 mt-0.5" />
            <p className="text-xs text-[#7B4A2A] leading-snug">
              <span className="font-semibold">{permit.name}</span> required — apply before travel
            </p>
          </div>
        )}
        {festivals.length > 0 && (
          <div className="flex items-start gap-2 pt-2 border-t border-[#DDE8F7]/60">
            <InlineIcon name="festival" size={13} strokeWidth={1.75} className="shrink-0 mt-0.5" />
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
        <span className="absolute inset-0 flex items-center justify-center">
          <InlineIcon name="compass" size={22} strokeWidth={1.5} color="#2551CC" />
        </span>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-[#1C2333]">Crafting your Rhinotrek journey</p>
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
        icon: "weather", label: "Weather Advisory",
        bg: "bg-[#EFF8FF]", border: "border-[#BAE0FD]",
        iconBg: "bg-[#DBEAFE]", iconColor: "text-[#1D4ED8]",
        labelColor: "text-[#1D4ED8]", textColor: "text-[#1E3A5F]", text,
      };
    if (/road|landslide|traffic|route|drive|highway|motorable|jeep|vehicle|km|hour/.test(t))
      return {
        icon: "road", label: "Road Advisory",
        bg: "bg-[#FFF7ED]", border: "border-[#FDBA74]",
        iconBg: "bg-[#FFEDD5]", iconColor: "text-[#C2410C]",
        labelColor: "text-[#C2410C]", textColor: "text-[#7C2D12]", text,
      };
    return {
      icon: "warning", label: "Warning",
      bg: "bg-[#FFFBEB]", border: "border-[#FDE68A]",
      iconBg: "bg-[#FEF3C7]", iconColor: "text-[#B45309]",
      labelColor: "text-[#B45309]", textColor: "text-[#78350F]", text,
    };
  }

  if (/^(book|bring|carry|check|consider|avoid|plan|note|remember|ensure|verify|download|ask|arrange|use|opt|hire|get|buy|pay)/i.test(text))
    return {
      icon: "tip", label: "Travel Tip",
      bg: "bg-[#F9FBFF]", border: "border-[#DDE8F7]",
      iconBg: "bg-[#EEF3FB]", iconColor: "text-[#2551CC]",
      labelColor: "text-[#2551CC]", textColor: "text-[#1C2333]", text,
    };

  return {
    icon: "check", label: "Confirmed",
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
  const mode  = leg.mode.toLowerCase();
  if (/flight|air|plane/.test(mode) || /airport|airline/.test(route))
    return "Book 3–4 weeks ahead for best fares";
  if (/train|rail/.test(mode) || /railway|station/.test(route))
    return "Reserve berths early — trains fill quickly";
  if (/ferry|boat|ship/.test(mode) || /river|brahmaputra|ferry|cruise/.test(route))
    return "Check seasonal ferry schedules in advance";
  if (/mountain|hill|cherrapunji|dawki|mawlynnong|tawang|ziro|mechuka|dzukou|arunachal|sikkim|manipur/.test(route))
    return "Mountain roads — plan arrival before sunset";
  if (/kaziranga|manas|park|reserve|sanctuary/.test(route))
    return "Entry permits required — arrange ahead";
  if (/scenic|valley|tea garden|plantation/.test(route))
    return "Scenic stretch — allow time for stops";
  return null;
}

function isTaxiMode(mode: string): boolean {
  // also catches emoji-prefixed AI strings like "🚕 Shared Cab"
  return /🚕|🚗|🚙|🚘|🚖/.test(mode) ||
    /taxi|cab|jeep|suv|innova|bolero|sedan|car|shared.*cab|private.*cab/i.test(mode);
}

function isFlightMode(leg: { mode: string; leg: string }): boolean {
  const mode  = leg.mode;
  const route = leg.leg.toLowerCase();
  return /✈|flight|air|plane/i.test(mode) || /airport|airline/.test(route);
}

function getTransportIconName(leg: { mode: string; leg: string }): string {
  const mode  = leg.mode.toLowerCase();
  const route = leg.leg.toLowerCase();
  if (/train|rail/.test(mode) || /railway|station/.test(route)) return "train";
  if (/ferry|boat|ship/.test(mode) || /river|ferry|cruise/.test(route)) return "ship";
  if (/bus/.test(mode)) return "bus";
  return "transport";
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

/* ─── Destination Mood System ─────────────────────────────── */

interface MoodTheme {
  moodLabel:   string;
  moodTagline: string;
  pageBg:      string;
  pageGlow:    string;
  cardBorder:  string;
  cardTint:    string;
  accentColor: string;
  accentLight: string;
  formGlow:    string;
}

const MOOD_THEMES: Record<string, MoodTheme> = {
  Meghalaya: {
    moodLabel:   "Monsoon Serenity",
    moodTagline: "Misty · Calm · Adventurous",
    pageBg:      "#E8EEF8",
    pageGlow:    "radial-gradient(ellipse 100% 45% at 50% 0%, rgba(37,81,204,0.07) 0%, transparent 100%)",
    cardBorder:  "#D2E0F2",
    cardTint:    "#F4F8FD",
    accentColor: "#2551CC",
    accentLight: "#EEF3FB",
    formGlow:    "0 32px 120px rgba(14,22,46,0.20), 0 8px 32px rgba(14,22,46,0.08)",
  },
  "Arunachal Pradesh": {
    moodLabel:   "Mountain Expedition",
    moodTagline: "Adventure · Rugged · Sunrise Energy",
    pageBg:      "#EDE9E1",
    pageGlow:    "radial-gradient(ellipse 100% 45% at 50% 0%, rgba(184,94,26,0.09) 0%, transparent 100%)",
    cardBorder:  "#DDD5C8",
    cardTint:    "#FAF7F3",
    accentColor: "#B85E1A",
    accentLight: "#FBF1E7",
    formGlow:    "0 32px 120px rgba(184,94,26,0.16), 0 8px 32px rgba(184,94,26,0.08)",
  },
  Sikkim: {
    moodLabel:   "Alpine Calm",
    moodTagline: "Minimal · Peaceful · Elevated",
    pageBg:      "#EBF1F8",
    pageGlow:    "radial-gradient(ellipse 100% 45% at 50% 0%, rgba(26,75,175,0.07) 0%, transparent 100%)",
    cardBorder:  "#D0DCF0",
    cardTint:    "#F5F8FD",
    accentColor: "#1A4BAF",
    accentLight: "#EBF1FB",
    formGlow:    "0 32px 120px rgba(26,75,175,0.16), 0 8px 32px rgba(26,75,175,0.08)",
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
                  {season.name}
                </span>
              )}
            </div>
          </motion.div>

          <button
            onClick={onReset}
            className="print-hide shrink-0 text-[11px] text-white/30 border border-white/10 rounded-full px-3.5 py-1.5 hover:bg-white/8 transition-all font-medium backdrop-blur-sm"
          >
            <span className="inline-flex items-center gap-1.5"><InlineIcon name="arrow-left" size={11} strokeWidth={2} color="rgba(255,255,255,0.30)" />Plan Again</span>
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

/* ─── Confidence tier system ─────────────────────────────── */

const CONF_TIERS = [
  { min: 85, color: "#059669", track: "#DCFCE7", glow: "rgba(5,150,105,0.15)",  label: "Excellent Match" },
  { min: 70, color: "#2551CC", track: "#EEF3FB", glow: "rgba(37,81,204,0.15)",  label: "Great Match"     },
  { min: 50, color: "#D97706", track: "#FEF3C7", glow: "rgba(217,119,6,0.15)",  label: "Mixed Tradeoffs" },
  { min: 0,  color: "#DC2626", track: "#FEE2E2", glow: "rgba(220,38,38,0.15)",  label: "High Tradeoffs"  },
] as const;

function getConfTier(score: number) {
  return CONF_TIERS.find(t => score >= t.min) ?? CONF_TIERS[CONF_TIERS.length - 1];
}

/* ─── Trip Confidence Block ───────────────────────────────── */

interface TripConfidenceProps {
  plan: TripPlan;
  context: TripContext | null;
  pace: string;
  bestFor: string;
}

function TripConfidenceBlock({ plan, context, pace, bestFor }: TripConfidenceProps) {
  const destMood = MOOD_THEMES[context?.destination ?? "Meghalaya"] ?? MOOD_THEMES["Meghalaya"]!;
  const [count, setCount] = useState(0);
  const hasRun  = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const scoreNum     = parseInt(plan.tripFit.score);
  const rawScore     = scoreNum > 10 ? Math.min(scoreNum, 98) : Math.min(scoreNum * 10, 98);
  const warningCount = plan.realityCheck.filter(r => r.startsWith("⚠")).length;
  const confidence   = Math.max(45, rawScore - warningCount * 6);
  const tier         = getConfTier(confidence);
  const season       = context?.season;
  const realityText  = [...plan.realityCheck, plan.tripFit.summary].join(" ").toLowerCase();

  const drivers = [
    {
      label: "Weather alignment",
      ok: season?.name !== "Monsoon" &&
          !realityText.match(/heavy rain.*avoid|roads.*impassable|dangerous.*storm/),
    },
    {
      label: "Budget fit",
      ok: !plan.realityCheck.some(r => r.startsWith("⚠") && r.toLowerCase().includes("budget")),
    },
    {
      label: "Travel pace realism",
      ok: (context?.days ?? 7) >= 5,
    },
    {
      label: "Seasonal suitability",
      ok: season?.name !== "Monsoon",
    },
    {
      label: "Route feasibility",
      ok: !plan.realityCheck.some(
        r => r.startsWith("⚠") && /road|landslide|closure|blocked/.test(r.toLowerCase()),
      ),
    },
  ];

  const aligned = drivers.filter(d => d.ok).length;
  const R = 54;
  const C = 2 * Math.PI * R; // ≈ 339.29

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true;
          const dur = 900;
          const t0  = performance.now();
          const tick = (now: number) => {
            const t = Math.min((now - t0) / dur, 1);
            setCount(Math.round((1 - (1 - t) ** 3) * confidence));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [confidence]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.5 }}
      className="bg-white rounded-3xl border border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.04)] overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-5 border-b border-[#F0F4FB]">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[9px] uppercase tracking-[0.22em] font-bold" style={{ color: destMood.accentColor }}>
            Trip Intelligence
          </p>
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full border"
            style={{
              color:       destMood.accentColor,
              background:  destMood.accentLight,
              borderColor: destMood.cardBorder,
            }}
          >
            {destMood.moodLabel}
          </span>
        </div>
        <h2 className="text-[1.2rem] font-bold text-[#1C2333] tracking-tight leading-tight">Trip Confidence</h2>
      </div>

      {/* ── Ring + Drivers ── */}
      <div className="px-6 py-7 flex flex-col sm:flex-row items-center sm:items-start gap-8">

        {/* Ring */}
        <div className="shrink-0 flex flex-col items-center gap-3">
          <div className="relative" style={{ width: 144, height: 144 }}>
            {/* Ambient glow */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${tier.glow} 0%, transparent 70%)`,
                transform: "scale(1.18)",
              }}
            />
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r={R} fill="none" stroke={tier.track} strokeWidth="7" />
              <motion.circle
                cx="60" cy="60" r={R}
                fill="none"
                stroke={tier.color}
                strokeWidth="7"
                strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${C}` }}
                animate={{ strokeDasharray: `${(confidence / 100) * C} ${C}` }}
                transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.55 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <div className="flex items-end gap-0.5">
                <span
                  className="text-[2.6rem] font-extrabold tabular-nums leading-none tracking-[-0.03em]"
                  style={{ color: tier.color }}
                >
                  {count}
                </span>
                <span
                  className="text-base font-bold leading-[2.1] tabular-nums"
                  style={{ color: tier.color, opacity: 0.6 }}
                >
                  %
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-0.5 text-center">
            <span className="text-[13.5px] font-bold leading-none" style={{ color: tier.color }}>
              {tier.label}
            </span>
            <span className="text-[11px] text-[#A8B5C8] font-medium mt-0.5">
              {aligned} of 5 factors confirmed
            </span>
          </div>
        </div>

        {/* Drivers */}
        <div className="flex-1 w-full flex flex-col justify-center gap-3.5 sm:pt-1">
          <p className="text-[10px] text-[#A8B5C8] uppercase tracking-[0.18em] font-bold">
            Confidence Drivers
          </p>
          {drivers.map((driver, i) => (
            <motion.div
              key={driver.label}
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-16px" }}
              transition={{ duration: 0.30, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.60 + i * 0.07 }}
              className={`flex items-center gap-3 rounded-xl py-1 px-2 -mx-2 transition-colors ${!driver.ok ? "bg-amber-50/60" : ""}`}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={
                  driver.ok
                    ? { background: `${tier.color}1A` }
                    : { background: "#FEF3C7" }
                }
              >
                {driver.ok
                  ? <InlineIcon name="check2" size={11} strokeWidth={2.5} color={tier.color} />
                  : <InlineIcon name="warning" size={11} strokeWidth={2} color="#D97706" />
                }
              </div>
              <span className="text-[13.5px] font-medium text-[#374151] leading-none flex-1">
                {driver.label}
              </span>
              {!driver.ok && (
                <span className="text-[9.5px] font-semibold text-[#D97706] bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                  Review
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Stat grid ── */}
      <div className="px-6 pb-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: "Weather",     value: season ? season.name : "—" },
          { label: "Budget",      value: context?.budget.formatted ?? "—"              },
          { label: "Travel Pace", value: pace                                           },
          { label: "Best For",    value: bestFor                                        },
        ].map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.06 * i }}
            className="rounded-2xl px-4 py-3.5 flex flex-col gap-1 border transition-colors duration-500"
            style={{ background: destMood.cardTint, borderColor: destMood.cardBorder }}
          >
            <span className="text-[9px] text-[#A8B5C8] uppercase tracking-[0.18em] font-bold">{label}</span>
            <span className="text-[13px] font-semibold text-[#1C2333] leading-snug">{value}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Results ─────────────────────────────────────────────── */

function TripResults({ plan, context, onReset }: { plan: TripPlan; context: TripContext | null; onReset: () => void }) {
  const mood = MOOD_THEMES[context?.destination ?? "Meghalaya"] ?? MOOD_THEMES["Meghalaya"]!;

  const scoreNum     = parseInt(plan.tripFit.score);
  const scoreDisplay = scoreNum > 10 ? `${scoreNum}%` : `${scoreNum * 10}%`;
  const [openDay,    setOpenDay]    = useState<number>(plan.itinerary[0]?.day ?? 1);
  const [showCTA,    setShowCTA]    = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [sharing,    setSharing]    = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowCTA(window.scrollY > 420);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    try {
      localStorage.setItem("ntp-saved-trip", JSON.stringify({
        plan, context, savedAt: new Date().toISOString(),
      }));
    } catch { /* localStorage unavailable */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  }

  async function handleShare() {
    const lines = [
      plan.tripTitle,
      context?.destination ?? "Northeast India",
      context ? `${context.startDateFormatted} – ${context.endDateFormatted} · ${context.days} Day${context.days !== 1 ? "s" : ""}` : "",
      context ? `${context.travelers} Traveller${context.travelers !== 1 ? "s" : ""}` : "",
      context ? `${context.budget.formatted} per person` : "",
      `Trip Match: ${scoreDisplay} — ${plan.tripFit.summary}`,
      "",
      "Planned with Rhinotrek",
    ].filter(Boolean);
    const text = lines.join("\n");

    setSharing(true);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: plan.tripTitle, text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      }
    } catch { /* user cancelled */ }
    finally { setSharing(false); }
  }

  function handleDownload() {
    flushSync(() => setIsPrinting(true));
    window.print();
    setIsPrinting(false);
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
    <div
      className={`relative min-h-screen pt-24 px-4 transition-[padding] duration-500 ${showCTA ? "pb-32 md:pb-20" : "pb-20"}`}
      style={{ background: mood.pageBg, transition: "background 0.6s ease" }}
    >
      {/* Ambient mood glow */}
      <div
        className="absolute top-0 inset-x-0 h-[520px] pointer-events-none z-0"
        style={{ background: mood.pageGlow }}
      />
      <div className="relative z-10 max-w-2xl mx-auto flex flex-col gap-6">

        {/* ── Cinematic Destination Hero ── */}
        <DestinationHero plan={plan} context={context} onReset={onReset} />

        {/* ── Trip Confidence ── */}
        <TripConfidenceBlock
          plan={plan}
          context={context}
          pace={getPace()}
          bestFor={getBestFor()}
        />

        {/* ── Local Reality Layer ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(37,81,204,0.09), 0 1px 4px rgba(37,81,204,0.04)" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-white rounded-3xl border shadow-[0_1px_4px_rgba(37,81,204,0.04)] p-7 transition-colors duration-500"
          style={{ borderColor: mood.cardBorder }}
        >

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-[1.25rem] font-bold text-[#1C2333] leading-tight tracking-tight">Local Reality Layer</h2>
            <p className="text-[13px] text-[#9CA3AF] mt-1.5 leading-snug">What you actually need to know before you go</p>
          </div>

          {/* Insight cards */}
          <div className="flex flex-col gap-2.5">
            {plan.realityCheck.map((item, i) => {
              const { icon, label, bg, border, iconBg, iconColor, labelColor, textColor, text } = classify(item);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.06 * i }}
                  className={`flex gap-3.5 items-start px-4 py-4 rounded-2xl border ${bg} ${border}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
                    <InlineIcon name={icon} size={15} strokeWidth={1.75} />
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className={`text-[11px] font-medium ${labelColor}`}>{label}</span>
                    <p className={`text-[0.9375rem] leading-relaxed mt-0.5 ${textColor}`}>{text}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </motion.div>

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
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(37,81,204,0.09)" }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.00 }}
                className="rounded-[28px] border border-[#C0D8F5] overflow-hidden"
              >
                <div className="bg-gradient-to-br from-[#EEF5FF] to-white px-6 pt-6 pb-5">
                  <div className="flex items-center gap-3 mb-5">
                    <PremiumIcon name={s.icon} size={18} containerSize={40} radius={14} strokeWidth={1.75}
                      bg="rgba(53,94,157,0.08)" border="rgba(53,94,157,0.14)" shadow="0 1px 6px rgba(53,94,157,0.08), inset 0 1px 0 rgba(255,255,255,0.70)" />
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
              </motion.div>

              {/* ── Card 2: Road & Permit Reality ── */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(217,119,6,0.09)" }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.08 }}
                className="rounded-[28px] border border-[#F0CFA0] overflow-hidden"
              >
                <div className="bg-gradient-to-br from-[#FFFBF0] to-white px-6 pt-6 pb-5">
                  <div className="flex items-center gap-3 mb-5">
                    <PremiumIcon name="road" size={18} containerSize={40} radius={14} strokeWidth={1.75}
                      bg="rgba(183,121,31,0.08)" border="rgba(183,121,31,0.14)" shadow="0 1px 6px rgba(183,121,31,0.08), inset 0 1px 0 rgba(255,255,255,0.70)" />
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
              </motion.div>

              {/* ── Card 3: Why This Season Works ── */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(22,163,74,0.09)" }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.16 }}
                className="rounded-[28px] border border-[#A8E0BC] overflow-hidden"
              >
                <div className="bg-gradient-to-br from-[#F0FDF6] to-white px-6 pt-6 pb-5">
                  <div className="flex items-center gap-3 mb-5">
                    <PremiumIcon name="sparkles" size={18} containerSize={40} radius={14} strokeWidth={1.75}
                      bg="rgba(93,139,74,0.08)" border="rgba(93,139,74,0.14)" shadow="0 1px 6px rgba(93,139,74,0.08), inset 0 1px 0 rgba(255,255,255,0.70)" />
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
              </motion.div>

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
                  <InlineIcon name="festival" size={15} strokeWidth={1.75} />
                  <p className="text-sm font-bold text-[#1C2333]">{f.name}</p>
                  <span className="text-xs bg-white border border-[#DDE8F7] text-[#A8B5C8] rounded-full px-2 py-0.5">{f.duration}</span>
                </div>
                <p className="text-xs text-[#6B7280] ml-7 leading-snug">{f.location} · {f.tip}</p>
              </div>
            ))}
          </div>
        )}

        {/* Getting There — Premium Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(37,81,204,0.09), 0 1px 4px rgba(37,81,204,0.04)" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-white rounded-3xl border border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.04)] px-6 py-6 flex flex-col gap-5"
        >
          <h2 className="text-[1.15rem] font-bold text-[#1C2333] tracking-tight">Getting There</h2>

          <div className="flex flex-col">
            {plan.transport.map((leg, i) => {
              const hint   = getTransportContext(leg);
              const isLast = i === plan.transport.length - 1;
              const parts  = leg.leg.split(/\s*[→\-–]\s*|\s+to\s+/i);
              const origin = parts[0]?.trim();
              const dest   = parts[1]?.trim();

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.08 * i }}
                  className="relative flex items-start gap-3"
                >
                  {/* Connector line */}
                  {!isLast && (
                    <motion.div
                      className="absolute left-[19px] top-11 bottom-0 w-px bg-gradient-to-b from-[#DDE8F7] via-[#DDE8F7]/50 to-transparent"
                      style={{ transformOrigin: "top" }}
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.20 + 0.08 * i }}
                    />
                  )}

                  {/* Transport icon badge */}
                  <div
                    className="relative z-10 flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center mt-0.5 overflow-hidden"
                    style={
                      isTaxiMode(leg.mode)
                        ? { background: "#EEF3FB", border: "1px solid rgba(221,232,247,0.80)", boxShadow: "0 1px 4px rgba(37,81,204,0.06)" }
                        : isFlightMode(leg)
                        ? { background: "rgba(53,94,157,0.10)", border: "1px solid rgba(53,94,157,0.20)", boxShadow: "0 1px 6px rgba(53,94,157,0.12)" }
                        : { background: "#EEF3FB", border: "1px solid rgba(221,232,247,0.80)", boxShadow: "0 1px 4px rgba(37,81,204,0.06)" }
                    }
                  >
                    {isTaxiMode(leg.mode) ? (
                      <Image
                        src="/taxi.png"
                        alt="Taxi"
                        width={38}
                        height={38}
                        className="object-contain scale-110"
                      />
                    ) : isFlightMode(leg) ? (
                      <InlineIcon name="plane" size={20} strokeWidth={1.5} color="#355E9D" />
                    ) : (
                      <InlineIcon name={getTransportIconName(leg)} size={18} strokeWidth={1.75} color="#355E9D" />
                    )}
                  </div>

                  {/* Segment card */}
                  <div className={`flex-1 bg-[#F9FBFF] rounded-2xl border border-[#DDE8F7] px-4 py-3.5 ${!isLast ? "mb-3" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        {origin && dest ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[0.9375rem] font-semibold text-[#1C2333]">{origin}</span>
                            <InlineIcon name="arrow-right" size={12} strokeWidth={2} color="#A8B5C8" />
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
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Journey Map ── */}
        {(() => {
          const routeLocations = [
            "Guwahati",
            ...Array.from(new Set(plan.itinerary.map(d => d.location.split(",")[0].trim()))),
          ];
          return (
            <div className="bg-white rounded-3xl border border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.04)] overflow-hidden result-card print-hide">

              {/* Header */}
              <div className="px-6 pt-5 pb-4 border-b border-[#EEF3FB]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[1.15rem] font-bold text-[#1C2333] tracking-tight">Journey Map</h2>
                    <p className="text-[12px] text-[#A8B5C8] mt-0.5 font-medium">
                      Click a pin to open that day · Tap day cards to see location
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-[#2551CC] bg-[#EEF3FB] px-2.5 py-1 rounded-full mt-0.5">
                    {plan.itinerary.length} stops
                  </span>
                </div>

                {/* Route breadcrumb strip */}
                <div className="flex items-center gap-1.5 mt-3.5 overflow-x-auto scrollbar-none pb-0.5">
                  {routeLocations.map((loc, i) => (
                    <div key={`${loc}-${i}`} className="flex items-center gap-1.5 flex-shrink-0">
                      {i > 0 && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-[#C8D9F5] flex-shrink-0">
                          <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <span
                        className={`text-[11px] font-semibold whitespace-nowrap ${
                          i === 0 ? "text-[#1C2333]" : "text-[#6B7280]"
                        }`}
                      >
                        {loc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map */}
              <div className="h-[300px] sm:h-[390px]">
                <JourneyMap
                  itinerary={plan.itinerary}
                  activeDay={openDay}
                  onDaySelect={(day) => {
                    setOpenDay(day);
                    setTimeout(() => {
                      document.getElementById(`day-${day}`)?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }, 800);
                  }}
                />
              </div>
            </div>
          );
        })()}

        {/* Stay */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(37,81,204,0.09), 0 1px 4px rgba(37,81,204,0.04)" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-white rounded-3xl border border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.04)] px-6 py-5 flex flex-col gap-2"
        >
          <h2 className="text-[1.15rem] font-bold text-[#1C2333] tracking-tight">Where You&apos;ll Stay</h2>
          <div className="flex items-center gap-2.5 mt-1">
            <PremiumIcon name="hotel" size={16} containerSize={32} radius={10} strokeWidth={1.75} shadow="none" />
            <span className="text-lg font-bold text-[#1C2333]">{plan.stay.base}</span>
          </div>
          <p className="text-xl font-bold text-[#2551CC] tabular-nums">{plan.stay.priceRange}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {plan.stay.bestFor.map((tag) => (
              <span key={tag} className="text-xs bg-[#F9FBFF] text-[#6B7280] rounded-full px-2.5 py-1 font-medium border border-[#DDE8F7]">{tag}</span>
            ))}
          </div>
        </motion.div>

        {/* Budget Estimate — Premium Spending Summary */}
        {(() => {
          const rows: { label: string; icon: string; val: string; color: string }[] = [
            { label: "Transport",  icon: "transport", val: context?.budget.breakdown.transport ?? plan.budget.transport,  color: "from-[#2551CC] to-[#4A6FDB]" },
            { label: "Stay",       icon: "stay",      val: context?.budget.breakdown.stay      ?? plan.budget.stay,       color: "from-[#059669] to-[#10B981]" },
            { label: "Food",       icon: "food",      val: context?.budget.breakdown.food      ?? plan.budget.food,       color: "from-[#D97706] to-[#F59E0B]" },
            { label: "Activities", icon: "activities",val: context?.budget.breakdown.local     ?? plan.budget.localTravel, color: "from-[#7C3AED] to-[#A78BFA]" },
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
                  <p className="text-[10px] font-bold text-[#A8B5C8]/80 uppercase tracking-[0.14em] mb-5">Your estimated spend</p>
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
                        <div className="flex items-center gap-2.5">
                          <PremiumIcon name={icon} size={14} containerSize={28} radius={8} strokeWidth={1.75} shadow="none" />
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
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true, margin: "-30px" }}
                          transition={{ duration: 0.70, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.10 * i }}
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
              { icon: "morning",   label: "Morning",   items: morning },
              { icon: "afternoon", label: "Afternoon", items: afternoon },
              { icon: "evening",   label: "Evening",   items: evening },
            ].filter(s => s.items.length > 0);

            return (
              <div
                key={day.day}
                id={`day-${day.day}`}
                className={`rounded-2xl border bg-white overflow-hidden transition-[border-color,box-shadow,transform] duration-200 ${
                  isOpen
                    ? "border-[#C8D9F5] shadow-[0_4px_20px_rgba(37,81,204,0.08)]"
                    : "border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.03)] hover:border-[#C8D9F5]/60 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(37,81,204,0.07)]"
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
                              <InlineIcon name={slot.icon} size={15} strokeWidth={1.75} />
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
                            <InlineIcon name="alert" size={14} strokeWidth={1.75} color="#B7791F" className="shrink-0 mt-px" />
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

      {/* ── Desktop: floating top-right action card ── */}
      <AnimatePresence>
        {showCTA && (
          <motion.div
            key="cta-desktop"
            initial={{ opacity: 0, x: 20, scale: 0.96 }}
            animate={{ opacity: 1, x: 0,  scale: 1    }}
            exit={{    opacity: 0, x: 16, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="print-hide hidden md:flex fixed top-[5.5rem] right-5 z-50 flex-col w-[188px] rounded-[20px] overflow-hidden bg-white/92 backdrop-blur-[24px] border border-[#E8EDF5] shadow-[0_8px_40px_rgba(14,22,64,0.11),0_2px_8px_rgba(14,22,64,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]"
          >
            {/* Trip identity chip */}
            <div className="px-4 py-3.5 bg-gradient-to-b from-[#F4F7FD] to-transparent border-b border-[#EEF3FB]">
              <p className="text-[11px] font-bold text-[#1C2333] leading-snug line-clamp-2">{plan.tripTitle}</p>
              <p className="text-[10px] text-[#A8B5C8] font-medium mt-0.5 tabular-nums">
                {context?.days}d · {scoreDisplay} match
              </p>
            </div>

            {/* Action rows */}
            <div className="flex flex-col divide-y divide-[#F0F4FB]">

              {/* Share */}
              <button
                type="button"
                onClick={handleShare}
                disabled={sharing}
                className="flex items-center gap-3 px-4 py-[11px] hover:bg-[#F8FAFF] active:bg-[#EEF3FB] transition-colors duration-120 text-left"
              >
                <motion.div
                  animate={copied ? { scale: [1, 1.25, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${copied ? "bg-emerald-100" : "bg-[#EEF3FB]"}`}
                >
                  {sharing ? <span className="text-[#A8B5C8] text-xs">···</span>
                    : copied ? <InlineIcon name="check2" size={13} strokeWidth={2.5} color="#059669" />
                    : <InlineIcon name="share" size={13} strokeWidth={1.75} color="#355E9D" />}
                </motion.div>
                <span className={`text-[12px] font-semibold transition-colors ${copied ? "text-emerald-600" : "text-[#1C2333]"}`}>
                  {copied ? "Copied!" : sharing ? "Sharing…" : "Share"}
                </span>
              </button>

              {/* Save Trip */}
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-3 px-4 py-[11px] hover:bg-[#F8FAFF] active:bg-[#EEF3FB] transition-colors duration-120 text-left"
              >
                <motion.div
                  animate={saved ? { scale: [1, 1.25, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${saved ? "bg-emerald-100" : "bg-[#EEF3FB]"}`}
                >
                  {saved
                    ? <InlineIcon name="check2" size={13} strokeWidth={2.5} color="#059669" />
                    : <InlineIcon name="save" size={13} strokeWidth={1.75} color="#355E9D" />}
                </motion.div>
                <span className={`text-[12px] font-semibold transition-colors ${saved ? "text-emerald-600" : "text-[#1C2333]"}`}>
                  {saved ? "Saved!" : "Save Trip"}
                </span>
              </button>

              {/* Download PDF */}
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-3 px-4 py-[11px] hover:bg-[#F8FAFF] active:bg-[#EEF3FB] transition-colors duration-120 text-left"
              >
                <div className="w-7 h-7 rounded-full bg-[#EEF3FB] flex items-center justify-center shrink-0">
                  {isPrinting
                    ? <span className="text-[#A8B5C8] text-xs">···</span>
                    : <InlineIcon name="download" size={13} strokeWidth={1.75} color="#355E9D" />}
                </div>
                <span className="text-[12px] font-semibold text-[#1C2333]">
                  {isPrinting ? "Saving…" : "Download PDF"}
                </span>
              </button>
            </div>

            {/* Plan Again — subdued footer link */}
            <div className="px-4 py-2.5 border-t border-[#EEF3FB]">
              <button
                type="button"
                onClick={onReset}
                className="text-[10px] text-[#A8B5C8] hover:text-[#6B7280] transition-colors font-medium"
              >
                <span className="inline-flex items-center gap-1"><InlineIcon name="arrow-left" size={10} strokeWidth={2} color="#A8B5C8" />Plan Another Trip</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile: bottom sticky action bar ── */}
      <AnimatePresence>
        {showCTA && (
          <motion.div
            key="cta-mobile"
            initial={{ opacity: 0, y: 56 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: 56 }}
            transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="print-hide flex md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/93 backdrop-blur-[24px] border-t border-[#E8EDF5]/70 shadow-[0_-6px_32px_rgba(14,22,64,0.10),inset_0_1px_0_rgba(255,255,255,0.92)]"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}
          >
            {/* Three equal action columns */}
            <div className="flex w-full divide-x divide-[#EEF3FB]">

              {/* Share */}
              <button
                type="button"
                onClick={handleShare}
                disabled={sharing}
                className="flex-1 flex flex-col items-center gap-1.5 pt-3.5 pb-1 hover:bg-[#F8FAFF] active:bg-[#EEF3FB] transition-colors"
              >
                <motion.div
                  animate={copied ? { scale: [1, 1.22, 1] } : {}}
                  transition={{ duration: 0.28 }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${copied ? "bg-emerald-100" : "bg-[#EEF3FB]"}`}
                >
                  {sharing ? <span className="text-[#A8B5C8] text-xs">···</span>
                    : copied ? <InlineIcon name="check2" size={15} strokeWidth={2.5} color="#059669" />
                    : <InlineIcon name="share" size={15} strokeWidth={1.75} color="#355E9D" />}
                </motion.div>
                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] transition-colors ${copied ? "text-emerald-600" : "text-[#6B7280]"}`}>
                  {copied ? "Copied" : "Share"}
                </span>
              </button>

              {/* Save Trip */}
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 flex flex-col items-center gap-1.5 pt-3.5 pb-1 hover:bg-[#F8FAFF] active:bg-[#EEF3FB] transition-colors"
              >
                <motion.div
                  animate={saved ? { scale: [1, 1.22, 1] } : {}}
                  transition={{ duration: 0.28 }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${saved ? "bg-emerald-100" : "bg-[#EEF3FB]"}`}
                >
                  {saved
                    ? <InlineIcon name="check2" size={15} strokeWidth={2.5} color="#059669" />
                    : <InlineIcon name="save" size={15} strokeWidth={1.75} color="#355E9D" />}
                </motion.div>
                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] transition-colors ${saved ? "text-emerald-600" : "text-[#6B7280]"}`}>
                  {saved ? "Saved" : "Save"}
                </span>
              </button>

              {/* Download PDF */}
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 flex flex-col items-center gap-1.5 pt-3.5 pb-1 hover:bg-[#F8FAFF] active:bg-[#EEF3FB] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[#EEF3FB] flex items-center justify-center">
                  {isPrinting
                    ? <span className="text-[#A8B5C8] text-xs">···</span>
                    : <InlineIcon name="download" size={15} strokeWidth={1.75} color="#355E9D" />}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                  {isPrinting ? "Saving" : "PDF"}
                </span>
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
  const mood = MOOD_THEMES[form.destination] ?? MOOD_THEMES["Meghalaya"]!;

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

      {/* ── Cinematic Hero ── */}
      <section className="relative overflow-hidden min-h-[100vh] flex flex-col">

        {/* ── Atmospheric background layers ── */}

        {/* Base: deep Meghalaya forest night */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(175deg, #020E05 0%, #030F08 28%, #041512 58%, #020C07 100%)" }}
        />

        {/* Primary forest atmosphere — large deep-green orb */}
        <div
          className="absolute top-[-14%] left-[4%] w-[960px] h-[760px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(14,72,32,0.70) 0%, transparent 58%)", filter: "blur(100px)" }}
        />

        {/* Teal monsoon cloud mass — upper right */}
        <div
          className="absolute top-[0%] right-[-10%] w-[680px] h-[560px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(8,58,62,0.54) 0%, transparent 62%)", filter: "blur(88px)" }}
        />

        {/* Deep blue rainstorm atmosphere — left */}
        <div
          className="absolute top-[18%] left-[-14%] w-[540px] h-[440px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(10,42,80,0.46) 0%, transparent 65%)", filter: "blur(92px)" }}
        />

        {/* Valley mist band — mid vertical */}
        <div
          className="absolute top-[44%] inset-x-0 h-[300px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse 78% 100% at 50% 50%, rgba(28,88,48,0.22) 0%, transparent 100%)", filter: "blur(48px)" }}
        />

        {/* Animated slow-drifting mist — layer 1 */}
        <motion.div
          className="absolute bottom-[20%] inset-x-0 h-[220px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse 82% 100% at 32% 78%, rgba(16,70,36,0.28) 0%, transparent 72%)" }}
          animate={{ x: [0, 32, 0], opacity: [0.22, 0.32, 0.22] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Animated slow-drifting mist — layer 2 counter-drift */}
        <motion.div
          className="absolute bottom-[28%] inset-x-0 h-[190px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse 68% 100% at 62% 68%, rgba(10,54,46,0.22) 0%, transparent 72%)" }}
          animate={{ x: [0, -24, 0], opacity: [0.16, 0.26, 0.16] }}
          transition={{ duration: 23, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        />

        {/* Soft cloud pulse — upper center */}
        <motion.div
          className="absolute top-[6%] inset-x-0 h-[170px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse 58% 100% at 50% 0%, rgba(16,50,68,0.16) 0%, transparent 100%)" }}
          animate={{ opacity: [0.10, 0.20, 0.10] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* SVG Terrain — multi-layer misty hills, waterfall streaks, winding road */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1400 320"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Far distant mountain ridgeline */}
          <path
            d="M0,172 L52,132 L108,155 L168,117 L232,140 L308,106 L386,126 L464,100 L544,120 L624,96 L704,113 L784,104 L864,115 L944,107 L1024,117 L1104,106 L1184,114 L1260,104 L1352,109 L1400,106 L1400,320 L0,320 Z"
            fill="rgba(12,44,22,0.54)"
          />
          {/* Mid rolling hills */}
          <path
            d="M0,202 Q116,170 236,186 Q356,156 476,175 Q596,161 716,179 Q836,166 956,181 Q1076,169 1196,179 Q1300,175 1400,181 L1400,320 L0,320 Z"
            fill="rgba(8,30,14,0.74)"
          />
          {/* Near foreground hills */}
          <path
            d="M0,246 Q145,208 292,228 Q448,202 598,222 Q745,209 895,227 Q1048,214 1198,229 Q1302,223 1400,231 L1400,320 L0,320 Z"
            fill="rgba(5,20,9,0.89)"
          />
          {/* Waterfall streak A */}
          <path
            d="M392,96 Q394,148 393,186 Q392,212 390,248"
            stroke="rgba(160,215,235,0.11)" strokeWidth="2.5" fill="none" strokeLinecap="round"
          />
          {/* Waterfall streak B — parallel, faint */}
          <path
            d="M398,102 Q400,154 399,192 Q398,218 396,252"
            stroke="rgba(160,215,235,0.07)" strokeWidth="1.5" fill="none" strokeLinecap="round"
          />
          {/* Winding mountain road — barely visible */}
          <path
            d="M-50,312 Q180,298 338,306 Q498,308 618,299 Q738,290 876,300 Q1018,305 1158,296 Q1278,292 1452,300"
            stroke="rgba(255,255,255,0.046)" strokeWidth="2.5" fill="none" strokeLinecap="round"
          />
          {/* Valley floor */}
          <path
            d="M0,287 Q350,273 700,279 Q1050,274 1400,281 L1400,320 L0,320 Z"
            fill="rgba(3,11,5,0.97)"
          />
        </svg>

        {/* Film grain overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.028]"
          style={{ mixBlendMode: "overlay" }}
          aria-hidden="true"
        >
          <filter id="hero-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#hero-noise)" />
        </svg>

        {/* Gradient overlay — text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.08) 22%, rgba(0,0,0,0.36) 58%, rgba(0,0,0,0.75) 84%, rgba(0,0,0,0.92) 100%)" }}
        />

        {/* Edge vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.30) 100%)" }}
        />

        {/* ── Hero content ── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-5 sm:px-8 pt-28 pb-24 md:pt-36 md:pb-28">

          {/* Top badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-10 sm:mb-14"
          >
            <div className="inline-flex items-center gap-2.5 bg-white/7 border border-white/12 text-white/52 text-[10px] font-semibold px-5 py-2.5 rounded-full tracking-[0.22em] uppercase backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6DFFB0] shrink-0" />
              RHINOTREK · NORTHEAST INDIA
            </div>
          </motion.div>

          {/* Editorial headline */}
          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.88, delay: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-[2.75rem] sm:text-[4.25rem] md:text-[5.75rem] font-bold text-white leading-[1.02] tracking-[-0.025em] max-w-5xl mb-7"
          >
            Plan Northeast India<br />
            <span className="bg-gradient-to-r from-[#7CCC52] via-[#A8E060] to-[#5DB842] bg-clip-text text-transparent">
              Like Someone Local
            </span>
          </motion.h1>

          {/* Supporting copy */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.78, delay: 0.34, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-[1rem] sm:text-[1.1rem] text-white/46 max-w-xl leading-relaxed font-light mb-12 sm:mb-14"
          >
            Reality-checked trips with routes, weather, permits,<br className="hidden sm:block" /> budgets and local intelligence.
          </motion.p>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.68, delay: 0.50, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex items-center justify-center gap-5 sm:gap-8 flex-wrap"
          >
            {(["Route Verified", "Weather Aware", "Budget Matched", "Local Intelligence"] as const).map((t) => (
              <span key={t} className="flex items-center gap-2 text-white/48 text-[11px] sm:text-xs font-medium">
                <InlineIcon name="check2" size={10} strokeWidth={2.5} color="#6DFFB0" />
                {t}
              </span>
            ))}
          </motion.div>

        </div>

      </section>

      {/* ── Floating Planner Card ── */}
      <div id="planner" className="relative z-10 max-w-3xl mx-auto px-4 -mt-20 sm:-mt-28 md:-mt-36 scroll-mt-20 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.78, delay: 0.72, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
        <form
          onSubmit={onSubmit}
          noValidate
          className="rounded-[32px] border border-white/38 p-8 md:p-10"
          style={{
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(36px)",
            WebkitBackdropFilter: "blur(36px)",
            boxShadow: `${mood.formGlow}, inset 0 1px 0 rgba(255,255,255,0.92)`,
            transition: "box-shadow 0.6s ease",
          } as React.CSSProperties}
        >
          <p className="text-[10px] font-bold text-[#6B7280]/52 uppercase tracking-[0.16em] mb-9">Plan your trip</p>

          {/* Row 1: From + Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-9 mb-9">

            <div className="flex flex-col gap-2.5">
              <label className="text-[10px] font-bold text-[#6B7280]/56 uppercase tracking-[0.14em]">From</label>
              <input
                type="text"
                placeholder="Your city — Delhi, Bangalore, Kolkata..."
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                className="rounded-2xl border border-[#DDE8F7] bg-white/70 px-5 py-4 text-sm text-[#1C2333] placeholder-[#A8B5C8] outline-none focus:border-[#2551CC] focus:ring-2 focus:ring-[#2551CC]/10 transition"
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-baseline gap-3">
                <label className="text-[10px] font-bold text-[#6B7280]/56 uppercase tracking-[0.14em]">Destination</label>
                <motion.span
                  key={mood.moodLabel}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-[9px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: mood.accentColor }}
                >
                  {mood.moodLabel}
                </motion.span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1 pt-3">
                {DESTINATIONS.map((d) => (
                  <div key={d.name} className="relative flex-shrink-0">
                    <Pill selected={form.destination === d.name} onClick={() => setForm({ ...form, destination: d.name })} disabled={!d.active} accentColor={mood.accentColor}>
                      <span className="inline-flex items-center gap-1.5">
                        <InlineIcon name={d.icon} size={12} strokeWidth={1.75} color={form.destination === d.name ? "white" : mood.accentColor} />
                        {d.short}
                      </span>
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
              <label className="text-[10px] font-bold text-[#6B7280]/56 uppercase tracking-[0.14em]">Travel Dates</label>
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
              <SeasonSnippet
                destination={form.destination}
                startDate={form.startDate}
                moodBorder={mood.cardBorder}
                moodBg={`${mood.accentLight}99`}
              />
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
            <label className="text-[10px] font-bold text-[#6B7280]/56 uppercase tracking-[0.14em]">Travel Mood</label>
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
        </motion.div>
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
        <p className="text-sm text-[#A8B5C8] mb-8">By Rhinotrek — Northeast India, planned properly.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              name: "Meghalaya",
              tagline: "Living root bridges. Monsoon clouds. Clean air.",
              places: "Shillong · Cherrapunji · Dawki",
              from: "from-[#0C1730]", via: "via-[#112045]", to: "to-[#0D1A38]",
              badge: "Available Now", badgeBg: "bg-[#2551CC]",
              icon: "tree-pine" as const, iconColor: "#5D8B4A",
            },
            {
              name: "Arunachal Pradesh",
              tagline: "Tawang monastery. Sunrise at Sela Pass.",
              places: "Tawang · Ziro · Bomdila",
              from: "from-[#2A1A0D]", via: "via-[#4A2C14]", to: "to-[#3A2010]",
              badge: "Coming Soon", badgeBg: "bg-[#6B4020]/70",
              icon: "mountain" as const, iconColor: "#B7791F",
            },
            {
              name: "Sikkim",
              tagline: "Himalayan views. Tsomgo Lake. Quiet mountain towns.",
              places: "Gangtok · Lachung · Pelling",
              from: "from-[#182030]", via: "via-[#223348]", to: "to-[#1A2A3C]",
              badge: "Coming Soon", badgeBg: "bg-[#3A5070]/70",
              icon: "snowflake" as const, iconColor: "#355E9D",
            },
          ].map((dest) => (
            <div
              key={dest.name}
              className={`bg-gradient-to-br ${dest.from} ${dest.via} ${dest.to} rounded-3xl p-8 flex flex-col gap-5 min-h-[280px] relative overflow-hidden`}
            >
              <div className="absolute bottom-3 right-5 opacity-[0.08] pointer-events-none select-none">
                <InlineIcon name={dest.icon} size={110} strokeWidth={0.8} color={dest.iconColor} />
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
      origin:             form.origin,
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
