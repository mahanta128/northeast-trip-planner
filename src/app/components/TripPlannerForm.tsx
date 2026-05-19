"use client";

import { useState, useEffect } from "react";

/* ─── Types ──────────────────────────────────────────────── */

const VIBES = ["Nature", "Adventure", "Cafes", "Photography", "Relaxed"] as const;
type BudgetTier = "Budget" | "Comfortable" | "Premium";
type Vibe = (typeof VIBES)[number];

interface FormState {
  origin: string;
  destination: string;
  days: string;
  budget: BudgetTier | "";
  vibes: Vibe[];
}

interface TransportLeg {
  mode: string;
  leg: string;
  duration: string;
  cost: string;
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
  origin: "",
  destination: "Meghalaya",
  days: "3",
  budget: "",
  vibes: [],
};

/* ─── Loading state ──────────────────────────────────────── */

const STEPS = ["Finding best travel route", "Matching budget", "Building itinerary"];

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
    <div className="flex flex-col items-center gap-8 py-20">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-xl">🧭</span>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-gray-800">Planning your Meghalaya trip</p>
        <p className="text-sm text-gray-400 mt-1">This takes a few seconds</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {STEPS.map((step, i) => {
          const done = completedSteps.includes(i);
          const active = activeStep === i && !done;
          return (
            <div
              key={step}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
                done ? "border-emerald-200 bg-emerald-50"
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

/* ─── Results view ───────────────────────────────────────── */

function TripResults({ plan, onReset }: { plan: TripPlan; onReset: () => void }) {
  const scoreNum = parseInt(plan.tripFit.score);
  const scoreColor = scoreNum >= 8 ? "text-emerald-600" : scoreNum >= 6 ? "text-amber-500" : "text-red-500";
  const scoreBg = scoreNum >= 8 ? "bg-emerald-50 border-emerald-100" : scoreNum >= 6 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100";

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-7 py-6 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900 leading-snug">{plan.tripTitle}</h2>
          <button
            onClick={onReset}
            className="shrink-0 text-xs text-emerald-600 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition"
          >
            ← Plan Again
          </button>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">{plan.summary}</p>
      </div>

      {/* Trip Fit Score */}
      <div className={`rounded-2xl border ${scoreBg} px-7 py-5 flex flex-col gap-3`}>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Trip Fit Score</p>
        <div className="flex items-center gap-3">
          <span className={`text-3xl font-bold leading-none ${scoreColor}`}>{plan.tripFit.score}</span>
          <span className="text-sm font-semibold text-gray-700">{plan.tripFit.summary}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {plan.tripFit.reasons.map((r, i) => {
            const isWarning = r.startsWith("⚠");
            return (
              <span
                key={i}
                className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                  isWarning ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {r}
              </span>
            );
          })}
        </div>
      </div>

      {/* Transport */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-7 py-5 flex flex-col gap-3">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Getting There</p>
        <div className="flex flex-col gap-2">
          {plan.transport.map((leg, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 px-4 rounded-xl bg-gray-50 flex-wrap">
              <span className="text-lg">{leg.mode}</span>
              <span className="text-sm font-semibold text-gray-800">{leg.leg}</span>
              {leg.duration && (
                <span className="text-xs text-gray-400 bg-white border border-gray-100 rounded-full px-2.5 py-1">
                  {leg.duration}
                </span>
              )}
              <span className="ml-auto text-sm font-semibold text-emerald-600">{leg.cost}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stay + Budget side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Stay */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex flex-col gap-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Stay</p>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏨</span>
            <span className="text-base font-bold text-gray-900">{plan.stay.base}</span>
          </div>
          <p className="text-sm font-semibold text-emerald-600">{plan.stay.priceRange}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {plan.stay.bestFor.map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Budget breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex flex-col gap-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Budget Breakdown</p>
          <div className="flex flex-col gap-2 mt-1">
            {[
              ["Transport", plan.budget.transport],
              ["Stay", plan.budget.stay],
              ["Food", plan.budget.food],
              ["Local travel", plan.budget.localTravel],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-gray-800">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Itinerary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-7 py-6 flex flex-col gap-5">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Itinerary</p>
        {plan.itinerary.map((day, i) => (
          <div key={day.day} className="flex gap-4">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                {day.day}
              </div>
              {i < plan.itinerary.length - 1 && (
                <div className="w-px flex-1 bg-gray-100 mt-1" />
              )}
            </div>
            <div className="flex flex-col gap-1.5 pb-5">
              <p className="text-sm font-bold text-gray-900">
                Day {day.day} — {day.location}
              </p>
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
      <div className="bg-amber-50 rounded-2xl border border-amber-100 px-7 py-6 flex flex-col gap-3">
        <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest">Reality Check</p>
        <ul className="flex flex-col gap-2">
          {plan.realityCheck.map((item, i) => {
            const isWarning = item.startsWith("⚠");
            return (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className={`shrink-0 font-bold ${isWarning ? "text-amber-500" : "text-emerald-500"}`}>
                  {isWarning ? "⚠" : "✓"}
                </span>
                <span className="text-gray-700 leading-snug">
                  {item.replace(/^[✓⚠]\s*/, "")}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */

export default function TripPlannerForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [error, setError] = useState("");

  function toggleVibe(vibe: Vibe) {
    setForm((prev) => ({
      ...prev,
      vibes: prev.vibes.includes(vibe)
        ? prev.vibes.filter((v) => v !== vibe)
        : [...prev.vibes, vibe],
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.origin.trim()) { setError("Please enter your origin city."); return; }
    if (!form.budget) { setError("Please select a budget tier."); return; }

    setError("");
    setLoading(true);
    setPlan(null);

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: form.origin.trim(),
          destination: form.destination,
          days: form.days,
          budget: form.budget,
          vibes: form.vibes,
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
  if (plan) return <TripResults plan={plan} onReset={() => { setPlan(null); setForm(INITIAL); }} />;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-10 flex flex-col gap-7"
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Origin City</label>
        <input
          type="text"
          placeholder="e.g. Bangalore, Delhi, Kolkata"
          value={form.origin}
          onChange={(e) => setForm({ ...form, origin: e.target.value })}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Destination</label>
        <select
          value={form.destination}
          onChange={(e) => setForm({ ...form, destination: e.target.value })}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
        >
          <option value="Meghalaya">Meghalaya</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Number of Days</label>
        <select
          value={form.days}
          onChange={(e) => setForm({ ...form, days: e.target.value })}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
        >
          {[3, 4, 5, 6, 7].map((d) => (
            <option key={d} value={String(d)}>{d} Days</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-medium text-gray-700">Budget Tier</span>
        <div className="flex gap-3 flex-wrap">
          {(["Budget", "Comfortable", "Premium"] as BudgetTier[]).map((tier) => (
            <label
              key={tier}
              className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border text-sm font-medium transition select-none ${
                form.budget === tier
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600 hover:border-emerald-300"
              }`}
            >
              <input
                type="radio"
                name="budget"
                value={tier}
                checked={form.budget === tier}
                onChange={() => setForm({ ...form, budget: tier })}
                className="accent-emerald-500"
              />
              {tier}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-medium text-gray-700">Travel Vibe</span>
        <div className="flex gap-3 flex-wrap">
          {VIBES.map((vibe) => (
            <label
              key={vibe}
              className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border text-sm font-medium transition select-none ${
                form.vibes.includes(vibe)
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600 hover:border-emerald-300"
              }`}
            >
              <input
                type="checkbox"
                checked={form.vibes.includes(vibe)}
                onChange={() => toggleVibe(vibe)}
                className="accent-emerald-500"
              />
              {vibe}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 -mt-3">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Plan My Trip
      </button>
    </form>
  );
}
