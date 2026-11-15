import { describe, expect, it } from "vitest";
import { generateItinerary, START_POINTS, travelHours } from "./agent";
import { aStar, dijkstra } from "./astar";
import { infer, pSuitable } from "./bayes";
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
});

describe("Bayesian network", () => {
  it("computes P(suitable | sunny, summer) for outdoor places by enumeration", () => {
    // 0.9·(0.25·0.92 + 0.75·0.78) + 0.1·(0.25·0.25 + 0.75·0.15) = 0.751
    expect(pSuitable("outdoor", { weather: "sunny", season: "summer" })).toBeCloseTo(0.751, 3);
  });

  it("ranks indoor places above outdoor places on a snowy winter day", () => {
    const out = infer({ weather: "snowy", season: "winter" });
    expect(out.bySetting.indoor).toBeGreaterThan(out.bySetting.outdoor);
  });
});
