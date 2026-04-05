import { createClient } from "@supabase/supabase-js";

// Klient do bazy extrafun.fun — imprezy Bizarriusza
const EXTRAFUN_URL = "https://lvxaycjuhchoqhnttyjj.supabase.co";
const EXTRAFUN_KEY = "sb_publishable_eHi0JKQO03lOIeBnISOKFw_qYpq2Tr0";

export const extrafun = createClient(EXTRAFUN_URL, EXTRAFUN_KEY);

export async function getBizarriuszEvents() {
  const today = new Date().toISOString().split("T")[0];
  const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const { data: venue } = await extrafun
    .from("swingers_venues")
    .select("id")
    .eq("name", "Bizarriusz")
    .single();

  if (!venue) return [];

  const { data } = await extrafun
    .from("venue_events")
    .select("*")
    .eq("venue_id", venue.id)
    .gte("event_date", today)
    .lte("event_date", in30days)
    .order("event_date", { ascending: true });

  return data || [];
}
