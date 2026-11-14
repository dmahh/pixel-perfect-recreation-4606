import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Footprints, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MapView } from "@/components/map/MapView";
import type { MapLine, MapMarker } from "@/components/map/map-types";
import { CategoryDot, Chip, Explainer, PageHeader, Panel, Stat } from "@/components/site/kit";
import {
  BUDGET_PRESETS,
  START_POINTS,
  generateItinerary,
  type UserPreferences,
} from "@/lib/astana/agent";
import {
  CATEGORY_LABEL,
  INTERESTS,
  LANDMARKS,
  formatHours,
  formatKzt,
  type Interest,
} from "@/lib/astana/landmarks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/itinerary")({
  head: () => ({
    meta: [
      { title: "Itinerary Agent — Smart Astana" },
      {
        name: "description",
        content:
          "Enter your budget, time and interests and a utility-based AI agent builds a custom Astana itinerary on the map.",
      },
      { property: "og:title", content: "Itinerary Agent — Smart Astana" },
      {
        property: "og:description",
        content: "A utility-based intelligent agent plans your day across Astana's landmarks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ItineraryPage,
});

const DEFAULT_PREFS: UserPreferences = {
  budget: 10000,
  hours: 6,
  interests: ["architecture", "history"],
  startId: "left-bank",
};

function ItineraryPage() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [result, setResult] = useState(() => generateItinerary(DEFAULT_PREFS));
  const [runId, setRunId] = useState(0);

  const toggleInterest = (id: Interest) =>
    setPrefs((p) => ({
      ...p,
      interests: p.interests.includes(id) ? p.interests.filter((i) => i !== id) : [...p.interests, id],
    }));

  const run = () => {
    setResult(generateItinerary(prefs));
    setRunId((n) => n + 1);
  };

  const { markers, lines } = useMemo(() => {
    const stopIds = new Set(result.stops.map((s) => s.landmark.id));
    const markers: MapMarker[] = [
      { id: "start", lat: result.start.lat, lng: result.start.lng, label: `Start · ${result.start.label}`, variant: "start", text: "S" },
      ...LANDMARKS.filter((l) => !stopIds.has(l.id)).map<MapMarker>((l) => ({
        id: l.id,
        lat: l.lat,
        lng: l.lng,
        label: l.name,
        variant: "muted",
      })),
      ...result.stops.map<MapMarker>((s) => ({
        id: s.landmark.id,
        lat: s.landmark.lat,
        lng: s.landmark.lng,
        label: `${s.order}. ${s.landmark.name}`,
        variant: "stop",
        text: String(s.order),
      })),
    ];
    const lines: MapLine[] = result.stops.length
      ? [
          {
            id: "route",
            variant: "walk",
            points: [
              [result.start.lat, result.start.lng],
              ...result.stops.map((s) => [s.landmark.lat, s.landmark.lng] as [number, number]),
            ],
          },
        ]
      : [];
    return { markers, lines };
  }, [result]);

  return (
    <>
      <PageHeader code="01" concept="Intelligent agent" title="Your Astana day, planned by a rational agent">
        Set your constraints. The agent scores every landmark, rejects what doesn't fit, and picks the
        best next stop until your time or budget runs out.
      </PageHeader>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[360px_1fr]">
        <Panel title="Your preferences" className="h-fit lg:sticky lg:top-24">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium"><Wallet className="h-4 w-4 text-primary" /> Budget</span>
                <span className="font-mono text-primary">{prefs.budget.toLocaleString("en-US")} ₸</span>
              </div>
              <Slider
                className="mt-3"
                min={0}
                max={30000}
                step={500}
                value={[prefs.budget]}
                onValueChange={([v]) => setPrefs((p) => ({ ...p, budget: v ?? p.budget }))}
                aria-label="Budget in tenge"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {BUDGET_PRESETS.map((b) => (
                  <Chip key={b.label} active={prefs.budget === b.value} onClick={() => setPrefs((p) => ({ ...p, budget: b.value }))}>
                    {b.label} · {b.value.toLocaleString("en-US")}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium"><Clock className="h-4 w-4 text-primary" /> Available time</span>
                <span className="font-mono text-primary">{formatHours(prefs.hours)}</span>
              </div>
              <Slider
                className="mt-3"
                min={1}
                max={12}
                step={0.5}
                value={[prefs.hours]}
                onValueChange={([v]) => setPrefs((p) => ({ ...p, hours: v ?? p.hours }))}
                aria-label="Available hours"
              />
            </div>

            <div>
              <p className="flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-primary" /> Interests</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <Chip key={i.id} active={prefs.interests.includes(i.id)} onClick={() => toggleInterest(i.id)}>
                    {i.label}
                  </Chip>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">None selected = the agent considers everything.</p>
            </div>

            <div>
              <p className="flex items-center gap-2 text-sm font-medium"><Footprints className="h-4 w-4 text-primary" /> Starting point</p>
              <div className="mt-3 grid gap-2">
                {START_POINTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, startId: s.id }))}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      prefs.startId === s.id ? "border-primary bg-accent text-accent-foreground" : "bg-card hover:border-primary/40",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="hero" size="lg" className="w-full" onClick={run}>
              <Sparkles /> Generate itinerary
            </Button>
          </div>
        </Panel>

        <div className="min-w-0 space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Stops" value={result.stops.length} />
            <Stat label="Spend" value={formatKzt(result.totalCost)} hint={`of ${prefs.budget.toLocaleString("en-US")} ₸`} />
            <Stat label="Time used" value={formatHours(result.totalHours)} />
            <Stat label="Avg utility" value={result.stops.length ? (result.stops.reduce((s, x) => s + x.utility, 0) / result.stops.length).toFixed(2) : "—"} />
          </div>

          <MapView className="h-[340px] sm:h-[440px]" markers={markers} lines={lines} fitKey={`run-${runId}`} />

          <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <Panel title="Generated itinerary">
              {result.stops.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Nothing fits yet — try a bigger budget, more time or broader interests.
                </p>
              ) : (
                <ol className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
                  {result.stops.map((s) => (
                    <li key={s.landmark.id} className="relative flex gap-4">
                      <span className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground">
                        {s.order}
                      </span>
                      <div className="min-w-0 flex-1 rounded-lg border bg-card p-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-semibold">{s.landmark.name}</p>
                          <span className="font-mono text-xs text-muted-foreground">
                            +{formatHours(s.arriveAt)} → +{formatHours(s.leaveAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{s.landmark.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5"><CategoryDot category={s.landmark.category} />{CATEGORY_LABEL[s.landmark.category]}</span>
                          <span>{formatKzt(s.landmark.cost)}</span>
                          <span>{Math.round(s.travelHours * 60)} min travel</span>
                          {s.matched.length > 0 && <span className="text-primary">matches {s.matched.join(", ")}</span>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>

            <Panel title="Agent reasoning log">
              <ol className="max-h-[420px] space-y-1.5 overflow-y-auto rounded-lg bg-navy p-3 font-mono text-[0.72rem] leading-relaxed">
                {result.log.map((e, i) => (
                  <li key={i} className="flex gap-2">
                    <span
                      className={cn(
                        "shrink-0 uppercase",
                        e.type === "select" && "text-primary-glow",
                        e.type === "reject" && "text-destructive",
                        e.type === "done" && "text-highlight",
                        (e.type === "percept" || e.type === "evaluate") && "text-navy-muted",
                      )}
                    >
                      [{e.type}]
                    </span>
                    <span className="text-navy-foreground">{e.message}</span>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>
        </div>
      </div>

      <Explainer
        title="How the itinerary agent thinks"
        items={[
          { term: "Performance", text: "Maximise total utility of visited landmarks without breaking the budget or time limit." },
          { term: "Environment", text: "Ten Astana landmarks with location, price, visit duration, rating and interest tags." },
          { term: "Actuators", text: "Choose the next landmark to visit and append it to the plan." },
          { term: "Sensors", text: "Your budget, available hours, interests and starting point." },
        ]}
      >
        <p>
          This is a <strong className="text-navy-foreground">utility-based agent</strong> with a greedy policy. Each landmark gets
          utility U = 0.7 · interest match + 0.3 · rating score. At every step the agent only considers actions that keep spend ≤
          budget and time ≤ available hours (travel at {"~"}20 km/h × 1.3 road factor + 5 min), then picks the one maximising
          U − 0.25 · travel hours. It stops when no feasible action remains.
        </p>
      </Explainer>
    </>
  );
}
