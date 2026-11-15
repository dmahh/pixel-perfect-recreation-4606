// Utility-based intelligent agent that builds an itinerary from user preferences.
import { LANDMARKS, haversineKm, type Category, type Interest, type Landmark } from "./landmarks";

export interface StartPoint {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export const START_POINTS: StartPoint[] = [
  { id: "left-bank", label: "Left bank hotel (near Bayterek)", lat: 51.1268, lng: 71.4262 },
  { id: "expo", label: "EXPO district", lat: 51.0905, lng: 71.4205 },
  { id: "right-bank", label: "Right bank / old town", lat: 51.1655, lng: 71.4255 },
];

export const BUDGET_PRESETS = [
  { label: "Student", value: 3000 },
  { label: "Standard", value: 10000 },
  { label: "Comfort", value: 25000 },
];

/** Average door-to-door city speed (taxi/bus incl. waiting), km/h. */
export const CITY_SPEED_KMH = 20;
/** Road distance is longer than straight-line distance. */
export const ROAD_FACTOR = 1.3;
/** Fixed buffer per transfer, hours. */
export const TRANSFER_BUFFER_H = 5 / 60;

export interface UserPreferences {
  budget: number;
  hours: number;
  interests: Interest[];
  startId: string;
}

export interface ItineraryStop {
  landmark: Landmark;
  order: number;
  travelHours: number;
  arriveAt: number;
  leaveAt: number;
  utility: number;
  matched: Interest[];
}

export type AgentLogType = "percept" | "evaluate" | "select" | "reject" | "done";
export interface AgentLogEntry {
  type: AgentLogType;
  message: string;
}

export interface Itinerary {
  start: StartPoint;
  stops: ItineraryStop[];
  totalCost: number;
  totalHours: number;
  log: AgentLogEntry[];
}

export function travelHours(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  return (haversineKm(a, b) * ROAD_FACTOR) / CITY_SPEED_KMH + TRANSFER_BUFFER_H;
}

const CATEGORY_INTERESTS: Record<Category, Interest[]> = {
  museum: ["history", "culture", "science"],
  park: ["nature"],
  monument: ["architecture", "spirituality"],
};

/** Utility in [0, 1]: 60% interest match, 15% category match, 25% popularity. */
export function landmarkUtility(landmark: Landmark, interests: Interest[]) {
  const chosen = [...new Set(interests)];
  const matched = landmark.interests.filter((i) => chosen.includes(i));
  const match = chosen.length === 0 ? 0.5 : matched.length / Math.min(chosen.length, 3);
  const categoryMatch = chosen.length === 0 ? 0.5 : Number(CATEGORY_INTERESTS[landmark.category].some((i) => chosen.includes(i)));
  const popularity = Math.max(0, Math.min(100, landmark.popularity)) / 100;
  return { utility: 0.6 * Math.min(match, 1) + 0.15 * categoryMatch + 0.25 * popularity, matched, categoryMatch };
}

export function generateItinerary(prefs: UserPreferences, landmarks: Landmark[] = LANDMARKS): Itinerary {
  const start = START_POINTS.find((s) => s.id === prefs.startId) ?? START_POINTS[0];
  if (!start) throw new Error("No starting points configured");
  const log: AgentLogEntry[] = [];
  log.push({
    type: "percept",
    message: `Percept: budget ${prefs.budget} ₸, ${prefs.hours} h available, interests [${prefs.interests.join(", ") || "any"}], start at ${start.label}.`,
  });

  const candidates = landmarks
    .map((l) => ({ landmark: l, ...landmarkUtility(l, prefs.interests) }))
    .filter((c) => prefs.interests.length === 0 || c.matched.length > 0 || c.categoryMatch > 0);

  const skipped = landmarks.length - candidates.length;
  log.push({
    type: "evaluate",
    message: `Filtered knowledge base: ${candidates.length} landmarks match the interests${skipped ? `, ${skipped} ignored` : ""}.`,
  });

  const stops: ItineraryStop[] = [];
  const rejected = new Set<string>();
  let position: { lat: number; lng: number } = start;
  let time = 0;
  let spent = 0;

  while (true) {
    let best: { c: (typeof candidates)[number]; travel: number; value: number } | null = null;
    for (const c of candidates) {
      if (stops.some((s) => s.landmark.id === c.landmark.id)) continue;
      const travel = travelHours(position, c.landmark);
      const needed = travel + c.landmark.visitHours;
      if (spent + c.landmark.cost > prefs.budget) {
        if (!rejected.has(c.landmark.id)) {
          rejected.add(c.landmark.id);
          log.push({
            type: "reject",
            message: `Reject ${c.landmark.shortName}: costs ${c.landmark.cost} ₸, only ${prefs.budget - spent} ₸ left.`,
          });
        }
        continue;
      }
      if (time + needed > prefs.hours) {
        if (!rejected.has(c.landmark.id)) {
          rejected.add(c.landmark.id);
          log.push({
            type: "reject",
            message: `Reject ${c.landmark.shortName}: needs ${needed.toFixed(2)} h, only ${(prefs.hours - time).toFixed(2)} h left.`,
          });
        }
        continue;
      }
      // Greedy heuristic: most relevance/popularity per hour of travel and visiting.
      const value = c.utility / needed;
      if (!best || value > best.value) best = { c, travel, value };
    }
    if (!best) break;

    const arriveAt = time + best.travel;
    const leaveAt = arriveAt + best.c.landmark.visitHours;
    stops.push({
      landmark: best.c.landmark,
      order: stops.length + 1,
      travelHours: best.travel,
      arriveAt,
      leaveAt,
      utility: best.c.utility,
      matched: best.c.matched,
    });
    log.push({
      type: "select",
      message: `Act: go to ${best.c.landmark.shortName} (popularity ${best.c.landmark.popularity}/100, utility ${best.c.utility.toFixed(2)}, travel ${Math.round(best.travel * 60)} min, visit ${Math.round(best.c.landmark.visitHours * 60)} min, score ${best.value.toFixed(2)}/h).`,
    });
    time = leaveAt;
    spent += best.c.landmark.cost;
    position = best.c.landmark;
  }

  log.push({
    type: "done",
    message: stops.length
      ? `Goal reached: ${stops.length} stops, ${spent} ₸, ${time.toFixed(2)} h of ${prefs.hours} h used.`
      : "No landmark fits these constraints. Try a larger budget, more time or other interests.",
  });

  return { start, stops, totalCost: spent, totalHours: time, log };
}
