import { B } from "../layout/BizLayout";

const WEEK = [
  { short: "Pon", name: "Free Sex", desc: "Wejście dla wszystkich", hours: "14:00–23:00", price: "40 zł", day: 1 },
  { short: "Wt", name: "Sex Grupowy", desc: "Impreza grupowa", hours: "14:00–23:00", price: "40 zł", day: 2 },
  { short: "Śr", name: "Naked", desc: "Impreza nagości", hours: "12:00–23:00", price: "40 zł", day: 3 },
  { short: "Czw", name: "Gang Bang", desc: "Impreza grupowa", hours: "14:00–23:00", price: "40 zł", day: 4 },
  { short: "Pt", name: "Sex Party", desc: "Największa impreza tygodnia", hours: "20:00–3:00", price: "70 zł", highlight: true, day: 5 },
  { short: "Sb", name: "Impreza Specjalna", desc: "Temat zmienia się co tydzień", hours: "20:00–3:00", price: "70 zł", day: 6 },
  { short: "Nd", name: "Darkroom LGBT", desc: "Nagi męski darkroom", hours: "14:00–23:00", price: "40 zł", day: 0 },
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

export default function Repertuar() {
  const today = new Date().getDay();

  return (
    <div style={{ padding: 16 }}>

      {/* Week schedule */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
        {WEEK.map(({ short, name, desc, hours, price, highlight, day }) => {
          const isToday = day === today;
          const bg = highlight ? B.orange : isToday ? B.ink : B.card;
          const textColor = highlight || isToday ? "white" : B.ink;
          const mutedColor = highlight ? "rgba(255,255,255,.7)" : isToday ? "rgba(255,255,255,.6)" : B.gray;
          const priceColor = highlight ? "rgba(255,255,255,.85)" : isToday ? "rgba(255,255,255,.8)" : B.orange;

          return (
            <div
              key={day}
              style={{ background: bg, border: highlight || isToday ? "none" : `1.5px solid ${B.border}`, borderRadius: 18, padding: "16px 20px", display: "grid", gridTemplateColumns: "60px 1fr auto", alignItems: "center", gap: 12 }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: mutedColor }}>
                {short}{isToday && !highlight ? " ●" : ""}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, color: textColor }}>{name}</div>
                <div style={{ fontSize: 12, color: mutedColor }}>{desc}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{hours}</div>
                <div style={{ fontSize: 12, color: priceColor, fontWeight: 600 }}>{price}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pricing */}
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: B.ink }}>Cennik</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* Weekday */}
        <div style={{ background: B.card, border: `1.5px solid ${B.border}`, borderRadius: 22, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", fontWeight: 700, fontSize: 14, background: B.grayLight, display: "flex", alignItems: "center", gap: 8 }}>
            📅 Nd – Czw
          </div>
          {PRICE_WD.map(({ label, val, green }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "11px 20px", borderTop: `1px solid ${B.border}`, fontSize: 13 }}>
              <span style={{ color: B.ink }}>{label}</span>
              <span style={{ fontWeight: 700, color: green ? B.green : B.orange }}>{val}</span>
            </div>
          ))}
        </div>
        {/* Weekend */}
        <div style={{ background: B.card, border: `1.5px solid ${B.border}`, borderRadius: 22, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", fontWeight: 700, fontSize: 14, background: B.orange, color: "white", display: "flex", alignItems: "center", gap: 8 }}>
            🔥 Pt &amp; Sob
          </div>
          {PRICE_WE.map(({ label, val, green }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "11px 20px", borderTop: `1px solid ${B.border}`, fontSize: 13 }}>
              <span style={{ color: B.ink }}>{label}</span>
              <span style={{ fontWeight: 700, color: green ? B.green : B.orange }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div style={{ marginTop: 16, background: B.orangeSoft, borderRadius: 14, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 18 }}>ℹ️</span>
        <span style={{ fontSize: 13, color: B.ink }}>Wstęp tylko dla osób pełnoletnich. Szatnia z kluczykiem – kaucja 30 zł zwrotne.</span>
      </div>
    </div>
  );
}
