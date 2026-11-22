import { describe, expect, it } from "vitest";
import { generateItinerary, START_POINTS, travelHours } from "./agent";
import { aStar, dijkstra } from "./astar";
import { infer, pSuitable, P_WEATHER, P_SEASON, WEATHERS, SEASONS } from "./bayes";
import { LANDMARKS, type Landmark } from "./landmarks";

const fixture = (id: string, overrides: Partial<Landmark> = {}): Landmark => ({
  id, name: id, shortName: id, category: "park", lat: 51.1268, lng: 71.4262,
  cost: 1000, visitHours: 1, interests: ["nature"], setting: "outdoor",
  rating: 4.5, popularity: 50, description: "Test landmark", ...overrides,
});

describe("Itinerary agent", () => {
  const prefs = { budget: 3000, hours: 6, interests: ["nature"] as const, startId: "left-bank" };
  const run = (places: Landmark[]) => generateItinerary({ ...prefs, interests: [...prefs.interests] }, places);

  it("prefers more popular landmarks when relevance and duration are equal", () => {
    expect(run([fixture("quiet", { popularity: 20 }), fixture("popular", { popularity: 90 })]).stops[0]?.landmark.id).toBe("popular");
  });

  it("prioritizes matching interests over popularity alone", () => {
    expect(run([fixture("unrelated", { category: "monument", interests: ["shopping"], popularity: 100 }), fixture("nature", { popularity: 10 })]).stops.map(s => s.landmark.id)).toEqual(["nature"]);
  });

  it("matches a category even when explicit interest tags differ", () => {
    expect(run([fixture("park", { interests: ["photography"] })]).stops[0]?.landmark.id).toBe("park");
  });

  it("prefers shorter visits when relevance and popularity are equal", () => {
    expect(run([fixture("long", { visitHours: 2 }), fixture("short", { visitHours: 0.5 })]).stops[0]?.landmark.id).toBe("short");
  });

  it("includes travel in time totals and sums costs without duplicate stops", () => {
    const result = run([fixture("a"), fixture("b", { cost: 1500 })]);
    expect(result.totalCost).toBe(2500);
    expect(result.totalHours).toBeCloseTo(result.stops.reduce((sum, s) => sum + s.travelHours + s.landmark.visitHours, 0));
    expect(new Set(result.stops.map(s => s.landmark.id)).size).toBe(result.stops.length);
  });

  it("allows free stops with a zero budget", () => {
    const result = generateItinerary({ ...prefs, interests: [], budget: 0 }, [fixture("paid"), fixture("free", { cost: 0 })]);
    expect(result.stops.map(s => s.landmark.id)).toEqual(["free"]);
    expect(result.totalCost).toBe(0);
  });

  it("rejects visits that fit alone but not with travel", () => {
    expect(generateItinerary({ ...prefs, interests: [], hours: 1 }, [fixture("one-hour")]).stops).toEqual([]);
  });

  it("accepts a stop exactly at the budget and time limits", () => {
    const start = START_POINTS[0];
    if (!start) throw new Error("Missing test start");
    const place = fixture("exact", { cost: 3000 });
    const hours = place.visitHours + travelHours(start, place);
    const result = generateItinerary({ ...prefs, interests: [], hours }, [place]);
    expect(result.totalCost).toBe(3000);
    expect(result.totalHours).toBe(hours);
    expect(result.stops).toHaveLength(1);
  });

  it("never exceeds the user's budget", () => {
    const it = generateItinerary({ budget: 3000, hours: 10, interests: [], startId: "left-bank" });
    expect(it.totalCost).toBeLessThanOrEqual(3000);
  });

  it("never exceeds the user's available time", () => {
    const it = generateItinerary({ budget: 50000, hours: 3, interests: [], startId: "left-bank" });
    expect(it.totalHours).toBeLessThanOrEqual(3);
  });

  it("only picks landmarks matching the chosen interests", () => {
    const it = generateItinerary({ budget: 50000, hours: 10, interests: ["nature"], startId: "left-bank" });
    expect(it.stops.length).toBeGreaterThan(0);
    for (const s of it.stops) expect(s.landmark.interests).toContain("nature");
  });
});

describe("A* route planner", () => {
  it("finds the same optimal cost as Dijkstra for every landmark pair", () => {
    for (const a of LANDMARKS) {
      for (const b of LANDMARKS) {
        const r = aStar(a.id, b.id);
        expect(r.found).toBe(true);
        expect(r.cost).toBeCloseTo(dijkstra(a.id, b.id).cost, 6);
      }
    }
  });

  it("starts at the start and ends at the goal", () => {
    const r = aStar("nur-alem", "hazrat-sultan");
    expect(r.path[0]).toBe("nur-alem");
    expect(r.path.at(-1)).toBe("hazrat-sultan");
  });

  it("expands the lowest-f queued node on every step", () => {
    const result = aStar("nur-alem", "hazrat-sultan");
    expect(result.steps.length).toBeGreaterThan(1);
    for (let i = 1; i < result.steps.length; i++) {
      const previous = result.steps[i - 1];
      const current = result.steps[i];
      if (!previous || !current) throw new Error("Missing search step");
      const minimum = Math.min(...previous.open.map(node => node.f));
      expect(current.current.f).toBeCloseTo(minimum, 8);
      expect(current.closed).toContain(current.current.id);
      expect(current.open.map(node => node.id)).not.toContain(current.current.id);
    }
  });

  it("records independent trace snapshots and reconstructs the final route", () => {
    const result = aStar("nur-alem", "hazrat-sultan");
    const first = result.steps[0];
    const final = result.steps.at(-1);
    expect(first?.closed).toEqual(["nur-alem"]);
    expect(first?.updates.length).toBeGreaterThan(0);
    expect(final?.isGoal).toBe(true);
    expect(final?.current.g).toBe(result.cost);
    expect(first?.cameFrom).not.toBe(final?.cameFrom);
  });

  it("returns an exhausted search rather than a route for disconnected nodes", () => {
    const result = aStar("nur-alem", "hazrat-sultan", {});
    expect(result.found).toBe(false);
    expect(result.path).toEqual([]);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]?.open).toEqual([]);
  });
});

describe("Bayesian network", () => {
  it("produces bounded scores for all weather and season combinations and all attractions", () => {
    for (const weather of [...WEATHERS.map(w => w.id), "unknown" as const]) {
      for (const season of [...SEASONS.map(s => s.id), "unknown" as const]) {
        const result = infer({ weather, season });
        expect(result.byLandmark).toHaveLength(10);
        for (const { landmark, p } of result.byLandmark) {
          expect(p).toBeGreaterThanOrEqual(0);
          expect(p).toBeLessThanOrEqual(1);
          expect(p).toBe(result.bySetting[landmark.setting]);
        }
        expect(result.byLandmark.map(row => row.p)).toEqual(result.byLandmark.map(row => row.p).sort((a, b) => b - a));
      }
    }
  });

  it("weights unknown evidence by its prior rather than treating it as a fixed condition", () => {
    const weatherAverage = WEATHERS.reduce((sum, w) => sum + P_WEATHER[w.id] * pSuitable("outdoor", { weather: w.id, season: "summer" }), 0);
    expect(pSuitable("outdoor", { weather: "unknown", season: "summer" })).toBeCloseTo(weatherAverage, 10);
    const seasonAverage = SEASONS.reduce((sum, s) => sum + P_SEASON[s.id] * pSuitable("indoor", { weather: "unknown", season: s.id }), 0);
    expect(pSuitable("indoor", { weather: "unknown", season: "unknown" })).toBeCloseTo(seasonAverage, 10);
  });

  it("calculates snowy winter suitability with exact conditional probabilities", () => {
    const result = infer({ weather: "snowy", season: "winter" });
    expect(result.pComfort).toBeCloseTo(0.08, 10);
    expect(result.pCrowdHigh).toBeCloseTo(0.3, 10);
    expect(result.bySetting.outdoor).toBeCloseTo(0.27264, 10);
    expect(result.bySetting.indoor).toBeCloseTo(0.82864, 10);
  });

  it("computes P(suitable | sunny, summer) for outdoor places by enumeration", () => {
    // 0.9·(0.25·0.92 + 0.75·0.78) + 0.1·(0.25·0.25 + 0.75·0.15) = 0.751
    expect(pSuitable("outdoor", { weather: "sunny", season: "summer" })).toBeCloseTo(0.751, 3);
  });

  it("ranks indoor places above outdoor places on a snowy winter day", () => {
    const out = infer({ weather: "snowy", season: "winter" });
    expect(out.bySetting.indoor).toBeGreaterThan(out.bySetting.outdoor);
  });
});
