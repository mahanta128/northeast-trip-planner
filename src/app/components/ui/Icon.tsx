"use client";

import {
  CloudRain, CloudDrizzle, CloudSun, Cloud, Sun,
  Flower2, Leaf, Snowflake, Sparkles, Sunrise, Sunset, Moon,
  Plane, Bus, Car, Ship, Train,
  Building, Tent, BedDouble,
  UtensilsCrossed, Coffee,
  Mountain, TreePine,
  TriangleAlert, ShieldAlert, Lightbulb, CheckCircle2,
  MapPin, Route, Compass, Navigation,
  Share2, Bookmark, Download, ArrowLeft, ArrowRight,
  Zap, Star, Music, CalendarDays, Wallet, CreditCard, Check,
  type LucideIcon,
} from "lucide-react";

/* ─── Semantic colour palette ─────────────────────────────── */

interface IconStyle { color: string; bg: string; border: string }

const ICON_STYLES: Record<string, IconStyle> = {
  winter:     { color: "#355E9D", bg: "rgba(53,94,157,0.08)",   border: "rgba(53,94,157,0.14)"   },
  spring:     { color: "#5D8B4A", bg: "rgba(93,139,74,0.08)",   border: "rgba(93,139,74,0.14)"   },
  monsoon:    { color: "#355E9D", bg: "rgba(53,94,157,0.10)",   border: "rgba(53,94,157,0.16)"   },
  autumn:     { color: "#B7791F", bg: "rgba(183,121,31,0.08)",  border: "rgba(183,121,31,0.14)"  },
  weather:    { color: "#355E9D", bg: "rgba(53,94,157,0.08)",   border: "rgba(53,94,157,0.14)"   },
  road:       { color: "#B7791F", bg: "rgba(183,121,31,0.08)",  border: "rgba(183,121,31,0.14)"  },
  warning:    { color: "#B7791F", bg: "rgba(183,121,31,0.08)",  border: "rgba(183,121,31,0.14)"  },
  tip:        { color: "#355E9D", bg: "rgba(53,94,157,0.08)",   border: "rgba(53,94,157,0.14)"   },
  check:      { color: "#5D8B4A", bg: "rgba(93,139,74,0.08)",   border: "rgba(93,139,74,0.14)"   },
  alert:      { color: "#B7791F", bg: "rgba(183,121,31,0.08)",  border: "rgba(183,121,31,0.14)"  },
  morning:    { color: "#D9B86A", bg: "rgba(217,184,106,0.10)", border: "rgba(217,184,106,0.18)" },
  afternoon:  { color: "#B7791F", bg: "rgba(183,121,31,0.08)",  border: "rgba(183,121,31,0.14)"  },
  evening:    { color: "#355E9D", bg: "rgba(53,94,157,0.08)",   border: "rgba(53,94,157,0.14)"   },
  plane:      { color: "#355E9D", bg: "rgba(53,94,157,0.08)",   border: "rgba(53,94,157,0.14)"   },
  bus:        { color: "#355E9D", bg: "rgba(53,94,157,0.08)",   border: "rgba(53,94,157,0.14)"   },
  car:        { color: "#1F2E45", bg: "rgba(31,46,69,0.06)",    border: "rgba(31,46,69,0.12)"    },
  train:      { color: "#355E9D", bg: "rgba(53,94,157,0.08)",   border: "rgba(53,94,157,0.14)"   },
  ship:       { color: "#355E9D", bg: "rgba(53,94,157,0.08)",   border: "rgba(53,94,157,0.14)"   },
  transport:  { color: "#355E9D", bg: "rgba(53,94,157,0.08)",   border: "rgba(53,94,157,0.14)"   },
  hotel:      { color: "#5D8B4A", bg: "rgba(93,139,74,0.08)",   border: "rgba(93,139,74,0.14)"   },
  tent:       { color: "#5D8B4A", bg: "rgba(93,139,74,0.08)",   border: "rgba(93,139,74,0.14)"   },
  stay:       { color: "#5D8B4A", bg: "rgba(93,139,74,0.08)",   border: "rgba(93,139,74,0.14)"   },
  food:       { color: "#B7791F", bg: "rgba(183,121,31,0.08)",  border: "rgba(183,121,31,0.14)"  },
  activities: { color: "#1F2E45", bg: "rgba(31,46,69,0.06)",    border: "rgba(31,46,69,0.12)"    },
  "tree-pine":{ color: "#5D8B4A", bg: "rgba(93,139,74,0.08)",   border: "rgba(93,139,74,0.14)"   },
  mountain:   { color: "#1F2E45", bg: "rgba(31,46,69,0.06)",    border: "rgba(31,46,69,0.12)"    },
  snowflake:  { color: "#355E9D", bg: "rgba(53,94,157,0.08)",   border: "rgba(53,94,157,0.14)"   },
  festival:   { color: "#355E9D", bg: "rgba(53,94,157,0.08)",   border: "rgba(53,94,157,0.14)"   },
  permit:     { color: "#B7791F", bg: "rgba(183,121,31,0.08)",  border: "rgba(183,121,31,0.14)"  },
  compass:    { color: "#355E9D", bg: "rgba(53,94,157,0.08)",   border: "rgba(53,94,157,0.14)"   },
  star:       { color: "#D9B86A", bg: "rgba(217,184,106,0.10)", border: "rgba(217,184,106,0.18)" },
  sparkles:   { color: "#5D8B4A", bg: "rgba(93,139,74,0.08)",   border: "rgba(93,139,74,0.14)"   },
  share:      { color: "#355E9D", bg: "rgba(53,94,157,0.08)",   border: "rgba(53,94,157,0.14)"   },
  save:       { color: "#355E9D", bg: "rgba(53,94,157,0.08)",   border: "rgba(53,94,157,0.14)"   },
  download:   { color: "#355E9D", bg: "rgba(53,94,157,0.08)",   border: "rgba(53,94,157,0.14)"   },
};

const fallbackStyle: IconStyle = {
  color: "#6B7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.14)",
};

const getStyle = (name: string): IconStyle => ICON_STYLES[name] ?? fallbackStyle;

/* ─── Icon component map ─────────────────────────────────── */

export const ICON_MAP: Record<string, LucideIcon> = {
  winter:      Snowflake,
  spring:      Flower2,
  monsoon:     CloudRain,
  autumn:      Leaf,
  weather:     CloudRain,
  "cloud-rain":CloudRain,
  "cloud-drizzle": CloudDrizzle,
  "cloud-sun": CloudSun,
  cloud:       Cloud,
  sun:         Sun,
  road:        Route,
  warning:     TriangleAlert,
  tip:         Lightbulb,
  check:       CheckCircle2,
  alert:       Zap,
  plane:       Plane,
  bus:         Bus,
  car:         Car,
  taxi:        Car,
  train:       Train,
  ship:        Ship,
  transport:   Bus,
  hotel:       Building,
  tent:        Tent,
  stay:        BedDouble,
  food:        UtensilsCrossed,
  cafe:        Coffee,
  activities:  Compass,
  wallet:      Wallet,
  "tree-pine": TreePine,
  mountain:    Mountain,
  snowflake:   Snowflake,
  leaf:        Leaf,
  morning:     Sunrise,
  afternoon:   Sun,
  evening:     Sunset,
  night:       Moon,
  festival:    CalendarDays,
  permit:      ShieldAlert,
  share:       Share2,
  save:        Bookmark,
  download:    Download,
  "arrow-left":  ArrowLeft,
  "arrow-right": ArrowRight,
  compass:     Compass,
  star:        Star,
  sparkles:    Sparkles,
  music:       Music,
  navigation:  Navigation,
  mappin:      MapPin,
  credit:      CreditCard,
  check2:      Check,
};

/* ─── PremiumIcon — icon inside a premium rounded container ─ */

interface PremiumIconProps {
  name: string;
  size?: number;
  containerSize?: number;
  radius?: number;
  strokeWidth?: number;
  color?: string;
  bg?: string;
  border?: string;
  shadow?: string;
  className?: string;
}

export function PremiumIcon({
  name,
  size = 18,
  containerSize = 40,
  radius = 14,
  strokeWidth = 1.75,
  color,
  bg,
  border,
  shadow = "0 1px 6px rgba(31,46,69,0.06), inset 0 1px 0 rgba(255,255,255,0.70)",
  className = "",
}: PremiumIconProps) {
  const IconComp = ICON_MAP[name];
  if (!IconComp) return null;
  const s = getStyle(name);

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center ${className}`}
      style={{
        width: containerSize,
        height: containerSize,
        borderRadius: radius,
        background: bg ?? s.bg,
        border: `1px solid ${border ?? s.border}`,
        boxShadow: shadow,
      }}
    >
      <IconComp size={size} strokeWidth={strokeWidth} color={color ?? s.color} />
    </div>
  );
}

/* ─── InlineIcon — bare icon, no container ───────────────── */

export function InlineIcon({
  name,
  size = 16,
  strokeWidth = 1.75,
  color,
  className = "",
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}) {
  const IconComp = ICON_MAP[name];
  if (!IconComp) return null;
  const s = getStyle(name);
  return (
    <IconComp
      size={size}
      strokeWidth={strokeWidth}
      color={color ?? s.color}
      className={className}
    />
  );
}
