import { useState, useEffect } from "react";
import { B } from "../layout/BizLayout";
import { getBizarriuszEvents } from "../lib/extrafun";

// Opisy imprez — używane w liście eventów jako rozwijane szczegóły
const EVENT_DESCRIPTIONS: Record<string, string> = {
  "Free Sex":                 "Bez zasad, bez dress code'u, bez oczekiwań. Tydzień zaczyna się tu.",
  "Sex Grupowy":              "Więcej znaczy lepiej. Wspólna zabawa bez granic i bez wstydu.",
  "Naga Środa":               "Zostaw ubranie w szatni. Na sali liczy się tylko skóra.",
  "Czwartkowy Gang Bang":     "Dla tych, którzy lubią być w centrum uwagi. Albo ją dawać.",
  "Sex Party":                "Największa impreza tygodnia. Zaczyna się późno, kończy jeszcze później.",
  "Darkroom dla Panów":       "Ciemno. Anonimowo. Bez słów.",
  "Nagi Darkroom dla Panów":  "Ciemno, nago, bez kompromisów. Tylko dla panów, tylko na własnych zasadach.",
  "Majówka":                  "Długi weekend bez planu. Bez kontroli. Bez zbędnych pytań.",
  "Gloryhole":                "Anonimowa przyjemność, tajemnicza atmosfera i brak ograniczeń. Noc, którą zapamiętasz bez twarzy.",
  "Muzyczne Love Story":      "Największe muzyczne przeboje idealne do zabawy.",
  "Incognito Party":          "Wolisz zachować pełną anonimowość? Możesz przyjść w masce.",
  "Darkroom Party":           "Przygaszamy światła. Ciemniej jest przyjemniej.",
};

// Hardcoded special events — soboty maja 2026 + pełny kalendarz
const MAY_2026_EVENTS = [
  { id:"m1",  event_date:"2026-05-01", event_name:"Sex Party",             description:"Największa impreza tygodnia",                                                    start_time:"20:00", end_time:"03:00", price:"70 zł", featured:false },
  { id:"m2",  event_date:"2026-05-02", event_name:"Majówka",               description:"Długi weekend bez planu. Bez kontroli. Bez zbędnych pytań.",                    start_time:"20:00", end_time:"03:00", price:"70 zł", featured:true  },
  { id:"m3",  event_date:"2026-05-03", event_name:"Darkroom dla Panów",    description:"Niedziela — darkroom",                                                           start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m4",  event_date:"2026-05-04", event_name:"Free Sex",              description:"Wejście dla wszystkich",                                                         start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m5",  event_date:"2026-05-05", event_name:"Sex Grupowy",           description:"Impreza grupowa",                                                                start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m6",  event_date:"2026-05-06", event_name:"Naga Środa",            description:"Impreza nagości",                                                                start_time:"12:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m7",  event_date:"2026-05-07", event_name:"Czwartkowy Gang Bang",  description:"Impreza grupowa",                                                                start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m8",  event_date:"2026-05-08", event_name:"Sex Party",             description:"Największa impreza tygodnia",                                                    start_time:"20:00", end_time:"03:00", price:"70 zł", featured:false },
  { id:"m9",  event_date:"2026-05-09", event_name:"Gloryhole",             description:"Anonimowa przyjemność, tajemnicza atmosfera i brak ograniczeń. Noc, którą zapamiętasz bez twarzy.", start_time:"20:00", end_time:"03:00", price:"70 zł", featured:true  },
  { id:"m10", event_date:"2026-05-10", event_name:"Nagi Darkroom dla Panów", description:"2. niedziela miesiąca",                                                        start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m11", event_date:"2026-05-11", event_name:"Free Sex",              description:"Wejście dla wszystkich",                                                         start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m12", event_date:"2026-05-12", event_name:"Sex Grupowy",           description:"Impreza grupowa",                                                                start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m13", event_date:"2026-05-13", event_name:"Naga Środa",            description:"Impreza nagości",                                                                start_time:"12:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m14", event_date:"2026-05-14", event_name:"Czwartkowy Gang Bang",  description:"Impreza grupowa",                                                                start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m15", event_date:"2026-05-15", event_name:"Sex Party",             description:"Największa impreza tygodnia",                                                    start_time:"20:00", end_time:"03:00", price:"70 zł", featured:false },
  { id:"m16", event_date:"2026-05-16", event_name:"Muzyczne Love Story",   description:"Największe muzyczne przeboje idealne do zabawy.",                               start_time:"20:00", end_time:"03:00", price:"70 zł", featured:true  },
  { id:"m17", event_date:"2026-05-17", event_name:"Darkroom dla Panów",    description:"Niedziela — darkroom",                                                           start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m18", event_date:"2026-05-18", event_name:"Free Sex",              description:"Wejście dla wszystkich",                                                         start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m19", event_date:"2026-05-19", event_name:"Sex Grupowy",           description:"Impreza grupowa",                                                                start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m20", event_date:"2026-05-20", event_name:"Naga Środa",            description:"Impreza nagości",                                                                start_time:"12:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m21", event_date:"2026-05-21", event_name:"Czwartkowy Gang Bang",  description:"Impreza grupowa",                                                                start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m22", event_date:"2026-05-22", event_name:"Sex Party",             description:"Największa impreza tygodnia",                                                    start_time:"20:00", end_time:"03:00", price:"70 zł", featured:false },
  { id:"m23", event_date:"2026-05-23", event_name:"Incognito Party",       description:"Wolisz zachować pełną anonimowość? Możesz przyjść w masce.",                    start_time:"20:00", end_time:"03:00", price:"70 zł", featured:true  },
  { id:"m24", event_date:"2026-05-24", event_name:"Darkroom dla Panów",    description:"Niedziela — darkroom",                                                           start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m25", event_date:"2026-05-25", event_name:"Free Sex",              description:"Wejście dla wszystkich",                                                         start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m26", event_date:"2026-05-26", event_name:"Sex Grupowy",           description:"Impreza grupowa",                                                                start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m27", event_date:"2026-05-27", event_name:"Naga Środa",            description:"Impreza nagości",                                                                start_time:"12:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m28", event_date:"2026-05-28", event_name:"Czwartkowy Gang Bang",  description:"Impreza grupowa",                                                                start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
  { id:"m29", event_date:"2026-05-29", event_name:"Sex Party",             description:"Największa impreza tygodnia",                                                    start_time:"20:00", end_time:"03:00", price:"70 zł", featured:false },
  { id:"m30", event_date:"2026-05-30", event_name:"Darkroom Party",        description:"Przygaszamy światła. Ciemniej jest przyjemniej.",                               start_time:"20:00", end_time:"03:00", price:"70 zł", featured:true  },
  { id:"m31", event_date:"2026-05-31", event_name:"Nagi Darkroom dla Panów", description:"Ostatnia niedziela miesiąca",                                                 start_time:"14:00", end_time:"23:00", price:"40 zł", featured:false },
];

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
  const todayDow = new Date().getDay();
  const isWeekend = todayDow === 5 || todayDow === 6;
  const [events, setEvents] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    getBizarriuszEvents().then(dbEvents => {
      const today = new Date().toISOString().split("T")[0];
      const filtered = dbEvents.filter((e: any) => !e.event_date.startsWith("2026-05-"));
      const mayFuture = MAY_2026_EVENTS.filter(e => e.event_date >= today);
      const merged = [...filtered, ...mayFuture].sort((a: any, b: any) =>
        a.event_date.localeCompare(b.event_date)
      );
      setEvents(merged);
    });
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const visibleEvents = expanded ? events : events.slice(0, 7);
  const hasMore = events.length > 7;
  const [openEvent, setOpenEvent] = useState<string | null>(null);

  return (
    <div style={{ padding: 16 }}>

      {/* Nadchodzące imprezy */}
      {events.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: B.ink, marginBottom: 12 }}>📅 Nadchodzące imprezy</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visibleEvents.map(ev => {
              const isToday = ev.event_date === todayStr;
              const desc = EVENT_DESCRIPTIONS[ev.event_name];
              const isOpen = openEvent === String(ev.id);
              return (
                <div
                  key={ev.id}
                  onClick={() => desc && setOpenEvent(isOpen ? null : String(ev.id))}
                  style={{
                    background: isToday ? B.orange : B.card,
                    border: isToday ? "none" : `1.5px solid ${ev.featured ? B.orange : B.border}`,
                    borderRadius: 16,
                    padding: "14px 18px",
                    cursor: desc ? "pointer" : "default",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: isToday ? "white" : B.ink }}>{ev.event_name}</div>
                      <div style={{ fontSize: 12, color: isToday ? "rgba(255,255,255,.75)" : B.gray, marginTop: 2 }}>
                        {formatDate(ev.event_date)}
                        {ev.start_time && ` · ${ev.start_time}`}{ev.end_time && `–${ev.end_time}`}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {ev.price && (
                    <span style={{ fontWeight: 700, fontSize: 13, color: isToday ? "white" : B.orange, whiteSpace: "nowrap" }}>
                      {ev.price}
                    </span>
                  )}
                      {desc && (
                        <span style={{ fontSize: 16, color: isToday ? "rgba(255,255,255,.7)" : B.gray, transition: "transform .2s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "none" }}>›</span>
                      )}
                    </div>
                  </div>
                  {isOpen && desc && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${isToday ? "rgba(255,255,255,.2)" : B.border}`, fontSize: 13, color: isToday ? "rgba(255,255,255,.85)" : B.gray, lineHeight: 1.6 }}>
                      {desc}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {hasMore && (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                marginTop: 10, width: "100%", padding: "12px 0",
                borderRadius: 14, border: `1.5px solid ${B.border}`,
                background: "transparent", color: B.gray,
                fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {expanded ? "Zwiń ▲" : `Więcej (${events.length - 7}) ▼`}
            </button>
          )}
        </div>
      )}

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
