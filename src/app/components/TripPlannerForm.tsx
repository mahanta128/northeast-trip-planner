"use client";

import { useState, useEffect } from "react";
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

/* ─── Results ─────────────────────────────────────────────── */

function TripResults({ plan, context, onReset }: { plan: TripPlan; context: TripContext | null; onReset: () => void }) {
  const scoreNum   = parseInt(plan.tripFit.score);
  const scoreColor = scoreNum >= 8 ? "text-[#2551CC]" : scoreNum >= 6 ? "text-amber-500" : "text-red-500";
  const scoreBg    = scoreNum >= 8 ? "bg-[#EEF3FB] border-[#DDE8F7]" : scoreNum >= 6 ? "bg-[#FAF5EB] border-[#E8D9B0]" : "bg-red-50 border-red-100";

  return (
    <div className="min-h-screen bg-[#EEF3FB] pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">

        {/* Header */}
        <div className="bg-white rounded-3xl border border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.04)] px-7 py-6 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-[#1C2333] leading-snug">{plan.tripTitle}</h2>
              {context && (
                <p className="text-xs text-[#A8B5C8]">
                  {context.startDateFormatted} → {context.endDateFormatted} · {context.travelers} traveler{context.travelers !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <button
              onClick={onReset}
              className="shrink-0 text-xs text-[#2551CC] border border-[#DDE8F7] rounded-full px-4 py-2 hover:bg-[#EEF3FB] transition font-medium"
            >
              ← Plan Again
            </button>
          </div>
          <p className="text-sm text-[#6B7280] leading-relaxed mt-1">{plan.summary}</p>
        </div>

        {/* Season Snapshot */}
        {context?.season && (
          <div className="bg-white rounded-3xl border border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.04)] px-7 py-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-[#A8B5C8] uppercase tracking-[0.14em]">Season Snapshot</p>
              <span className="text-xs font-semibold text-[#2551CC] bg-[#EEF3FB] border border-[#DDE8F7] px-3 py-1 rounded-full">
                {context.season.emoji} {context.season.name} · {context.season.months}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-[#F9FBFF]">
                <span className="text-sm mt-0.5">🌡</span>
                <div>
                  <p className="text-[10px] font-bold text-[#A8B5C8] uppercase tracking-wider mb-1">Weather</p>
                  <p className="text-xs text-[#6B7280] leading-snug">{context.season.weather}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-[#F9FBFF]">
                <span className="text-sm mt-0.5">🛣</span>
                <div>
                  <p className="text-[10px] font-bold text-[#A8B5C8] uppercase tracking-wider mb-1">Roads & Pacing</p>
                  <p className="text-xs text-[#6B7280] leading-snug">{context.season.roads}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {context.season.highlights.map((h) => (
                <span key={h} className="text-xs bg-[#EEF3FB] text-[#2551CC] border border-[#DDE8F7] rounded-full px-2.5 py-1">{h}</span>
              ))}
              {context.season.caveats.map((c) => (
                <span key={c} className="text-xs bg-[#FAF5EB] text-[#8B4A1A] border border-[#E8D9B0] rounded-full px-2.5 py-1">⚠ {c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Permit Alert */}
        {context?.permit?.required && (
          <div className="rounded-3xl border border-[#E8C8A0] bg-[#FAF5EB] px-7 py-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <p className="text-sm font-bold text-[#7B4A1A]">{context.permit.name} Required</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              <div>
                <p className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-wider mb-1">Apply At</p>
                <p className="text-xs text-[#7B4A1A] leading-snug">{context.permit.applyAt}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-wider mb-1">Cost · Validity</p>
                <p className="text-xs text-[#7B4A1A] leading-snug">{context.permit.cost} · {context.permit.validity}</p>
              </div>
            </div>
            <p className="text-xs text-[#7B4A1A] bg-white/60 rounded-xl px-3 py-2.5 border border-[#E8D9B0] leading-snug">
              💡 {context.permit.tip}
            </p>
          </div>
        )}

        {/* Festival Alert */}
        {context && context.festivals.length > 0 && (
          <div className="rounded-3xl border border-[#DDE8F7] bg-[#EEF3FB] px-7 py-5 flex flex-col gap-3">
            <p className="text-[10px] font-bold text-[#A8B5C8] uppercase tracking-[0.14em]">Festival Overlap</p>
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

        {/* Trip Fit Score */}
        <div className={`rounded-3xl border ${scoreBg} px-7 py-5 flex flex-col gap-3`}>
          <p className="text-[10px] font-bold text-[#A8B5C8] uppercase tracking-[0.14em]">Trip Fit Score</p>
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-bold leading-none ${scoreColor}`}>{plan.tripFit.score}</span>
            <span className="text-sm font-semibold text-[#1C2333]">{plan.tripFit.summary}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {plan.tripFit.reasons.map((r, i) => {
              const warn = r.startsWith("⚠");
              return (
                <span key={i} className={`text-xs px-3 py-1.5 rounded-full font-medium ${warn ? "bg-[#FAF5EB] text-[#8B4A1A]" : "bg-[#EEF3FB] text-[#2551CC]"}`}>
                  {r}
                </span>
              );
            })}
          </div>
        </div>

        {/* Transport */}
        <div className="bg-white rounded-3xl border border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.04)] px-7 py-5 flex flex-col gap-3">
          <p className="text-[10px] font-bold text-[#A8B5C8] uppercase tracking-[0.14em]">Getting There</p>
          <div className="flex flex-col gap-2">
            {plan.transport.map((leg, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 px-4 rounded-2xl bg-[#F9FBFF] flex-wrap">
                <span className="text-lg">{leg.mode}</span>
                <span className="text-sm font-semibold text-[#1C2333]">{leg.leg}</span>
                {leg.duration && (
                  <span className="text-xs text-[#A8B5C8] bg-white border border-[#DDE8F7] rounded-full px-2.5 py-1">{leg.duration}</span>
                )}
                <span className="ml-auto text-sm font-semibold text-[#2551CC]">{leg.cost}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stay + Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl border border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.04)] px-6 py-5 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-[#A8B5C8] uppercase tracking-[0.14em]">Stay</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">🏨</span>
              <span className="text-base font-bold text-[#1C2333]">{plan.stay.base}</span>
            </div>
            <p className="text-sm font-semibold text-[#2551CC]">{plan.stay.priceRange}</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {plan.stay.bestFor.map((tag) => (
                <span key={tag} className="text-xs bg-[#F9FBFF] text-[#6B7280] rounded-full px-2.5 py-1 font-medium border border-[#DDE8F7]">{tag}</span>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.04)] px-6 py-5 flex flex-col gap-3">
            <p className="text-[10px] font-bold text-[#A8B5C8] uppercase tracking-[0.14em]">Budget Estimate</p>
            {context && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-[#2551CC] tabular-nums">{context.budget.formatted}</span>
                <span className="text-xs text-[#A8B5C8]">per person</span>
              </div>
            )}
            <div className="flex flex-col gap-2 mt-1">
              {([
                ["Transport", context?.budget.breakdown.transport ?? plan.budget.transport],
                ["Stay",      context?.budget.breakdown.stay      ?? plan.budget.stay],
                ["Food",      context?.budget.breakdown.food      ?? plan.budget.food],
                ["Local",     context?.budget.breakdown.local     ?? plan.budget.localTravel],
              ] as [string, string][]).map(([label, val]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-[#A8B5C8]">{label}</span>
                  <span className="text-xs font-semibold text-[#1C2333] tabular-nums">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Itinerary */}
        <div className="bg-white rounded-3xl border border-[#DDE8F7] shadow-[0_1px_4px_rgba(37,81,204,0.04)] px-7 py-6 flex flex-col gap-5">
          <p className="text-[10px] font-bold text-[#A8B5C8] uppercase tracking-[0.14em]">Itinerary</p>
          {plan.itinerary.map((day, i) => (
            <div key={day.day} className="flex gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#EEF3FB] flex items-center justify-center text-[#2551CC] text-xs font-bold">{day.day}</div>
                {i < plan.itinerary.length - 1 && <div className="w-px flex-1 bg-[#DDE8F7] mt-1" />}
              </div>
              <div className="flex flex-col gap-1.5 pb-5">
                <p className="text-sm font-bold text-[#1C2333]">Day {day.day} — {day.location}</p>
                <ul className="flex flex-col gap-1">
                  {day.highlights.map((h, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-[#6B7280]">
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#DDE8F7] shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Reality Check */}
        <div className="bg-[#EEF3FB] rounded-3xl border border-[#DDE8F7] px-7 py-6 flex flex-col gap-3">
          <p className="text-[10px] font-bold text-[#2551CC]/60 uppercase tracking-[0.14em]">Reality Check</p>
          <ul className="flex flex-col gap-2.5">
            {plan.realityCheck.map((item, i) => {
              const warn = item.startsWith("⚠");
              return (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className={`shrink-0 font-bold mt-px ${warn ? "text-[#A2272B]" : "text-[#2551CC]"}`}>{warn ? "⚠" : "✓"}</span>
                  <span className="text-[#6B7280] leading-snug">{item.replace(/^[✓⚠]\s*/, "")}</span>
                </li>
              );
            })}
          </ul>
        </div>

      </div>
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
              <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
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
            className="mt-10 w-full rounded-2xl bg-gradient-to-r from-[#2551CC] to-[#1C306E] text-white py-4 text-base font-semibold hover:shadow-[0_8px_28px_rgba(37,81,204,0.30)] hover:opacity-95 active:scale-[0.99] transition-all tracking-wide"
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
