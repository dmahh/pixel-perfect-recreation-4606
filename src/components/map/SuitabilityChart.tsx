import type { Setting } from "@/lib/astana/landmarks";
import { SETTING_LABEL } from "@/lib/astana/landmarks";

const SETTINGS: Setting[] = ["indoor", "mixed", "outdoor"];
const fills: Record<Setting, string> = { indoor: "fill-primary", mixed: "fill-highlight", outdoor: "fill-success" };

export function SuitabilityChart({ scores }: { scores: Record<Setting, number> }) {
  return (
    <svg viewBox="0 0 540 185" className="w-full" role="img" aria-label="Suitability comparison by attraction setting">
      <title>{`Indoor ${(scores.indoor * 100).toFixed(1)}%, indoor and outdoor ${(scores.mixed * 100).toFixed(1)}%, outdoor ${(scores.outdoor * 100).toFixed(1)}%`}</title>
      {[0, 25, 50, 75, 100].map(tick => (
        <g key={tick}>
          <line x1={130 + tick * 3.5} x2={130 + tick * 3.5} y1={12} y2={150} className="stroke-border" />
          <text x={130 + tick * 3.5} y={175} textAnchor="middle" className="fill-muted-foreground font-mono text-[12px]">{tick}%</text>
        </g>
      ))}
      {SETTINGS.map((setting, i) => (
        <g key={setting}>
          <text x={118} y={38 + i * 48} textAnchor="end" className="fill-foreground text-[13px] font-medium">{SETTING_LABEL[setting]}</text>
          <rect x={130} y={20 + i * 48} width={350} height={26} rx={4} className="fill-muted" />
          <rect x={130} y={20 + i * 48} width={scores[setting] * 350} height={26} rx={4} className={fills[setting]} />
          <text x={490} y={38 + i * 48} className="fill-foreground font-mono text-[12px]">{(scores[setting] * 100).toFixed(1)}%</text>
        </g>
      ))}
    </svg>
  );
}