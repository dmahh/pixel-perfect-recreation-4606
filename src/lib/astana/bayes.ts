// Bayesian network for attraction suitability, solved by exact inference (enumeration).
//
//   Weather ──┐
//             ├──► Comfort ──┐
//   Season ───┤              ├──► Suitable  (also conditioned on the landmark's Setting)
//             └──► Crowd ────┘
import { LANDMARKS, type Category, type Landmark, type Setting } from "./landmarks";

export type Weather = "sunny" | "cloudy" | "rainy" | "snowy";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type Evidence<T> = T | "unknown";

export const WEATHERS: { id: Weather; label: string }[] = [
  { id: "sunny", label: "Sunny" },
  { id: "cloudy", label: "Cloudy" },
  { id: "rainy", label: "Rainy" },
  { id: "snowy", label: "Snowy" },
];

export const SEASONS: { id: Season; label: string }[] = [
  { id: "spring", label: "Spring" },
  { id: "summer", label: "Summer" },
  { id: "autumn", label: "Autumn" },
  { id: "winter", label: "Winter" },
];

/** Prior P(Weather) for Astana across the year. */
export const P_WEATHER: Record<Weather, number> = { sunny: 0.45, cloudy: 0.3, rainy: 0.12, snowy: 0.13 };
export const P_SEASON: Record<Season, number> = { spring: 0.25, summer: 0.25, autumn: 0.25, winter: 0.25 };

/** P(Comfort = yes | Weather, Season). Astana winters average around −15 °C. */
export const P_COMFORT: Record<Season, Record<Weather, number>> = {
  spring: { sunny: 0.7, cloudy: 0.55, rainy: 0.3, snowy: 0.15 },
  summer: { sunny: 0.9, cloudy: 0.85, rainy: 0.45, snowy: 0.2 },
  autumn: { sunny: 0.6, cloudy: 0.45, rainy: 0.2, snowy: 0.1 },
  winter: { sunny: 0.25, cloudy: 0.15, rainy: 0.1, snowy: 0.08 },
};

/** P(Crowd = high | Season). */
export const P_CROWD_HIGH: Record<Season, number> = { spring: 0.45, summer: 0.75, autumn: 0.4, winter: 0.3 };

type Key = "comfort_low" | "comfort_high" | "uncomfortable_low" | "uncomfortable_high";
/** P(Suitable = yes | Comfort, Crowd, Setting). */
export const P_SUITABLE: Record<Setting, Record<Key, number>> = {
  outdoor: { comfort_low: 0.92, comfort_high: 0.78, uncomfortable_low: 0.25, uncomfortable_high: 0.15 },
  indoor: { comfort_low: 0.85, comfort_high: 0.65, uncomfortable_low: 0.88, uncomfortable_high: 0.72 },
  mixed: { comfort_low: 0.9, comfort_high: 0.72, uncomfortable_low: 0.55, uncomfortable_high: 0.42 },
};

export interface BayesianInput {
  weather: Evidence<Weather>;
  season: Evidence<Season>;
}

export interface BayesianOutput {
  pComfort: number;
  pCrowdHigh: number;
  bySetting: Record<Setting, number>;
  byCategory: Record<Category, number>;
  byLandmark: { landmark: Landmark; p: number }[];
}

function posterior<T extends string>(prior: Record<T, number>, e: Evidence<T>): [T, number][] {
  return e === "unknown" ? (Object.entries(prior) as [T, number][]) : [[e, 1]];
}

/** P(Suitable | evidence) for one setting, summing out Weather, Season, Comfort, Crowd. */
export function pSuitable(setting: Setting, input: BayesianInput) {
  let total = 0;
  for (const [w, pw] of posterior(P_WEATHER, input.weather)) {
    for (const [s, ps] of posterior(P_SEASON, input.season)) {
      const pc = P_COMFORT[s][w];
      const pr = P_CROWD_HIGH[s];
      const t = P_SUITABLE[setting];
      const inner =
        pc * (1 - pr) * t.comfort_low +
        pc * pr * t.comfort_high +
        (1 - pc) * (1 - pr) * t.uncomfortable_low +
        (1 - pc) * pr * t.uncomfortable_high;
      total += pw * ps * inner;
    }
  }
  return total;
}

export function infer(input: BayesianInput, landmarks: Landmark[] = LANDMARKS): BayesianOutput {
  let pComfort = 0;
  let pCrowdHigh = 0;
  for (const [w, pw] of posterior(P_WEATHER, input.weather)) {
    for (const [s, ps] of posterior(P_SEASON, input.season)) {
      pComfort += pw * ps * P_COMFORT[s][w];
      pCrowdHigh += pw * ps * P_CROWD_HIGH[s];
    }
  }
  const bySetting = {
    indoor: pSuitable("indoor", input),
    outdoor: pSuitable("outdoor", input),
    mixed: pSuitable("mixed", input),
  };
  const byLandmark = landmarks
    .map((landmark) => ({ landmark, p: bySetting[landmark.setting] }))
    .sort((a, b) => b.p - a.p || b.landmark.rating - a.landmark.rating);
  const avg = (c: Category) => {
    const items = byLandmark.filter((x) => x.landmark.category === c);
    return items.reduce((s, x) => s + x.p, 0) / Math.max(items.length, 1);
  };
  return {
    pComfort,
    pCrowdHigh,
    bySetting,
    byCategory: { museum: avg("museum"), park: avg("park"), monument: avg("monument") },
    byLandmark,
  };
}
