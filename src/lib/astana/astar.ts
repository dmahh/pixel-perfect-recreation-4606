// A* search over a road graph connecting the Astana landmarks.
import { getLandmark, haversineKm } from "./landmarks";

export interface Edge {
  from: string;
  to: string;
  km: number;
}

/** Undirected road links; factor = how much longer the road is than a straight line. */
const LINKS: [string, string, number][] = [
  ["khan-shatyr", "bayterek", 1.25],
  ["khan-shatyr", "atameken", 1.35],
  ["khan-shatyr", "central-park", 1.4],
  ["khan-shatyr", "botanical-garden", 1.3],
  ["atameken", "central-park", 1.2],
  ["central-park", "bayterek", 1.45],
  ["bayterek", "presidential-park", 1.3],
  ["bayterek", "botanical-garden", 1.3],
  ["bayterek", "palace-peace", 1.5],
  ["botanical-garden", "nur-alem", 1.25],
  ["presidential-park", "nur-alem", 1.35],
  ["presidential-park", "palace-peace", 1.2],
  ["palace-peace", "national-museum", 1.25],
  ["palace-peace", "hazrat-sultan", 1.2],
  ["national-museum", "hazrat-sultan", 1.2],
];

export const EDGES: Edge[] = LINKS.map(([from, to, factor]) => ({
  from,
  to,
  km: Math.round(haversineKm(getLandmark(from), getLandmark(to)) * factor * 100) / 100,
}));

export type Graph = Record<string, { to: string; km: number }[]>;

export function buildGraph(edges: Edge[] = EDGES): Graph {
  const g: Graph = {};
  for (const e of edges) {
    (g[e.from] ??= []).push({ to: e.to, km: e.km });
    (g[e.to] ??= []).push({ to: e.from, km: e.km });
  }
  return g;
}

export const ROAD_GRAPH = buildGraph();

/** Admissible heuristic: straight-line distance never exceeds road distance. */
export function heuristic(a: string, b: string) {
  return haversineKm(getLandmark(a), getLandmark(b));
}

export interface OpenEntry {
  id: string;
  g: number;
  h: number;
  f: number;
}

export interface AStarStep {
  iteration: number;
  current: OpenEntry;
  open: OpenEntry[];
  closed: string[];
  updates: { id: string; g: number; h: number; f: number; status: "new" | "improved" | "skipped" }[];
  cameFrom: Record<string, string>;
  message: string;
  isGoal: boolean;
}

export interface AStarResult {
  found: boolean;
  path: string[];
  cost: number;
  steps: AStarStep[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function aStar(start: string, goal: string, graph: Graph = ROAD_GRAPH): AStarResult {
  const g: Record<string, number> = { [start]: 0 };
  const cameFrom: Record<string, string> = {};
  const open = new Map<string, OpenEntry>();
  const closed = new Set<string>();
  const h0 = heuristic(start, goal);
  open.set(start, { id: start, g: 0, h: h0, f: h0 });
  const steps: AStarStep[] = [];

  while (open.size > 0) {
    const current = [...open.values()].sort((a, b) => a.f - b.f || a.h - b.h)[0]!;
    open.delete(current.id);
    closed.add(current.id);
    const name = getLandmark(current.id).shortName;

    if (current.id === goal) {
      steps.push({
        iteration: steps.length + 1,
        current,
        open: [...open.values()].sort((a, b) => a.f - b.f),
        closed: [...closed],
        updates: [],
        cameFrom: { ...cameFrom },
        message: `Pop ${name} (f=${r2(current.f)}). Goal reached — reconstruct path through cameFrom.`,
        isGoal: true,
      });
      return { found: true, path: partialPath(cameFrom, goal, start), cost: current.g, steps };
    }

    const updates: AStarStep["updates"] = [];
    for (const { to, km } of graph[current.id] ?? []) {
      if (closed.has(to)) continue;
      const tentative = current.g + km;
      const h = heuristic(to, goal);
      const known = g[to];
      if (known === undefined || tentative < known - 1e-9) {
        const status = known === undefined ? "new" : "improved";
        g[to] = tentative;
        cameFrom[to] = current.id;
        open.set(to, { id: to, g: tentative, h, f: tentative + h });
        updates.push({ id: to, g: tentative, h, f: tentative + h, status });
      } else {
        updates.push({ id: to, g: tentative, h, f: tentative + h, status: "skipped" });
      }
    }

    const summary = updates
      .map((u) => `${getLandmark(u.id).shortName} ${u.status === "skipped" ? "kept (no better g)" : `${u.status} f=${r2(u.f)}`}`)
      .join("; ");
    steps.push({
      iteration: steps.length + 1,
      current,
      open: [...open.values()].sort((a, b) => a.f - b.f),
      closed: [...closed],
      updates,
      cameFrom: { ...cameFrom },
      message: `Pop ${name} (g=${r2(current.g)}, h=${r2(current.h)}, f=${r2(current.f)}). ${summary || "No unexplored neighbours."}`,
      isGoal: false,
    });
  }

  return { found: false, path: [], cost: Infinity, steps };
}

/** Reference uniform-cost search (Dijkstra) used to check A* optimality. */
export function dijkstra(start: string, goal: string, graph: Graph = ROAD_GRAPH) {
  const dist: Record<string, number> = { [start]: 0 };
  const done = new Set<string>();
  let expanded = 0;
  while (true) {
    const next = Object.keys(dist)
      .filter((k) => !done.has(k))
      .sort((a, b) => (dist[a] ?? Infinity) - (dist[b] ?? Infinity))[0];
    if (next === undefined) return { cost: Infinity, expanded };
    done.add(next);
    expanded++;
    const d = dist[next] ?? Infinity;
    if (next === goal) return { cost: d, expanded };
    for (const { to, km } of graph[next] ?? []) {
      const known = dist[to];
      if (known === undefined || d + km < known) dist[to] = d + km;
    }
  }
}

/** Path implied by a partial cameFrom map, for drawing the current best route. */
export function partialPath(cameFrom: Record<string, string>, node: string, start: string) {
  const path = [node];
  let guard = 0;
  let prev = cameFrom[node];
  while (path[0] !== start && prev && guard++ < 50) {
    path.unshift(prev);
    prev = cameFrom[prev];
  }
  return path;
}
