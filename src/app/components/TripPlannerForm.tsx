"use client";

import { useState, useEffect } from "react";

const STEPS = [
  "Finding best travel route",
  "Matching budget",
  "Building itinerary",
];

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
      {/* Spinner */}
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-xl">🧭</span>
      </div>

      {/* Heading */}
      <div className="text-center">
        <p className="text-base font-semibold text-gray-800">Planning your Meghalaya trip</p>
        <p className="text-sm text-gray-400 mt-1">This takes a few seconds</p>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {STEPS.map((step, i) => {
          const done = completedSteps.includes(i);
          const active = activeStep === i && !done;
          return (
            <div
              key={step}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
                done
                  ? "border-emerald-200 bg-emerald-50"
                  : active
                  ? "border-emerald-300 bg-white shadow-sm"
                  : "border-gray-100 bg-white opacity-40"
              }`}
            >
              {/* Icon */}
              <span className="w-5 h-5 flex items-center justify-center shrink-0">
                {done ? (
                  <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 16 16" fill="none">
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

interface ItineraryDay {
  day: number;
  title: string;
  highlights: string[];
}

interface RealityCheck {
  route: string;
  feasibility: string;
  weather: string;
  localExpectations: string;
}

interface TripPlan {
  tripTitle: string;
  summary: string;
  transport: string[];
  stay: string;
  estimatedBudget: { range: string; note: string };
  itinerary: ItineraryDay[];
  realityCheck: RealityCheck;
}

const INITIAL: FormState = {
  origin: "",
  destination: "Meghalaya",
  days: "3",
  budget: "",
  vibes: [],
};

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
          <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}

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

    if (!form.origin.trim()) {
      setError("Please enter your origin city.");
      return;
    }
    if (!form.budget) {
      setError("Please select a budget tier.");
      return;
    }

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

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setPlan(data.plan);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (plan) {
    return (
      <div className="w-full max-w-2xl flex flex-col gap-4">

        {/* Title + Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-7 py-6 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900 leading-snug">{plan.tripTitle}</h2>
            <button
              onClick={() => { setPlan(null); setForm(INITIAL); }}
              className="shrink-0 text-xs text-emerald-600 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition"
            >
              ← Plan Again
            </button>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">{plan.summary}</p>
        </div>

        {/* Transport + Stay + Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Transport */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 flex flex-col gap-2.5">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Transport</p>
            <BulletList items={plan.transport} />
          </div>

          {/* Stay */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 flex flex-col gap-2.5">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Stay</p>
            <p className="text-sm text-gray-600 leading-snug">{plan.stay}</p>
          </div>

          {/* Budget */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Est. Budget</p>
            <p className="text-xl font-bold text-emerald-600 leading-none">{plan.estimatedBudget.range}</p>
            <p className="text-xs text-gray-400">{plan.estimatedBudget.note}</p>
          </div>
        </div>

        {/* Itinerary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-7 py-6 flex flex-col gap-5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Itinerary</p>
          {plan.itinerary.map((day, i) => (
            <div key={day.day} className="flex gap-4">
              {/* Day number + connector */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                  {day.day}
                </div>
                {i < plan.itinerary.length - 1 && (
                  <div className="w-px flex-1 bg-gray-100 my-0.5" />
                )}
              </div>
              {/* Content */}
              <div className="flex flex-col gap-1.5 pb-4">
                <p className="text-sm font-semibold text-gray-900">{day.title}</p>
                <BulletList items={day.highlights} />
              </div>
            </div>
          ))}
        </div>

        {/* Reality Check */}
        {plan.realityCheck && (
          <div className="bg-amber-50 rounded-2xl border border-amber-100 px-7 py-6 flex flex-col gap-4">
            <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest">Reality Check</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: "🗺️", label: "Route", value: plan.realityCheck.route },
                { icon: "✅", label: "Feasibility", value: plan.realityCheck.feasibility },
                { icon: "🌧️", label: "Weather", value: plan.realityCheck.weather },
                { icon: "📍", label: "On the Ground", value: plan.realityCheck.localExpectations },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">{icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-0.5">{label}</p>
                    <p className="text-sm text-gray-600 leading-snug">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-10 flex flex-col gap-7"
    >
      {/* Origin */}
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

      {/* Destination */}
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

      {/* Number of Days */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Number of Days</label>
        <select
          value={form.days}
          onChange={(e) => setForm({ ...form, days: e.target.value })}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
        >
          {[3, 4, 5, 6, 7].map((d) => (
            <option key={d} value={String(d)}>
              {d} Days
            </option>
          ))}
        </select>
      </div>

      {/* Budget Tier */}
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

      {/* Travel Vibe */}
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

      {/* Validation error */}
      {error && <p className="text-sm text-red-500 -mt-3">{error}</p>}

      {/* Submit */}
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
