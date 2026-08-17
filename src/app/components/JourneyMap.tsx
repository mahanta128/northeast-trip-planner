"use client";

import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { resolveCoords } from "../lib/geo";

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
