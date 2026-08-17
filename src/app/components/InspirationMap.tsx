"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { resolveCoords } from "../lib/geo";
import type { InspirationItem } from "@/lib/inspiration/types";

function markerIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      width:26px;height:26px;background:#58C7B2;border:2.5px solid #0B1C1A;
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(11,28,26,0.45);
    "></div>`,
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
}

interface Props {
  items: InspirationItem[];
}

/** Map view for the "My Inspiration" collection. Never invents coordinates —
 *  items we can't resolve against the curated geo DB are simply left off. */
export default function InspirationMap({ items }: Props) {
  const points = useMemo(() => {
    return items
      .map((item) => {
        const coords: [number, number] | null =
          item.latitude !== null && item.longitude !== null
            ? [item.latitude, item.longitude]
            : resolveCoords(item.locationName) ?? resolveCoords(item.city);
        return coords ? { item, coords } : null;
      })
      .filter((p): p is { item: InspirationItem; coords: [number, number] } => p !== null);
  }, [items]);

  const unresolved = items.length - points.length;

  if (points.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <p className="text-[12.5px] text-white/40">
          Map location unavailable for your saved places yet.
        </p>
      </div>
    );
  }

  const bounds = L.latLngBounds(points.map((p) => L.latLng(p.coords[0], p.coords[1])));

  return (
    <div className="relative w-full h-full">
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [40, 40] }}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OSM</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>'
          maxZoom={19}
          subdomains="abcd"
        />
        {points.map(({ item, coords }) => (
          <Marker key={item.id} position={coords} icon={markerIcon()}>
            <Tooltip direction="top" offset={[0, -26]} opacity={1}>
              {item.locationName} · {item.state}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
      {unresolved > 0 && (
        <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-sm rounded-xl px-3.5 py-2 text-[11px] text-white/70 pointer-events-none">
          {unresolved} place{unresolved === 1 ? "" : "s"} without a resolvable map location — not shown above.
        </div>
      )}
    </div>
  );
}
