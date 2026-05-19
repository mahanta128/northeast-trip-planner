"use client";

import { useState, useEffect } from "react";
import * as RadixSlider from "@radix-ui/react-slider";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Constants ───────────────────────────────────────────── */

const DESTINATIONS = [
  { name: "Meghalaya",          short: "Meghalaya",   emoji: "🌿", active: true  },
  { name: "Arunachal Pradesh",  short: "Arunachal",   emoji: "🏔", active: false },
  { name: "Sikkim",             short: "Sikkim",       emoji: "❄️", active: false },
];

const DAY_OPTIONS = ["3", "5", "7"];
const VIBES       = ["Relaxed", "Adventure", "Photography", "Cafes", "Nature"];
const STEPS       = ["Finding best travel route", "Matching budget", "Building itinerary"];

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
  days: string;
  budget: string;
  vibes: string[];
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
  origin: "", destination: "Meghalaya", days: "5", budget: "Comfortable", vibes: [],
};

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
          ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
          : selected
          ? "border-[#1B4332] bg-[#1B4332] text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-600 hover:border-emerald-400 hover:text-emerald-700 cursor-pointer"
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Budget Slider ───────────────────────────────────────── */

function BudgetSlider({ value, onChange }: { value: number; onChange: (i: number) => void }) {
  const tier = BUDGET_LEVELS[value];

  return (
    <div className="flex flex-col gap-6">

      {/* Radix slider */}
      <div className="px-1">
        <RadixSlider.Root
          className="relative flex items-center select-none touch-none w-full h-10"
          min={0}
          max={2}
          step={1}
          value={[value]}
          onValueChange={([v]) => onChange(v)}
        >
          {/* Track */}
          <RadixSlider.Track className="relative grow rounded-full h-[6px] bg-gray-100">
            <RadixSlider.Range className="absolute rounded-full h-full bg-[#1B4332] transition-all duration-200" />
          </RadixSlider.Track>

          {/* Thumb */}
          <RadixSlider.Thumb
            className={[
              "block w-7 h-7 rounded-full bg-white",
              "border-[2.5px] border-[#1B4332]",
              "shadow-[0_2px_10px_rgba(0,0,0,0.18)]",
              "hover:shadow-[0_4px_16px_rgba(27,67,50,0.28)] hover:scale-110",
              "active:scale-125 active:shadow-[0_6px_24px_rgba(27,67,50,0.35)] active:cursor-grabbing",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2",
              "cursor-grab transition-all duration-150 ease-out",
            ].join(" ")}
            aria-label="Trip budget"
          />
        </RadixSlider.Root>

        {/* Snap labels */}
        <div className="flex justify-between mt-1 px-0.5">
          {BUDGET_LEVELS.map((l, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={`text-[11px] font-semibold leading-tight transition-colors duration-200 focus:outline-none ${
                value === i ? "text-[#1B4332]" : "text-gray-300 hover:text-gray-500"
              }`}
              style={{ textAlign: i === 0 ? "left" : i === 2 ? "right" : "center", width: "33%" }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Animated tier info card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tier.key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-4 flex items-center justify-between gap-4"
        >
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-bold text-[#1B4332]">{tier.label}</p>
            <p className="text-xs text-gray-500 leading-snug">{tier.budgetStyle}</p>
          </div>
          <motion.span
            key={tier.budgetRange}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="text-xl font-bold text-[#1B4332] shrink-0 tabular-nums"
          >
            {tier.budgetRange}
          </motion.span>
        </motion.div>
      </AnimatePresence>

    </div>
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
    <div className="min-h-screen bg-[#F7F4F0] flex flex-col items-center justify-center gap-8 pt-16 px-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-emerald-600 animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-xl">🧭</span>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-gray-800">Planning your Meghalaya trip</p>
        <p className="text-sm text-gray-400 mt-1">This takes a few seconds</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {STEPS.map((step, i) => {
          const done   = completedSteps.includes(i);
          const active = activeStep === i && !done;
          return (
            <div
              key={step}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-500 ${
                done   ? "border-emerald-200 bg-emerald-50"
                : active ? "border-emerald-300 bg-white shadow-sm"
                : "border-gray-100 bg-white opacity-40"
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center shrink-0">
                {done ? (
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="8" fill="#d1fae5" />
                    <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : active ? (
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-gray-200" />
                )}
              </span>
              <span className={`text-sm font-medium ${done ? "text-emerald-700" : active ? "text-gray-800" : "text-gray-400"}`}>
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

function TripResults({ plan, onReset }: { plan: TripPlan; onReset: () => void }) {
  const scoreNum   = parseInt(plan.tripFit.score);
  const scoreColor = scoreNum >= 8 ? "text-emerald-600" : scoreNum >= 6 ? "text-amber-500" : "text-red-500";
  const scoreBg    = scoreNum >= 8 ? "bg-emerald-50 border-emerald-100" : scoreNum >= 6 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100";

  return (
    <div className="min-h-screen bg-[#F7F4F0] pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">

        {/* Header */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-7 py-6 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900 leading-snug">{plan.tripTitle}</h2>
            <button
              onClick={onReset}
              className="shrink-0 text-xs text-emerald-700 border border-emerald-200 rounded-full px-4 py-2 hover:bg-emerald-50 transition font-medium"
            >
              ← Plan Again
            </button>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">{plan.summary}</p>
        </div>

        {/* Trip Fit Score */}
        <div className={`rounded-3xl border ${scoreBg} px-7 py-5 flex flex-col gap-3`}>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Trip Fit Score</p>
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-bold leading-none ${scoreColor}`}>{plan.tripFit.score}</span>
            <span className="text-sm font-semibold text-gray-700">{plan.tripFit.summary}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {plan.tripFit.reasons.map((r, i) => {
              const warn = r.startsWith("⚠");
              return (
                <span key={i} className={`text-xs px-3 py-1.5 rounded-full font-medium ${warn ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {r}
                </span>
              );
            })}
          </div>
        </div>

        {/* Transport */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-7 py-5 flex flex-col gap-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Getting There</p>
          <div className="flex flex-col gap-2">
            {plan.transport.map((leg, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 px-4 rounded-2xl bg-gray-50 flex-wrap">
                <span className="text-lg">{leg.mode}</span>
                <span className="text-sm font-semibold text-gray-800">{leg.leg}</span>
                {leg.duration && (
                  <span className="text-xs text-gray-400 bg-white border border-gray-100 rounded-full px-2.5 py-1">{leg.duration}</span>
                )}
                <span className="ml-auto text-sm font-semibold text-emerald-600">{leg.cost}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stay + Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-6 py-5 flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Stay</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">🏨</span>
              <span className="text-base font-bold text-gray-900">{plan.stay.base}</span>
            </div>
            <p className="text-sm font-semibold text-emerald-600">{plan.stay.priceRange}</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {plan.stay.bestFor.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 font-medium">{tag}</span>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-6 py-5 flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Budget Breakdown</p>
            <div className="flex flex-col gap-2.5 mt-1">
              {([["Transport", plan.budget.transport], ["Stay", plan.budget.stay], ["Food", plan.budget.food], ["Local travel", plan.budget.localTravel]] as [string, string][]).map(([label, val]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Itinerary */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-7 py-6 flex flex-col gap-5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Itinerary</p>
          {plan.itinerary.map((day, i) => (
            <div key={day.day} className="flex gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">{day.day}</div>
                {i < plan.itinerary.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
              </div>
              <div className="flex flex-col gap-1.5 pb-5">
                <p className="text-sm font-bold text-gray-900">Day {day.day} — {day.location}</p>
                <ul className="flex flex-col gap-1">
                  {day.highlights.map((h, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Reality Check */}
        <div className="bg-amber-50 rounded-3xl border border-amber-100 px-7 py-6 flex flex-col gap-3">
          <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest">Reality Check</p>
          <ul className="flex flex-col gap-2.5">
            {plan.realityCheck.map((item, i) => {
              const warn = item.startsWith("⚠");
              return (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className={`shrink-0 font-bold mt-px ${warn ? "text-amber-500" : "text-emerald-500"}`}>{warn ? "⚠" : "✓"}</span>
                  <span className="text-gray-700 leading-snug">{item.replace(/^[✓⚠]\s*/, "")}</span>
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
  function toggleVibe(v: string) {
    setForm((prev) => ({
      ...prev,
      vibes: prev.vibes.includes(v) ? prev.vibes.filter((x) => x !== v) : [...prev.vibes, v],
    }));
  }

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0D2B1E] via-[#1B4332] to-[#0A1F15] pt-16 pb-56 md:pb-64 flex flex-col justify-center min-h-[75vh]">
        {/* Glow blobs */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-0 w-80 h-80 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-emerald-300 text-xs font-semibold px-4 py-2 rounded-full mb-8 border border-white/10 backdrop-blur-sm">
            🌿 Built for real Northeast travellers
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-6">
            Plan Northeast India<br />
            <span className="text-emerald-400">Without Opening 20 Tabs</span>
          </h1>

          <p className="text-base md:text-lg text-white/55 max-w-xl mx-auto leading-relaxed">
            Realistic routes, stays, budgets and local travel intelligence for Meghalaya, Arunachal and Sikkim.
          </p>

          <p className="mt-4 text-xs text-white/30 font-medium tracking-wide uppercase">
            Built for travellers planning real Northeast trips
          </p>
        </div>
      </section>

      {/* ── Floating Planner Card ── */}
      <div id="planner" className="relative z-10 max-w-4xl mx-auto px-4 -mt-44 md:-mt-52 scroll-mt-20">
        <form
          onSubmit={onSubmit}
          noValidate
          className="bg-white rounded-3xl shadow-2xl shadow-black/10 border border-gray-100 p-7 md:p-10"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-7">Plan your trip</p>

          {/* Row 1: From + Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7 mb-7">

            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">From</label>
              <input
                type="text"
                placeholder="Your city — Delhi, Bangalore, Kolkata..."
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Destination</label>
              <div className="flex flex-wrap gap-2">
                {DESTINATIONS.map((d) => (
                  <div key={d.name} className="relative">
                    <Pill selected={form.destination === d.name} onClick={() => setForm({ ...form, destination: d.name })} disabled={!d.active}>
                      {d.emoji} {d.short}
                    </Pill>
                    {!d.active && (
                      <span className="absolute -top-2 -right-1.5 text-[9px] font-bold bg-gray-200 text-gray-400 px-1.5 py-0.5 rounded-full leading-none">Soon</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Row 2: Trip Length */}
          <div className="flex flex-col gap-2.5 mb-7">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Trip Length</label>
            <div className="flex gap-2">
              {DAY_OPTIONS.map((d) => (
                <Pill key={d} selected={form.days === d} onClick={() => setForm({ ...form, days: d })}>{d} days</Pill>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 mb-7" />

          {/* Row 3: Budget Slider */}
          <div className="flex flex-col gap-3 mb-7">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Trip Budget</label>
            <BudgetSlider
              value={BUDGET_LEVELS.findIndex((l) => l.key === form.budget)}
              onChange={(i) => setForm({ ...form, budget: BUDGET_LEVELS[i].key })}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 mb-7" />

          {/* Row 4: Travel Mood */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Travel Mood</label>
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => (
                <Pill key={v} selected={form.vibes.includes(v)} onClick={() => toggleVibe(v)}>{v}</Pill>
              ))}
            </div>
          </div>

          {error && <p className="mt-5 text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            className="mt-8 w-full rounded-2xl bg-[#1B4332] text-white py-4 text-base font-bold hover:bg-emerald-800 active:scale-[0.99] transition-all shadow-lg shadow-emerald-900/20 tracking-wide"
          >
            Generate My Trip →
          </button>
        </form>
      </div>

      {/* ── Trust Section ── */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 pt-24 pb-16 scroll-mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: "✈",
              label: "Realistic Routes",
              desc: "No impossible itineraries. Every plan routes through real connections.",
              bg: "bg-sky-50",
              iconColor: "text-sky-500",
            },
            {
              icon: "⚠",
              label: "Local Travel Intelligence",
              desc: "Roads, permits, weather caveats — baked into every plan.",
              bg: "bg-amber-50",
              iconColor: "text-amber-500",
            },
            {
              icon: "₹",
              label: "Budget-aware Planning",
              desc: "Trips matched to what you actually want to spend.",
              bg: "bg-emerald-50",
              iconColor: "text-emerald-600",
            },
          ].map(({ icon, label, desc, bg, iconColor }) => (
            <div key={label} className={`${bg} rounded-3xl px-8 py-8 flex flex-col gap-4`}>
              <span className={`text-3xl font-bold ${iconColor}`}>{icon}</span>
              <h3 className="font-bold text-gray-900 text-base">{label}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Destinations ── */}
      <section id="destinations" className="max-w-6xl mx-auto px-4 pb-24 scroll-mt-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Destinations</h2>
        <p className="text-sm text-gray-400 mb-8">Northeast India, planned properly.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              name: "Meghalaya",
              tagline: "Living root bridges. Monsoon clouds. Clean air.",
              places: "Shillong · Cherrapunji · Dawki",
              from: "from-[#0D2B1E]", via: "via-[#1B4332]", to: "to-[#1B5E42]",
              badge: "Available Now", badgeBg: "bg-emerald-500",
              emoji: "🌿",
            },
            {
              name: "Arunachal Pradesh",
              tagline: "Tawang monastery. Sunrise at Sela Pass.",
              places: "Tawang · Ziro · Bomdila",
              from: "from-[#451A03]", via: "via-[#92400E]", to: "to-[#78350F]",
              badge: "Coming Soon", badgeBg: "bg-amber-500",
              emoji: "🏔",
            },
            {
              name: "Sikkim",
              tagline: "Himalayan views. Tsomgo Lake. Quiet mountain towns.",
              places: "Gangtok · Lachung · Pelling",
              from: "from-[#0F172A]", via: "via-[#1E3A5F]", to: "to-[#1E40AF]",
              badge: "Coming Soon", badgeBg: "bg-blue-500",
              emoji: "❄️",
            },
          ].map((dest) => (
            <div
              key={dest.name}
              className={`bg-gradient-to-br ${dest.from} ${dest.via} ${dest.to} rounded-3xl p-8 flex flex-col gap-5 min-h-[280px] relative overflow-hidden`}
            >
              <div className="absolute bottom-0 right-4 text-[110px] opacity-[0.08] leading-none select-none pointer-events-none">
                {dest.emoji}
              </div>
              <span className={`${dest.badgeBg} text-white text-[10px] font-bold px-3 py-1.5 rounded-full self-start tracking-widest uppercase`}>
                {dest.badge}
              </span>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{dest.name}</h3>
                <p className="text-white/60 text-sm leading-snug">{dest.tagline}</p>
              </div>
              <p className="text-white/35 text-xs font-medium mt-auto tracking-wide">{dest.places}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─── Root component ──────────────────────────────────────── */

export default function TripPlannerForm() {
  const [form, setForm]       = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan]       = useState<TripPlan | null>(null);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.origin.trim()) { setError("Please enter your origin city."); return; }
    if (!form.budget)        { setError("Please select a budget.");        return; }

    setError("");
    setLoading(true);
    setPlan(null);

    try {
      const res  = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin:      form.origin.trim(),
          destination: form.destination,
          days:        form.days,
          budget:      form.budget,
          vibes:       form.vibes,
          ...BUDGET_LEVELS.find((l) => l.key === form.budget),
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

  if (loading) return <LoadingState />;
  if (plan)    return <TripResults plan={plan} onReset={() => { setPlan(null); setForm(INITIAL); }} />;

  return <HomePage form={form} setForm={setForm} onSubmit={handleSubmit} error={error} />;
}
