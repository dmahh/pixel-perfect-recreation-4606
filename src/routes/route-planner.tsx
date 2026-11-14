import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeftRight, ChevronLeft, ChevronRight, FastForward, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapView } from "@/components/map/MapView";
import type { MapLine, MapMarker, PinVariant } from "@/components/map/map-types";
import { Explainer, PageHeader, Panel, Stat } from "@/components/site/kit";
import { EDGES, aStar, dijkstra, partialPath } from "@/lib/astana/astar";
import { LANDMARKS, getLandmark } from "@/lib/astana/landmarks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/route-planner")({
  head: () => ({
    meta: [
      { title: "A* Route Planner — Smart Astana" },
      {
        name: "description",
        content:
          "Watch the A* search algorithm find the shortest road route between Astana landmarks, with a step-by-step log of every expansion.",
      },
      { property: "og:title", content: "A* Route Planner — Smart Astana" },
      {
        property: "og:description",
        content: "Step through A* pathfinding across Astana's landmark road graph.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoutePlannerPage,
});

const r2 = (n: number) => n.toFixed(2);

function RoutePlannerPage() {
  const [start, setStart] = useState("nur-alem");
  const [goal, setGoal] = useState("hazrat-sultan");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const logRef = useRef<HTMLOListElement>(null);

  const result = useMemo(() => aStar(start, goal), [start, goal]);
  const reference = useMemo(() => dijkstra(start, goal), [start, goal]);
  const last = result.steps.length - 1;
  const step = result.steps[Math.min(index, last)]!;
  const finished = index >= last;

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [start, goal]);

  useEffect(() => {
    if (!playing) return;
    if (index >= last) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIndex((i) => i + 1), 1000);
    return () => clearTimeout(t);
  }, [playing, index, last]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [index]);

  const { markers, lines } = useMemo(() => {
    const closed = new Set(step.closed);
    const open = new Set(step.open.map((o) => o.id));
    const pathNow = finished ? result.path : partialPath(step.cameFrom, step.current.id, start);
    const onPath = new Set(pathNow);
    const markers: MapMarker[] = LANDMARKS.map((l) => {
      let variant: PinVariant = "muted";
      if (l.id === step.current.id) variant = "current";
      else if (finished && onPath.has(l.id)) variant = "path";
      else if (open.has(l.id)) variant = "open";
      else if (closed.has(l.id)) variant = "closed";
      else if (l.id === goal) variant = "goal";
      return {
        id: l.id,
        lat: l.lat,
        lng: l.lng,
        label: l.name,
        variant,
        text: l.id === start ? "S" : l.id === goal ? "G" : undefined,
      };
    });
    const pt = (id: string): [number, number] => [getLandmark(id).lat, getLandmark(id).lng];
    const lines: MapLine[] = [
      ...EDGES.map<MapLine>((e) => ({ id: `${e.from}-${e.to}`, variant: "edge", points: [pt(e.from), pt(e.to)] })),
      ...Object.entries(step.cameFrom).map<MapLine>(([to, from]) => ({
        id: `x-${from}-${to}`,
        variant: "explored",
        points: [pt(from), pt(to)],
      })),
      { id: "best", variant: "route", points: pathNow.map(pt) },
    ];
    return { markers, lines };
  }, [step, finished, result.path, start, goal]);

  const swap = () => {
    setStart(goal);
    setGoal(start);
  };

  return (
    <>
      <PageHeader code="02" concept="Informed search" title="A* pathfinding across Astana's road graph">
        Pick two landmarks and step through the search. Gold is the node being expanded, outlined pins are in the
        open set, pale pins are closed.
      </PageHeader>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <Panel>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <LandmarkSelect label="Start" value={start} onChange={setStart} exclude={goal} />
              <Button variant="outline" size="icon" onClick={swap} aria-label="Swap start and goal" className="mx-auto">
                <ArrowLeftRight />
              </Button>
              <LandmarkSelect label="Goal" value={goal} onChange={setGoal} exclude={start} />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => { setPlaying(false); setIndex(0); }} aria-label="Reset">
                <RotateCcw />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} aria-label="Previous step">
                <ChevronLeft />
              </Button>
              <Button variant="hero" onClick={() => (finished ? (setIndex(0), setPlaying(true)) : setPlaying((p) => !p))} className="w-28">
                {playing ? <><Pause /> Pause</> : <><Play /> {finished ? "Replay" : "Play"}</>}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIndex((i) => Math.min(last, i + 1))} disabled={finished} aria-label="Next step">
                <ChevronRight />
              </Button>
              <Button variant="outline" size="icon" onClick={() => { setPlaying(false); setIndex(last); }} disabled={finished} aria-label="Jump to result">
                <FastForward />
              </Button>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <span className="font-mono text-xs text-muted-foreground">
              step {index + 1}/{result.steps.length}
            </span>
            <Slider min={0} max={last} step={1} value={[index]} onValueChange={([v]) => { setPlaying(false); setIndex(v ?? 0); }} aria-label="Search step" />
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Expanding" value={getLandmark(step.current.id).shortName} hint={`f = ${r2(step.current.f)} km`} />
          <Stat label="Open set" value={step.open.length} />
          <Stat label="Closed set" value={step.closed.length} />
          <Stat
            label="Route length"
            value={finished ? `${r2(result.cost)} km` : "…"}
            hint={finished ? `${result.path.length - 1} road segments` : "searching"}
          />
          <Stat label="Expansions" value={`${result.steps.length} vs ${reference.expanded}`} hint="A* vs Dijkstra" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            <MapView className="h-[360px] sm:h-[520px]" markers={markers} lines={lines} fitKey="graph" />
            <Legend />
          </div>
          <div className="space-y-6">
            <Panel title="Search log">
              <ol ref={logRef} className="max-h-[300px] space-y-2 overflow-y-auto rounded-lg bg-navy p-3 font-mono text-[0.72rem] leading-relaxed">
                {result.steps.slice(0, index + 1).map((s) => (
                  <li
                    key={s.iteration}
                    className={cn(
                      "rounded-md px-2 py-1.5 text-navy-muted",
                      s.iteration === index + 1 && "bg-primary/25 text-navy-foreground",
                    )}
                  >
                    <span className={cn("mr-2", s.isGoal ? "text-highlight" : "text-primary-glow")}>#{s.iteration}</span>
                    {s.message}
                  </li>
                ))}
                {finished && (
                  <li className="px-2 py-1.5 text-highlight">
                    Path: {result.path.map((id) => getLandmark(id).shortName).join(" → ")} ({r2(result.cost)} km)
                  </li>
                )}
              </ol>
            </Panel>
            <Panel title="Open set (priority queue by f)">
              {step.open.length === 0 ? (
                <p className="text-sm text-muted-foreground">Empty.</p>
              ) : (
                <table className="w-full text-left font-mono text-xs">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="pb-2 font-medium">Node</th>
                      <th className="pb-2 text-right font-medium">g</th>
                      <th className="pb-2 text-right font-medium">h</th>
                      <th className="pb-2 text-right font-medium">f</th>
                    </tr>
                  </thead>
                  <tbody>
                    {step.open.map((o, i) => (
                      <tr key={o.id} className={cn("border-t", i === 0 && "text-primary")}>
                        <td className="py-1.5 font-sans">{getLandmark(o.id).shortName}</td>
                        <td className="py-1.5 text-right">{r2(o.g)}</td>
                        <td className="py-1.5 text-right">{r2(o.h)}</td>
                        <td className="py-1.5 text-right font-semibold">{r2(o.f)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          </div>
        </div>
      </div>

      <Explainer
        title="Why A* finds the shortest route"
        items={[
          { term: "g(n)", text: "Road distance travelled from the start to node n along the best path found so far." },
          { term: "h(n)", text: "Heuristic estimate to the goal: the straight-line (haversine) distance in km." },
          { term: "f(n) = g(n) + h(n)", text: "Estimated total cost through n. A* always expands the open node with the lowest f." },
          { term: "Admissible", text: "A straight line is never longer than a road, so h never overestimates — the first time the goal is popped, its path is optimal." },
        ]}
      >
        <p>
          The graph has {LANDMARKS.length} nodes and {EDGES.length} undirected road links; each link's length is the
          straight-line distance multiplied by a road factor between 1.2 and 1.5. Compare the expansion count with
          Dijkstra (h = 0), which explores blindly in every direction.
        </p>
      </Explainer>
    </>
  );
}

function LandmarkSelect({
  label,
  value,
  onChange,
  exclude,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  exclude: string;
}) {
  return (
    <label className="block text-sm font-medium">
      <span className="eyebrow text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1.5 h-10 bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANDMARKS.filter((l) => l.id !== exclude).map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function Legend() {
  const items: { v: PinVariant; label: string }[] = [
    { v: "current", label: "Expanding" },
    { v: "open", label: "Open set" },
    { v: "closed", label: "Closed set" },
    { v: "path", label: "Final path" },
    { v: "muted", label: "Unvisited" },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.v} className="flex items-center gap-2">
          <span className={`map-pin map-pin--${i.v} !h-4 !w-4 !scale-100 !border`} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
