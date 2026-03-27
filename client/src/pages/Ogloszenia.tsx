import { useState } from "react";
import { useAds } from "../hooks/use-ads";
import { useAuth } from "../hooks/use-auth";
import { B } from "../layout/BizLayout";

const FILTERS = [
  { id: "all", label: "🔍 Szukam" },
  { id: "Swing", label: "💑 Swing" },
  { id: "BDSM", label: "⛓️ BDSM" },
  { id: "LGBT", label: "🏳️‍🌈 LGBT" },
  { id: "Inne", label: "💬 Inne" },
];

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "przed chwilą";
  if (h < 24) return `${h} godz. temu`;
  return `${Math.floor(h / 24)} dni temu`;
}

export default function Ogloszenia() {
  const [filter, setFilter] = useState("all");
  const { isAuthenticated } = useAuth();
  const { data: ads = [], isLoading } = useAds({ category: filter === "all" ? undefined : filter });

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 8, color: B.ink }}>Ogłoszenia</h1>
        <p style={{ color: B.gray }}>Szukasz kogoś? Tu jest najlepsze miejsce.</p>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, overflowX: "auto", paddingBottom: 4 }}>
        {FILTERS.map(({ id, label }) => (
          <button key={id} onClick={() => setFilter(id)}
            style={{ padding: "9px 16px", borderRadius: 24, border: `1.5px solid ${filter === id ? B.ink : B.border}`, background: filter === id ? B.ink : B.card, fontSize: 13, fontWeight: 600, color: filter === id ? "white" : B.gray, whiteSpace: "nowrap", cursor: "pointer", transition: "all .2s", fontFamily: "inherit" }}>
            {label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ background: B.grayLight, borderRadius: 20, height: 120 }} />)}
        </div>
      ) : (ads as any[]).length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: B.gray }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Brak ogłoszeń w tej kategorii</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(ads as any[]).map((ad: any) => (
            <div key={ad.id}
              style={{ background: B.card, border: `1.5px solid ${B.border}`, borderRadius: 20, padding: 20, cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = B.orange; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {ad.category && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 8, background: B.orangeSoft, color: B.orange }}>{ad.category}</span>}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, letterSpacing: -0.3, color: B.ink }}>{ad.title}</div>
              <div style={{ fontSize: 13, color: B.gray, lineHeight: 1.6, marginBottom: 10 }}>{ad.description?.slice(0, 120)}{ad.description?.length > 120 ? "…" : ""}</div>
              <div style={{ fontSize: 11, color: B.gray, marginBottom: 14 }}>
                {ad.location && `📍 ${ad.location} · `}⏰ {timeAgo(ad.createdAt)}
              </div>
              {isAuthenticated ? (
                <button style={{ width: "100%", padding: 12, borderRadius: 12, background: B.ink, color: "white", border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  ✉️ Napisz wiadomość
                </button>
              ) : (
                <a href="/login" style={{ display: "block", textDecoration: "none" }}>
                  <button style={{ width: "100%", padding: 12, borderRadius: 12, background: B.grayLight, color: B.gray, border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    Zaloguj się, aby napisać
                  </button>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
