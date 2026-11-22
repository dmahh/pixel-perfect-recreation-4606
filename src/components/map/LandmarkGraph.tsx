import { Button } from "@/components/ui/button";
import { EDGES } from "@/lib/astana/astar";
import { getLandmark } from "@/lib/astana/landmarks";
import type { MapLine, MapMarker } from "./map-types";

// Schematic positions, independent of the geographic map and road costs.
const POSITIONS: Record<string, [number, number]> = {
  "central-park": [110, 65],
  atameken: [110, 230],
  "khan-shatyr": [110, 400],
  bayterek: [365, 170],
  "botanical-garden": [365, 490],
  "nur-alem": [605, 490],
  "presidential-park": [605, 330],
  "palace-peace": [605, 110],
  "national-museum": [810, 65],
  "hazrat-sultan": [810, 235],
};

export function LandmarkGraph({ markers, lines, start, goal, selection, onSelect }: {
  markers: MapMarker[];
  lines: MapLine[];
  start: string;
  goal: string;
  selection: "start" | "goal";
  onSelect: (id: string) => void;
}) {
  const pointId = (point: [number, number]) => markers.find(m => m.lat === point[0] && m.lng === point[1])?.id;
  const highlighted = new Map<string, string>();
  for (const line of lines) {
    for (let i = 1; i < line.points.length; i++) {
      const a = line.points[i - 1];
      const b = line.points[i];
      if (!a || !b) continue;
      const from = pointId(a);
      const to = pointId(b);
      if (from && to) highlighted.set([from, to].sort().join("|"), line.variant);
    }
  }
  return (
    <div className="max-w-full overflow-x-auto rounded-lg border bg-card" tabIndex={0} aria-label="Interactive landmark graph">
      <svg viewBox="0 0 920 560" className="blueprint block min-w-[680px] w-full" role="group" aria-label="Astana landmark route graph">
        {EDGES.map(edge => {
          const a = POSITIONS[edge.from];
          const b = POSITIONS[edge.to];
          if (!a || !b) return null;
          const variant = highlighted.get([edge.from, edge.to].sort().join("|")) ?? "edge";
          return (
            <g key={`${edge.from}-${edge.to}`}>
              <title>{`${getLandmark(edge.from).shortName} to ${getLandmark(edge.to).shortName}: ${edge.km.toFixed(2)} km`}</title>
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={`map-line--${variant}`} />
              <text x={(a[0] + b[0]) / 2} y={(a[1] + b[1]) / 2 - 6} textAnchor="middle" className="graph-distance">{edge.km.toFixed(2)} km</text>
            </g>
          );
        })}
        {markers.map(marker => {
          const position = POSITIONS[marker.id];
          if (!position) return null;
          const endpoint = marker.id === start ? "Start" : marker.id === goal ? "Goal" : null;
          return (
            <foreignObject key={marker.id} x={position[0] - 76} y={position[1] - 32} width={152} height={64}>
              <Button variant="outline" onClick={() => onSelect(marker.id)}
                aria-label={`Set ${getLandmark(marker.id).shortName} as ${selection}`}
                aria-pressed={marker.id === (selection === "start" ? start : goal)}
                title={marker.label}
                className={`graph-node graph-node--${marker.variant}`}>
                <span className="block whitespace-normal">{getLandmark(marker.id).shortName}</span>
                <span className="block font-mono text-[10px] uppercase">{endpoint ?? marker.variant}</span>
              </Button>
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
}