"use client";

import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ─── Types ──────────────────────────────────────────────── */

interface ItineraryDay {
  day: number;
  location: string;
  highlights: string[];
}

interface MapStop {
  label: string;
  coords: [number, number];
  day: number | null; // null = transit hub (Guwahati)
}

interface Props {
  itinerary: ItineraryDay[];
  activeDay: number;
  onDaySelect: (day: number) => void;
}

/* ─── Coordinate Database ─────────────────────────────────── */

const CITY_COORDS: Record<string, [number, number]> = {
  // Northeast hub
  Guwahati:        [26.1445, 91.7362],

  // Meghalaya
  Shillong:        [25.5788, 91.8933],
  Cherrapunji:     [25.2744, 91.7254],
  Sohra:           [25.2744, 91.7254],
  Dawki:           [25.1897, 92.0204],
  Mawlynnong:      [25.2036, 91.9716],
  Mawsynram:       [25.2987, 91.5827],
  Jowai:           [25.4527, 92.2046],
  Nongpoh:         [25.9040, 91.8780],
  Mawphlang:       [25.4614, 91.7278],
  Laitlum:         [25.5280, 91.9760],
  Nohkalikai:      [25.2546, 91.7162],
  "Elephant Falls": [25.5510, 91.8450],
  "Ward's Lake":   [25.5740, 91.8936],

  // Arunachal Pradesh
  Tawang:          [27.5868, 91.8694],
  Itanagar:        [27.0844, 93.6053],
  Ziro:            [27.5487, 93.8295],
  Bomdila:         [27.2616, 92.4060],
  Dirang:          [27.3478, 92.4797],
  Namdapha:        [27.5511, 96.3898],
  "Sela Pass":     [27.5100, 92.0800],
  Bhalukpong:      [27.0050, 92.6372],
  Pasighat:        [28.0660, 95.3248],

  // Sikkim
  Gangtok:         [27.3314, 88.6138],
  Pelling:         [27.3004, 88.2333],
  Namchi:          [27.1620, 88.3570],
  Lachung:         [27.6870, 88.7445],
  Lachen:          [27.7270, 88.5567],
  "Tsomgo Lake":   [27.3736, 88.7565],
  Tsomgo:          [27.3736, 88.7565],
  "Nathu La":      [27.3872, 88.8283],
  Yuksom:          [27.4060, 88.2354],
  Ravangla:        [27.3044, 88.3585],

  // Other NE
  Kohima:          [25.6701, 94.1077],
  Imphal:          [24.8170, 93.9368],
  Aizawl:          [23.7271, 92.7176],
  Agartala:        [23.8315, 91.2868],
  Silchar:         [24.8333, 92.7789],
  Kaziranga:       [26.5775, 93.1711],
  Majuli:          [26.9524, 94.1619],
  Haflong:         [25.1645, 93.0167],

  // Major Indian cities (origin)
  Mumbai:          [19.0760, 72.8777],
  Delhi:           [28.6139, 77.2090],
  "New Delhi":     [28.6139, 77.2090],
  Kolkata:         [22.5726, 88.3639],
  Chennai:         [13.0827, 80.2707],
  Bengaluru:       [12.9716, 77.5946],
  Bangalore:       [12.9716, 77.5946],
  Hyderabad:       [17.3850, 78.4867],
  Ahmedabad:       [23.0225, 72.5714],
  Pune:            [18.5204, 73.8567],
  Jaipur:          [26.9124, 75.7873],
  Lucknow:         [26.8467, 80.9462],
  Bhubaneswar:     [20.2961, 85.8189],
  Siliguri:        [26.7271, 88.3953],
  Bagdogra:        [26.6812, 88.3285],
};

function resolveCoords(name: string): [number, number] | null {
  const clean = name.split(",")[0].trim();

  if (CITY_COORDS[clean]) return CITY_COORDS[clean]!;

  const lower = clean.toLowerCase();
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    if (k.toLowerCase() === lower) return v;
  }
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    if (lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) return v;
  }

  return null;
}

/* ─── Custom marker icons ─────────────────────────────────── */

function createMarkerIcon(label: string, isActive: boolean, isTransit: boolean): L.DivIcon {
  const size   = isActive ? 40 : 32;
  const bg     = isActive ? "#2551CC" : isTransit ? "#1C2333" : "#FFFFFF";
  const fg     = isActive || isTransit ? "#FFFFFF" : "#2551CC";
  const border = isActive ? "#2551CC" : isTransit ? "#1C2333" : "#C8D9F5";
  const shadow = isActive
    ? "0 4px 18px rgba(37,81,204,0.45),0 0 0 4px rgba(37,81,204,0.14)"
    : isTransit
    ? "0 2px 8px rgba(28,35,51,0.32)"
    : "0 2px 8px rgba(37,81,204,0.16)";
  const fSize  = isActive ? "13px" : "11px";

  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};
      border:2.5px solid ${border};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      color:${fg};
      font-size:${fSize};font-weight:700;
      font-family:system-ui,-apple-system,sans-serif;
      box-shadow:${shadow};
      cursor:pointer;
      letter-spacing:-0.02em;
      transition:transform 0.2s ease,box-shadow 0.2s ease;
    ">${label}</div>`,
    className: "",
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/* ─── Map controller: fly to active stop ─────────────────── */

function FlyController({ center }: { center: [number, number] | null }) {
  const map      = useMap();
  const prevRef  = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!center) return;
    // Skip identical coords (no-op)
    if (
      prevRef.current &&
      prevRef.current[0] === center[0] &&
      prevRef.current[1] === center[1]
    ) return;
    // Skip very first render — let bounds handle initial viewport
    if (prevRef.current === null) {
      prevRef.current = center;
      return;
    }
    prevRef.current = center;
    map.flyTo(center, Math.max(map.getZoom(), 11), { duration: 0.9, easeLinearity: 0.35 });
  }, [center, map]);

  return null;
}

/* ─── Static fallback (when coords can't be resolved) ──────── */

function StaticFallback({ stops }: { stops: MapStop[] }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-6">
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {stops.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
              style={{
                background: s.day === null ? "#1C2333" : "#2551CC",
                color: "#fff",
                borderColor: s.day === null ? "#1C2333" : "#2551CC",
              }}
            >
              {s.day === null ? "✈" : s.day}
            </div>
            <span className="text-[12px] font-medium text-[#6B7280]">{s.label}</span>
            {i < stops.length - 1 && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#DDE8F7]">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[#A8B5C8] text-center">Interactive map unavailable — check network connection</p>
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────────── */

export default function JourneyMap({ itinerary, activeDay, onDaySelect }: Props) {
  const stops: MapStop[] = useMemo(() => {
    const result: MapStop[] = [];

    // Always lead with Guwahati (NE India transit hub)
    result.push({ label: "Guwahati", coords: [26.1445, 91.7362], day: null });

    for (const day of itinerary) {
      const loc    = day.location.split(",")[0].trim();
      const coords = resolveCoords(loc);
      if (coords) result.push({ label: loc, coords, day: day.day });
    }

    return result;
  }, [itinerary]);

  const activeStop  = stops.find(s => s.day === activeDay) ?? null;
  const routeCoords = stops.map(s => s.coords);

  if (stops.length < 2) return <StaticFallback stops={stops} />;

  const bounds = L.latLngBounds(routeCoords.map(c => L.latLng(c[0], c[1])));

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [48, 48] }}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      {/* CartoDB Positron — soft, premium, no API key */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OSM</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>'
        maxZoom={19}
        subdomains="abcd"
      />

      {/* Route polyline */}
      <Polyline
        positions={routeCoords}
        pathOptions={{
          color:     "#2551CC",
          weight:    2.5,
          opacity:   0.60,
          dashArray: "7 5",
          lineCap:   "round",
          lineJoin:  "round",
        }}
      />

      {/* Stops / markers */}
      {stops.map((stop, i) => (
        <Marker
          key={`${stop.label}-${i}`}
          position={stop.coords}
          icon={createMarkerIcon(
            stop.day !== null ? String(stop.day) : "✈",
            stop.day === activeDay,
            stop.day === null,
          )}
          eventHandlers={{
            click: () => { if (stop.day !== null) onDaySelect(stop.day); },
          }}
        >
          <Tooltip
            direction="top"
            offset={[0, -20]}
            opacity={1}
            className="journey-tooltip"
          >
            {stop.day !== null ? `Day ${stop.day}` : "Transit"} · {stop.label}
          </Tooltip>
        </Marker>
      ))}

      {/* Pan-to controller — fires on activeDay change */}
      <FlyController center={activeStop?.coords ?? null} />
    </MapContainer>
  );
}
