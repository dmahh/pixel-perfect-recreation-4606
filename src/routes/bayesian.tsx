import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { landmarksQueryOptions } from "@/lib/astana/landmarks.functions";
import { createFileRoute } from "@tanstack/react-router";
import { CloudSun, Leaf, Sun, Cloud, CloudRain, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuitabilityChart } from "@/components/map/SuitabilityChart";
import { MapView } from "@/components/map/MapView";
import type { MapMarker } from "@/components/map/map-types";
import { CategoryDot, Explainer, PageHeader, Panel } from "@/components/site/kit";
import {
  P_COMFORT,
  P_CROWD_HIGH,
  P_SUITABLE,
  SEASONS,
  WEATHERS,
  infer,
  type BayesianInput,
} from "@/lib/astana/bayes";
import { CATEGORY_LABEL, SETTING_LABEL, type Category } from "@/lib/astana/landmarks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bayesian")({
  head: () => ({
    meta: [
      { title: "Bayesian Network — Smart Astana" },
      {
        name: "description",
        content:
          "Enter weather and season and a Bayesian network computes the probability that each Astana attraction is a good visit.",
      },
      { property: "og:title", content: "Bayesian Network — Smart Astana" },
      {
        property: "og:description",
        content: "Probabilistic reasoning about which Astana attractions suit today's weather and season.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(landmarksQueryOptions());
  },
  component: BayesianPage,
});

const pct = (p: number) => `${(p * 100).toFixed(1)}%`;
const weatherIcons = { sunny: Sun, cloudy: Cloud, rainy: CloudRain, snowy: Snowflake, unknown: CloudSun };
const level = (p: number) => (p >= 0.7 ? "high" : p >= 0.5 ? "medium" : "low") as "high" | "medium" | "low";
const levelBar = { high: "bg-success", medium: "bg-highlight", low: "bg-destructive" };

function BayesianPage() {
  const [input, setInput] = useState<BayesianInput>({ weather: "sunny", season: "summer" });
  const { data: kb } = useSuspenseQuery(landmarksQueryOptions());
  const out = useMemo(() => infer(input, kb.landmarks), [input, kb.landmarks]);
  const weatherLabel = WEATHERS.find(w => w.id === input.weather)?.label ?? "Unknown weather";
  const seasonLabel = SEASONS.find(s => s.id === input.season)?.label ?? "Unknown season";

  const markers = useMemo<MapMarker[]>(
    () =>
      out.byLandmark.map(({ landmark, p }) => ({
        id: landmark.id,
        lat: landmark.lat,
        lng: landmark.lng,
        label: `${landmark.shortName} · ${pct(p)}`,
        variant: level(p),
        text: String(Math.round(p * 100)),
      })),
    [out],
  );

  return (
    <>
      <PageHeader code="03" concept="Probabilistic reasoning" title="Astana attraction suitability">
        {weatherLabel} · {seasonLabel}
      </PageHeader>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[360px_1fr]">
        <div className="min-w-0 space-y-6">
          <Panel title="Evidence">
            <div className="space-y-5">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium"><CloudSun className="h-4 w-4 text-primary" /> Weather</p>
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Weather conditions">
                  {[...WEATHERS, { id: "unknown" as const, label: "Unknown" }].map((w) => {
                    const Icon = weatherIcons[w.id];
                    return <Button size="sm" key={w.id} variant={input.weather === w.id ? "default" : "outline"} aria-pressed={input.weather === w.id} onClick={() => setInput((i) => ({ ...i, weather: w.id }))}>
                      <Icon />{w.label}
                    </Button>;
                  })}
                </div>
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm font-medium"><Leaf className="h-4 w-4 text-primary" /> Season</p>
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Season">
                  {[...SEASONS, { id: "unknown" as const, label: "Unknown" }].map((s) => (
                    <Button size="sm" key={s.id} variant={input.season === s.id ? "default" : "outline"} aria-pressed={input.season === s.id} onClick={() => setInput((i) => ({ ...i, season: s.id }))}>
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Illustrative model estimates, not live weather forecasts or visitor survey results. Attractions with the same indoor/outdoor setting share a probability.</p>
            </div>
          </Panel>
          <Panel title="Network">
            <NetworkGraph pComfort={out.pComfort} pCrowd={out.pCrowdHigh} input={input} bySetting={out.bySetting} />
          </Panel>
        </div>

        <div className="min-w-0 space-y-6">
          <Panel title="Indoor vs. outdoor suitability">
            <p className="mb-3 text-sm text-muted-foreground" role="status">{weatherLabel} · {seasonLabel} · {out.byLandmark.length} attractions</p>
            <SuitabilityChart scores={out.bySetting} />
          </Panel>
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(out.byCategory) as Category[]).map((c) => (
              <div key={c} className="rounded-lg border bg-card p-4">
                <p className="flex items-center gap-2 text-sm font-medium"><CategoryDot category={c} /> {CATEGORY_LABEL[c]}s</p>
                <p className="mt-2 font-display text-3xl font-semibold">{pct(out.byCategory[c])}</p>
                <p className="mt-1 text-xs text-muted-foreground">Average suitability</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full transition-all duration-500", levelBar[level(out.byCategory[c])])} style={{ width: pct(out.byCategory[c]) }} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid min-w-0 gap-6 xl:grid-cols-2">
            <Panel title="Suitability by attraction">
              <ul className="space-y-3">
                {out.byLandmark.map(({ landmark, p }) => (
                  <li key={landmark.id}>
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <CategoryDot category={landmark.category} />
                        <span className="font-medium">{landmark.name}</span>
                      </span>
                      <span className="shrink-0 font-mono text-xs">{pct(p)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="meter" aria-label={`${landmark.name} suitability`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number((p * 100).toFixed(1))} aria-valuetext={pct(p)}>
                        <div className={cn("h-full rounded-full motion-safe:transition-all motion-safe:duration-500", levelBar[level(p)])} style={{ width: pct(p) }} />
                      </div>
                      <span className="w-24 shrink-0 text-right text-[0.7rem] text-muted-foreground">{SETTING_LABEL[landmark.setting]}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
            <div className="space-y-3">
              <MapView className="h-[340px] xl:h-[420px]" markers={markers} fitKey="bayes" />
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />High ≥ 70%</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-highlight" />Moderate 50–69.9%</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" />Low &lt; 50%</span>
              </div>
            </div>
          </div>

          <Panel title="Conditional probability tables">
            <div className="grid gap-6 lg:grid-cols-2">
              <CptComfort input={input} />
              <CptSuitable />
            </div>
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              P(Crowd=high | Season): {SEASONS.map((s) => `${s.label} ${P_CROWD_HIGH[s.id]}`).join(" · ")}
            </p>
          </Panel>
        </div>
      </div>

      <Explainer
        title="Exact inference by enumeration"
        items={[
          { term: "Root nodes", text: "Weather and Season are independent causes with illustrative prior probabilities. Unknown evidence uses these priors." },
          { term: "Hidden nodes", text: "Comfort depends on weather and season; Crowd depends only on the season." },
          { term: "Query node", text: "Suitable depends on Comfort, Crowd and whether the attraction is indoor, outdoor or both." },
          { term: "Marginalisation", text: "Unobserved variables are summed out, weighting each case by its probability." },
        ]}
      >
        <p className="font-mono text-xs leading-relaxed text-navy-foreground">
          P(S | w, s) = Σ<sub>c</sub> Σ<sub>r</sub> P(c | w, s) · P(r | s) · P(S | c, r, setting)
        </p>
        <p className="mt-3">
          For sunny summer outdoors: 0.9·(0.25·0.92 + 0.75·0.78) + 0.1·(0.25·0.25 + 0.75·0.15) ≈ 0.75. When evidence is
          unknown, the sum also runs over that variable's prior distribution.
        </p>
      </Explainer>
    </>
  );
}

function CptComfort({ input }: { input: BayesianInput }) {
  return (
    <div className="overflow-x-auto">
      <p className="mb-2 text-xs font-semibold">P(Comfort = yes | Weather, Season)</p>
      <table className="w-full font-mono text-xs">
        <thead>
          <tr className="text-muted-foreground">
            <th className="pb-2 text-left font-medium" />
            {WEATHERS.map((w) => (
              <th key={w.id} className="pb-2 text-right font-medium">{w.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SEASONS.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="py-1.5 font-sans">{s.label}</td>
              {WEATHERS.map((w) => {
                const hit =
                  (input.season === "unknown" || input.season === s.id) &&
                  (input.weather === "unknown" || input.weather === w.id);
                return (
                  <td key={w.id} className={cn("py-1.5 text-right", hit && "rounded bg-accent font-semibold text-accent-foreground")}>
                    {P_COMFORT[s.id][w.id].toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CptSuitable() {
  const cols = [
    { k: "comfort_low", label: "C, low" },
    { k: "comfort_high", label: "C, high" },
    { k: "uncomfortable_low", label: "¬C, low" },
    { k: "uncomfortable_high", label: "¬C, high" },
  ] as const;
  return (
    <div className="overflow-x-auto">
      <p className="mb-2 text-xs font-semibold">P(Suitable | Comfort, Crowd, Setting)</p>
      <table className="w-full font-mono text-xs">
        <thead>
          <tr className="text-muted-foreground">
            <th className="pb-2 text-left font-medium" />
            {cols.map((c) => (
              <th key={c.k} className="pb-2 text-right font-medium">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(["outdoor", "mixed", "indoor"] as const).map((s) => (
            <tr key={s} className="border-t">
              <td className="py-1.5 font-sans">{SETTING_LABEL[s]}</td>
              {cols.map((c) => (
                <td key={c.k} className="py-1.5 text-right">{P_SUITABLE[s][c.k].toFixed(2)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NetworkGraph({
  pComfort,
  pCrowd,
  input,
  bySetting,
}: {
  pComfort: number;
  pCrowd: number;
  input: BayesianInput;
  bySetting: Record<"indoor" | "outdoor" | "mixed", number>;
}) {
  const label = (v: string) => (v === "unknown" ? "prior" : v.charAt(0).toUpperCase() + v.slice(1));
  const nodes = [
    { id: "w", x: 70, y: 40, title: "Weather", value: label(input.weather), kind: "evidence" },
    { id: "s", x: 250, y: 40, title: "Season", value: label(input.season), kind: "evidence" },
    { id: "c", x: 70, y: 140, title: "Comfort", value: pct(pComfort), kind: "hidden" },
    { id: "r", x: 250, y: 140, title: "Crowd high", value: pct(pCrowd), kind: "hidden" },
    { id: "q", x: 160, y: 240, title: "Suitable", value: `${pct(bySetting.indoor)} in · ${pct(bySetting.outdoor)} out`, kind: "query" },
  ] as const;
  type NodeId = (typeof nodes)[number]["id"];
  const edges: [NodeId, NodeId][] = [["w", "c"], ["s", "c"], ["s", "r"], ["c", "q"], ["r", "q"]];
  const pos = (id: NodeId) => nodes.find((n) => n.id === id);
  return (
    <svg viewBox="0 0 320 285" className="w-full" role="img" aria-label="Bayesian network diagram">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" className="fill-silver" />
        </marker>
      </defs>
      {edges.map(([a, b]) => {
        const A = pos(a);
        const B = pos(b);
        if (!A || !B) return null;
        return (
          <line key={a + b} x1={A.x} y1={A.y + 22} x2={B.x} y2={B.y - 24} className="stroke-silver" strokeWidth={2} markerEnd="url(#arrow)" />
        );
      })}
      {nodes.map((n) => {
        const w = n.kind === "query" ? 170 : 120;
        return (
          <g key={n.id} transform={`translate(${n.x - w / 2}, ${n.y - 22})`}>
            <rect
              width={w}
              height={44}
              rx={8}
              className={cn(
                n.kind === "evidence" && "fill-navy",
                n.kind === "hidden" && "fill-card stroke-primary/40",
                n.kind === "query" && "fill-primary",
              )}
              strokeWidth={1.5}
            />
            <text x={w / 2} y={17} textAnchor="middle" className={cn("text-[10px] font-semibold", n.kind === "hidden" ? "fill-muted-foreground" : "fill-primary-glow")}>
              {n.title}
            </text>
            <text x={w / 2} y={33} textAnchor="middle" className={cn("font-mono text-[11px] font-semibold", n.kind === "hidden" ? "fill-foreground" : "fill-primary-foreground")}>
              {n.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
