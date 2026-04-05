import { useState, useEffect } from "react";
import { B } from "../layout/BizLayout";
import { getBizarriuszEvents } from "../lib/extrafun";

const WEEK = [
  { short: "Pon", name: "Free Sex", desc: "Wejście dla wszystkich", hours: "14:00–23:00", price: "40 zł", day: 1 },
  { short: "Wt", name: "Sex Grupowy", desc: "Impreza grupowa", hours: "14:00–23:00", price: "40 zł", day: 2 },
  { short: "Śr", name: "Naga Środa", desc: "Impreza nagości", hours: "12:00–23:00", price: "40 zł", day: 3 },
  { short: "Czw", name: "Czwartkowy Gang Bang", desc: "Impreza grupowa", hours: "14:00–23:00", price: "40 zł", day: 4 },
  { short: "Pt", name: "Sex Party", desc: "Największa impreza tygodnia", hours: "20:00–3:00", price: "70 zł", day: 5 },
  { short: "Sb", name: "Impreza Specjalna", desc: "Temat zmienia się co tydzień", hours: "20:00–3:00", price: "70 zł", day: 6 },
  { short: "Nd", name: "Darkroom dla Panów", desc: "2. i ostatnia nd: Nagi Darkroom", hours: "14:00–23:00", price: "40 zł", day: 0 },
];

const PRICE_WD = [
  { label: "Panowie", val: "40 zł" },
  { label: "Do 27 lat", val: "30 zł" },
  { label: "Pary / Trans", val: "30 zł" },
  { label: "Panie", val: "gratis", green: true },
];
const PRICE_WE = [
  { label: "Panowie", val: "70 zł" },
  { label: "Do 27 lat", val: "60 zł" },
  { label: "Pary", val: "50 zł" },
  { label: "Panie", val: "gratis", green: true },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" });
}

export default function Repertuar() {
  const today = new Date().getDay();
  const isWeekend = today === 5 || today === 6;
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    getBizarriuszEvents().then(setEvents);
  }, []);

  return (
    <div style={{ padding: 16 }}>

      {/* Nadchodzące imprezy specjalne */}
      {events.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: B.ink, marginBottom: 12 }}>📅 Nadchodzące imprezy</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events.map(ev => {
              const isToday = ev.event_date === new Date().toISOString().split("T")[0];
              return (
                <div
                  key={ev.id}
                  style={{
                    background: isToday ? B.orange : B.card,
                    border: isToday ? "none" : `1.5px solid ${ev.featured ? B.orange : B.border}`,
                    borderRadius: 16,
                    padding: "14px 18px",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: isToday ? "white" : B.ink }}>{ev.event_name}</div>
                    <div style={{ fontSize: 12, color: isToday ? "rgba(255,255,255,.75)" : B.gray, marginTop: 2 }}>
                      {formatDate(ev.event_date)}
                      {ev.start_time && ` · ${ev.start_time}`}{ev.end_time && `–${ev.end_time}`}
                    </div>
                  </div>
                  {ev.price && (
                    <span style={{ fontWeight: 700, fontSize: 13, color: isToday ? "white" : B.orange, whiteSpace: "nowrap" }}>
                      {ev.price}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tygodniowy rozkład */}
      <h2 style={{ fontSize: 18, fontWeight: 800, color: B.ink, marginBottom: 12 }}>🗓️ Rozkład tygodniowy</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
        {WEEK.map(({ short, name, desc, hours, price, day }) => {
          const isToday = day === today;
          return (
            <div
              key={day}
              style={{ background: isToday ? B.orange : B.card, border: isToday ? "none" : `1.5px solid ${B.border}`, borderRadius: 18, padding: "16px 20px", display: "grid", gridTemplateColumns: "60px 1fr auto", alignItems: "center", gap: 12 }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: isToday ? "rgba(255,255,255,.7)" : B.gray }}>
                {short}{isToday ? " ●" : ""}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, color: isToday ? "white" : B.ink }}>{name}</div>
                <div style={{ fontSize: 12, color: isToday ? "rgba(255,255,255,.7)" : B.gray }}>{desc}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isToday ? "white" : B.ink }}>{hours}</div>
                <div style={{ fontSize: 12, color: isToday ? "rgba(255,255,255,.85)" : B.orange, fontWeight: 600 }}>{price}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cennik */}
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: B.ink }}>Cennik</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: B.card, border: `1.5px solid ${isWeekend ? B.border : B.orange}`, borderRadius: 22, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", fontWeight: 700, fontSize: 14, background: isWeekend ? B.grayLight : B.orange, color: isWeekend ? B.ink : "white" }}>
            Niedziela – Czwartek
          </div>
          {PRICE_WD.map(({ label, val, green }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "11px 20px", borderTop: `1px solid ${B.border}`, fontSize: 13 }}>
              <span style={{ color: B.ink }}>{label}</span>
              <span style={{ fontWeight: 700, color: green ? B.green : B.orange }}>{val}</span>
            </div>
          ))}
        </div>
        <div style={{ background: B.card, border: `1.5px solid ${isWeekend ? B.orange : B.border}`, borderRadius: 22, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", fontWeight: 700, fontSize: 14, background: isWeekend ? B.orange : B.grayLight, color: isWeekend ? "white" : B.ink }}>
            Piątek i Sobota
          </div>
          {PRICE_WE.map(({ label, val, green }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "11px 20px", borderTop: `1px solid ${B.border}`, fontSize: 13 }}>
              <span style={{ color: B.ink }}>{label}</span>
              <span style={{ fontWeight: 700, color: green ? B.green : B.orange }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, background: B.orangeSoft, borderRadius: 14, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 18 }}>ℹ️</span>
        <span style={{ fontSize: 13, color: B.ink }}>Wstęp tylko dla osób pełnoletnich. Szatnia z kluczykiem – kaucja 30 zł zwrotne.</span>
      </div>
    </div>
  );
}
