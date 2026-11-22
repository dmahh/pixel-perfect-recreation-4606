import { useEffect, useRef } from "react";
import L from "leaflet";
import { ASTANA_CENTER } from "@/lib/astana/landmarks";
import type { MapProps } from "./map-types";

const lineOrder = { edge: 0, explored: 1, walk: 2, route: 3 } as const;

export default function AstanaMap({ markers, lines = [], fitKey, onMarkerClick }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const clickRef = useRef(onMarkerClick);
  clickRef.current = onMarkerClick;

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomSnap: 0.25, zoomAnimation: false, fadeAnimation: false }).setView(
      ASTANA_CENTER,
      13,
    );
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      map.stop();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    [...lines]
      .sort((a, b) => lineOrder[a.variant] - lineOrder[b.variant])
      .forEach((line) => {
        L.polyline(line.points, { className: `map-line--${line.variant}`, interactive: false }).addTo(layer);
      });
    markers.forEach((m) => {
      const icon = L.divIcon({
        className: "",
        html: `<div class="map-pin map-pin--${m.variant}">${m.text ?? ""}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([m.lat, m.lng], {
        icon,
        zIndexOffset: m.variant === "current" ? 1000 : 0,
        title: m.label,
      }).addTo(layer);
      marker.bindTooltip(m.label, { direction: "top", offset: [0, -14], className: "map-tooltip" });
      marker.on("click", () => clickRef.current?.(m.id));
    });
  }, [markers, lines]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
    // Only re-fit when the caller asks for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  return <div ref={containerRef} className="h-full w-full" />;
}
