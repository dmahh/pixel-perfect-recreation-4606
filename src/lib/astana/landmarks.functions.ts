import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { LANDMARKS, type Category, type Interest, type Landmark, type Setting } from "./landmarks";

/** Public read of the landmark knowledge base from Lovable Cloud; falls back to bundled data. */
export const listLandmarks = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ landmarks: Landmark[]; source: "cloud" | "fallback" }> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return { landmarks: LANDMARKS, source: "fallback" };
    const sb = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data, error } = await sb.from("landmarks").select("*").order("sort_order");
    if (error || !data?.length) {
      console.error("listLandmarks failed", error);
      return { landmarks: LANDMARKS, source: "fallback" };
    }
    return {
      source: "cloud",
      landmarks: data.map((r) => ({
        id: r.id,
        name: r.name,
        shortName: r.short_name,
        category: r.category as Category,
        lat: r.lat,
        lng: r.lng,
        cost: r.cost,
        visitHours: Number(r.visit_hours),
        interests: r.interests as Interest[],
        setting: r.setting as Setting,
        rating: Number(r.rating),
        popularity: r.popularity,
        description: r.description,
      })),
    };
  },
);

export const landmarksQueryOptions = () =>
  queryOptions({ queryKey: ["landmarks"], queryFn: () => listLandmarks(), staleTime: 5 * 60_000 });
