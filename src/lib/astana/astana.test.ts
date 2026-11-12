import { describe, expect, it } from "vitest";
import { generateItinerary } from "./agent";
import { aStar, dijkstra } from "./astar";
import { infer, pSuitable } from "./bayes";
import { LANDMARKS } from "./landmarks";

describe("Itinerary agent", () => {
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
