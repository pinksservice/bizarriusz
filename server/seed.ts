import "dotenv/config";
import { db } from "./db.js";
import { bizEvents, bizPinnedMessage } from "../shared/schema.js";

const SCHEDULE = [
  { dayOfWeek: 1, eventName: "Free Sex",          description: "Wejście dla wszystkich orientacji",   hoursStart: "14:00", hoursEnd: "23:00", priceRegular: 40, priceWeekend: null },
  { dayOfWeek: 2, eventName: "Sex Grupowy",        description: "Impreza grupowa",                     hoursStart: "14:00", hoursEnd: "23:00", priceRegular: 40, priceWeekend: null },
  { dayOfWeek: 3, eventName: "Naked",              description: "Impreza nagości",                     hoursStart: "12:00", hoursEnd: "23:00", priceRegular: 40, priceWeekend: null },
  { dayOfWeek: 4, eventName: "Gang Bang",          description: "Impreza grupowa",                     hoursStart: "14:00", hoursEnd: "23:00", priceRegular: 40, priceWeekend: null },
  { dayOfWeek: 5, eventName: "Sex Party",          description: "Największa impreza tygodnia. Wszystkie orientacje. Muzyka do rana.", hoursStart: "20:00", hoursEnd: "03:00", priceRegular: 70, priceWeekend: 70 },
  { dayOfWeek: 6, eventName: "Impreza Specjalna",  description: "Temat zmienia się co tydzień",        hoursStart: "20:00", hoursEnd: "03:00", priceRegular: 70, priceWeekend: 70 },
  { dayOfWeek: 0, eventName: "Darkroom LGBT",      description: "Nagi męski darkroom. Niedziela dla społeczności LGBT.", hoursStart: "14:00", hoursEnd: "23:00", priceRegular: 40, priceWeekend: null },
] as const;

async function seed() {
  console.log("Seeding biz_events…");
  for (const row of SCHEDULE) {
    await db.insert(bizEvents).values(row).onConflictDoNothing();
  }
  console.log(`  ✓ ${SCHEDULE.length} events inserted (skipped existing)`);

  console.log("Seeding biz_pinned_message…");
  const existing = await db.select().from(bizPinnedMessage).limit(1);
  if (existing.length === 0) {
    await db.insert(bizPinnedMessage).values({
      content: "Witamy w Bizarriuszu! Sprawdź repertuar i zapraszamy na dzisiejszą imprezę. 🎉",
    });
    console.log("  ✓ Pinned message created");
  } else {
    console.log("  – Pinned message already exists, skipping");
  }

  console.log("\nSeed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
