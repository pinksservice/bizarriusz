import { B } from "../layout/BizLayout";

const TILES = [
  { bg: "#F0EDE8", icon: "🛋️", label: "Lounge" },
  { bg: "#EDE8F0", icon: "🚪", label: "Wejście" },
  { bg: "#E8EDF0", icon: "🛁", label: "Łazienka" },
  { bg: "#F0EDE8", icon: "🪑", label: "Bar" },
  { bg: "#EDF0E8", icon: "💡", label: "Oświetlenie" },
  { bg: "#F0E8ED", icon: "🎬", label: "Sala kinowa" },
];

export default function Galeria() {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 6, color: B.ink }}>Galeria</h1>
        <p style={{ color: B.gray, fontSize: 14 }}>Wnętrza kina. Bez zdjęć z imprez – dyskrecja to nasza zasada.</p>
      </div>

      {/* Privacy note */}
      <div style={{ background: B.orangeSoft, borderRadius: 14, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 20 }}>🔒</span>
        <span style={{ fontSize: 13, color: B.ink, fontWeight: 500 }}>
          Nie fotografujemy gości ani imprez. Twoja prywatność jest dla nas priorytetem.
        </span>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        {TILES.map(({ bg, icon, label }) => (
          <div
            key={label}
            style={{ aspectRatio: "1", borderRadius: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: bg, border: `1.5px solid ${B.border}`, cursor: "pointer", gap: 8, transition: "transform .2s" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            <span style={{ fontSize: 40 }}>{icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: B.gray }}>{label}</span>
          </div>
        ))}
      </div>

      {/* CTA to send photos */}
      <div style={{ background: B.card, border: `1.5px solid ${B.border}`, borderRadius: 18, padding: "20px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 10 }}>📷</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: B.ink }}>Chcesz zobaczyć więcej?</div>
        <div style={{ fontSize: 13, color: B.gray, marginBottom: 16 }}>Pełna galeria wnętrz dostępna po zalogowaniu.</div>
        <a
          href="/login"
          style={{ display: "inline-block", padding: "12px 28px", borderRadius: 14, background: B.ink, color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14 }}
        >
          Zaloguj się →
        </a>
      </div>
    </div>
  );
}
