// Per-browser saved preferences in Lovable Cloud, keyed by a random device token.
import { supabase } from "@/integrations/supabase/client";
import type { UserPreferences } from "./agent";
import { INTERESTS, type Interest } from "./landmarks";

const TOKEN_KEY = "smart-astana-device-token";

/** Call only in the browser (effects / handlers). */
export function getDeviceToken(): string {
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t || t.length < 32) {
    t = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
}

const VALID = new Set(INTERESTS.map((i) => i.id));

export async function loadPreferences(): Promise<UserPreferences | null> {
  const { data, error } = await supabase.rpc("get_tourist_preferences", { _device_token: getDeviceToken() });
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return {
    budget: row.budget,
    hours: Number(row.hours),
    interests: row.interests.filter((i): i is Interest => VALID.has(i as Interest)),
    startId: row.start_id,
  };
}

export async function savePreferences(p: UserPreferences) {
  const { error } = await supabase.rpc("save_tourist_preferences", {
    _device_token: getDeviceToken(),
    _budget: Math.round(p.budget),
    _hours: p.hours,
    _interests: p.interests,
    _start_id: p.startId,
  });
  if (error) throw error;
}
