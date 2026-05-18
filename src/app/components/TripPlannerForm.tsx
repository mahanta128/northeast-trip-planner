"use client";

import { useState } from "react";

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

interface TripPlan {
  tripTitle: string;
  summary: string;
  transport: string;
  stay: string;
  estimatedBudget: string;
  itinerary: ItineraryDay[];
}

const INITIAL: FormState = {
  origin: "",
  destination: "Meghalaya",
  days: "3",
  budget: "",
  vibes: [],
};

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
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Planning your Meghalaya trip...</p>
      </div>
    );
  }

  if (plan) {
    return (
      <div className="w-full max-w-2xl flex flex-col gap-5">
        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-7 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900 leading-snug">{plan.tripTitle}</h2>
            <button
              onClick={() => { setPlan(null); setForm(INITIAL); }}
              className="shrink-0 text-xs text-emerald-600 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition"
            >
              Plan Again
            </button>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{plan.summary}</p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "🚗", label: "Transport", value: plan.transport },
            { icon: "🏨", label: "Stay", value: plan.stay },
            { icon: "💰", label: "Est. Budget", value: plan.estimatedBudget },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-5 flex flex-col gap-1.5"
            >
              <span className="text-xl">{icon}</span>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-sm text-gray-700 leading-snug">{value}</p>
            </div>
          ))}
        </div>

        {/* Itinerary */}
        <div className="flex flex-col gap-3">
          {plan.itinerary.map((day) => (
            <div
              key={day.day}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex gap-4"
            >
              <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-bold">
                {day.day}
              </div>
              <div className="flex flex-col gap-2 pt-0.5">
                <p className="text-sm font-semibold text-gray-900">{day.title}</p>
                <ul className="flex flex-col gap-1">
                  {day.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
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
