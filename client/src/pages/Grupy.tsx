import { Link } from "wouter";
import { B } from "../layout/BizLayout";

const GROUPS = [
  { icon: "💑", name: "Swing & Pary", desc: "Związki otwarte, doświadczenia, porady", count: 247 },
  { icon: "⛓️", name: "Fetysz & BDSM", desc: "Skóra, dominacja, bezpieczeństwo", count: 183 },
  { icon: "🏳️‍🌈", name: "LGBT & Darkroom", desc: "Niedziela i cały tydzień", count: 312 },
  { icon: "⚧️", name: "Trans & Non-binary", desc: "Bezpieczna, przyjazna przestrzeń", count: 94 },
  { icon: "👁️", name: "Voyeur & Cuckold", desc: "Obserwacja, pary, fantazje", count: 156 },
  { icon: "👥", name: "Gang Bang", desc: "Czwartkowe imprezy grupowe", count: 201 },
];

export default function Grupy() {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 8, color: B.ink }}>Grupy</h1>
        <p style={{ color: B.gray }}>Dołącz do grupy pasującej do Ciebie.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {GROUPS.map(({ icon, name, desc, count }) => (
          <div
            key={name}
            style={{ background: B.card, border: `1.5px solid ${B.border}`, borderRadius: 18, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = B.orange; e.currentTarget.style.transform = "translateX(4px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.transform = "translateX(0)"; }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: B.orangeSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
              {icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 3, color: B.ink }}>{name}</div>
              <div style={{ fontSize: 12, color: B.gray }}>{desc}</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: B.gray, flexShrink: 0 }}>
              <strong style={{ display: "block", fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif", fontSize: 18, fontWeight: 800, color: B.ink }}>{count}</strong>
              osób
            </div>
          </div>
        ))}
      </div>

      {/* Telegram CTA */}
      <div style={{ marginTop: 20, background: B.ink, borderRadius: 18, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 32, flexShrink: 0 }}>✈️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "white", marginBottom: 4 }}>Telegram Bizarriusz</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>Główny kanał ogłoszeń i czat społeczności.</div>
        </div>
        <a
          href="https://t.me/Bizarriuszczat"
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: "10px 18px", borderRadius: 12, background: B.orange, color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14, flexShrink: 0 }}
        >
          Dołącz
        </a>
      </div>
    </div>
  );
}
