// Knowledge base for the Smart Astana guide. Coordinates come from OpenStreetMap;
// prices and visit durations are sample values for the MVP.

export type Category = "museum" | "park" | "monument";
export type Setting = "indoor" | "outdoor" | "mixed";
export type Interest =
  | "history"
  | "architecture"
  | "nature"
  | "culture"
  | "science"
  | "shopping"
  | "photography"
  | "spirituality";

export interface Landmark {
  id: string;
  name: string;
  shortName: string;
  category: Category;
  lat: number;
  lng: number;
  /** Estimated spend per person, in KZT. */
  cost: number;
  visitHours: number;
  interests: Interest[];
  setting: Setting;
  rating: number;
  /** Popularity score, 0–100 (sample values). */
  popularity: number;
  description: string;
}

export const LANDMARKS: Landmark[] = [
  {
    id: "bayterek",
    name: "Bayterek Tower",
    shortName: "Bayterek",
    category: "monument",
    lat: 51.1283,
    lng: 71.4305,
    cost: 2000,
    visitHours: 1,
    interests: ["architecture", "photography", "history"],
    setting: "mixed",
    rating: 4.8,
    popularity: 98,
    description:
      "A 97-metre 'tree of life' holding a golden egg. The observation deck height marks 1997, the year Astana became the capital.",
  },
  {
    id: "khan-shatyr",
    name: "Khan Shatyr Entertainment Center",
    shortName: "Khan Shatyr",
    category: "monument",
    lat: 51.1325,
    lng: 71.4039,
    cost: 6000,
    visitHours: 1.5,
    interests: ["shopping", "architecture", "photography"],
    setting: "indoor",
    rating: 4.6,
    popularity: 92,
    description:
      "Norman Foster's 150-metre transparent tent, home to shops, an indoor park and a rooftop beach resort.",
  },
  {
    id: "palace-peace",
    name: "Palace of Peace and Reconciliation",
    shortName: "Pyramid",
    category: "monument",
    lat: 51.1231,
    lng: 71.4635,
    cost: 2500,
    visitHours: 1,
    interests: ["architecture", "culture", "spirituality"],
    setting: "indoor",
    rating: 4.7,
    popularity: 80,
    description:
      "A 62-metre glass pyramid built to host the Congress of Leaders of World and Traditional Religions.",
  },
  {
    id: "hazrat-sultan",
    name: "Hazrat Sultan Mosque",
    shortName: "Hazrat Sultan",
    category: "monument",
    lat: 51.1254,
    lng: 71.4721,
    cost: 0,
    visitHours: 0.75,
    interests: ["spirituality", "architecture", "culture"],
    setting: "indoor",
    rating: 4.8,
    popularity: 85,
    description:
      "One of the largest mosques in Central Asia, built in classical Islamic style with traditional Kazakh ornament.",
  },
  {
    id: "national-museum",
    name: "National Museum of Kazakhstan",
    shortName: "National Museum",
    category: "museum",
    lat: 51.1182,
    lng: 71.4694,
    cost: 1500,
    visitHours: 2,
    interests: ["history", "culture"],
    setting: "indoor",
    rating: 4.8,
    popularity: 82,
    description:
      "The largest museum in Central Asia: the Golden Man hall, ethnography and the story of independent Kazakhstan.",
  },
  {
    id: "nur-alem",
    name: "Nur Alem — Museum of Future Energy",
    shortName: "Nur Alem",
    category: "museum",
    lat: 51.0892,
    lng: 71.4162,
    cost: 3500,
    visitHours: 1.5,
    interests: ["science", "architecture", "photography"],
    setting: "indoor",
    rating: 4.7,
    popularity: 88,
    description:
      "The 100-metre glass sphere built for EXPO-2017, with eight floors on renewable and future energy.",
  },
  {
    id: "atameken",
    name: "Atameken Ethno-Memorial Complex",
    shortName: "Atameken",
    category: "museum",
    lat: 51.1493,
    lng: 71.4175,
    cost: 1000,
    visitHours: 1,
    interests: ["history", "culture", "nature"],
    setting: "outdoor",
    rating: 4.3,
    popularity: 60,
    description:
      "An open-air map of Kazakhstan in miniature, with models of landmarks from every region of the country.",
  },
  {
    id: "central-park",
    name: "Astana Central Park",
    shortName: "Central Park",
    category: "park",
    lat: 51.1549,
    lng: 71.419,
    cost: 0,
    visitHours: 1,
    interests: ["nature", "photography"],
    setting: "outdoor",
    rating: 4.5,
    popularity: 75,
    description:
      "A riverside park on the right bank of the Esil with a long promenade, lawns and a family amusement area.",
  },
  {
    id: "presidential-park",
    name: "Presidential Park",
    shortName: "Presidential Park",
    category: "park",
    lat: 51.1135,
    lng: 71.4443,
    cost: 0,
    visitHours: 1,
    interests: ["nature", "photography"],
    setting: "outdoor",
    rating: 4.6,
    popularity: 70,
    description:
      "Wide landscaped park on the left bank with lakes, walking loops and views of Ak Orda and the Pyramid.",
  },
  {
    id: "botanical-garden",
    name: "Astana Botanical Garden",
    shortName: "Botanical Garden",
    category: "park",
    lat: 51.1075,
    lng: 71.4171,
    cost: 1000,
    visitHours: 1.25,
    interests: ["nature", "science", "photography"],
    setting: "mixed",
    rating: 4.5,
    popularity: 72,
    description:
      "Gardens with more than a thousand plant species and a tropical greenhouse, a short walk from Khan Shatyr.",
  },
];

export const LANDMARK_BY_ID: Record<string, Landmark> = Object.fromEntries(
  LANDMARKS.map((l) => [l.id, l]),
);

export function getLandmark(id: string): Landmark {
  const l = LANDMARK_BY_ID[id];
  if (!l) throw new Error(`Unknown landmark: ${id}`);
  return l;
}

export const CATEGORY_LABEL: Record<Category, string> = {
  museum: "Museum",
  park: "Park",
  monument: "Monument",
};

export const SETTING_LABEL: Record<Setting, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  mixed: "Indoor + outdoor",
};

export const INTERESTS: { id: Interest; label: string }[] = [
  { id: "history", label: "History" },
  { id: "architecture", label: "Architecture" },
  { id: "nature", label: "Nature" },
  { id: "culture", label: "Culture" },
  { id: "science", label: "Science" },
  { id: "shopping", label: "Shopping" },
  { id: "photography", label: "Photography" },
  { id: "spirituality", label: "Spirituality" },
];

export const ASTANA_CENTER: [number, number] = [51.1255, 71.437];

/** Great-circle distance in kilometres. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatKzt(value: number) {
  return value === 0 ? "Free" : `${value.toLocaleString("en-US")} ₸`;
}

export function formatHours(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
