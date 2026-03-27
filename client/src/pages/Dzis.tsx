import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import { B } from "../layout/BizLayout";
import type { ShoutboxMessage } from "@shared/schema";

const DAYS = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
const SCHEDULE: Record<number, { name: string; desc: string; hours: string; price: string; ladies?: boolean }> = {
  1: { name: "Free Sex", desc: "Wejście dla wszystkich", hours: "14:00–23:00", price: "40 zł" },
  2: { name: "Sex Grupowy", desc: "Impreza grupowa", hours: "14:00–23:00", price: "40 zł" },
  3: { name: "Naked", desc: "Impreza nagości", hours: "12:00–23:00", price: "40 zł" },
  4: { name: "Gang Bang", desc: "Impreza grupowa", hours: "14:00–23:00", price: "40 zł" },
  5: { name: "Sex Party", desc: "Największa impreza tygodnia", hours: "20:00–3:00", price: "70 zł", ladies: true },
  6: { name: "Impreza Specjalna", desc: "Temat zmienia się co tydzień", hours: "20:00–3:00", price: "70 zł" },
  0: { name: "Darkroom LGBT", desc: "Nagi męski darkroom", hours: "14:00–23:00", price: "40 zł" },
};

const CHAT_TABS = ["💬 Ogólny", "💑 Swing", "🏳️‍🌈 LGBT", "⛓️ Fetysz", "📞 Recepcja"];

const SOCIALS = [
  { href: "https://t.me/Bizarriuszczat", icon: "✈️", label: "Telegram" },
  { href: "https://www.facebook.com/bizarriusz", icon: "📘", label: "Facebook" },
  { href: "https://www.instagram.com/bizarriusz", icon: "📸", label: "Instagram" },
  { href: "https://wa.me/48793012890", icon: "💬", label: "WhatsApp" },
];

function TodayCard() {
  const day = new Date().getDay();
  const event = SCHEDULE[day];
  const cols = event.ladies ? 3 : 2;
  return (
    <div style={{ background: B.orange, borderRadius: 22, padding: 22, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -30, bottom: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(0,0,0,.1)", pointerEvents: "none" }} />
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase" as const, color: "rgba(255,255,255,.75)", marginBottom: 10 }}>
        Dziś · {DAYS[day]}
      </div>
      <div style={{ fontSize: 36, fontWeight: 800, color: "white", letterSpacing: -1.5, lineHeight: 1, marginBottom: 8 }}>{event.name}</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,.75)", marginBottom: 18, lineHeight: 1.5 }}>{event.desc}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8 }}>
        <div style={{ background: "rgba(0,0,0,.15)", borderRadius: 14, padding: "12px 8px", textAlign: "center" as const }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "rgba(255,255,255,.65)", marginBottom: 5 }}>Godziny</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "white", lineHeight: 1.1 }}>{event.hours}</div>
        </div>
        <div style={{ background: "rgba(0,0,0,.15)", borderRadius: 14, padding: "12px 8px", textAlign: "center" as const }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "rgba(255,255,255,.65)", marginBottom: 5 }}>Wstęp</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "white", lineHeight: 1.1 }}>od {event.price}</div>
        </div>
        {event.ladies && (
          <div style={{ background: "rgba(52,199,89,.4)", borderRadius: 14, padding: "12px 8px", textAlign: "center" as const }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "rgba(255,255,255,.8)", marginBottom: 5 }}>Panie</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "white", lineHeight: 1.1 }}>gratis</div>
          </div>
        )}
      </div>
    </div>
  );
}

function BizChat() {
  const [tab, setTab] = useState(0);
  const [content, setContent] = useState("");
  const { isAuthenticated } = useAuth();
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<ShoutboxMessage[]>({
    queryKey: ["/api/shoutbox"],
    refetchInterval: 5000,
  });

  const send = useMutation({
    mutationFn: (text: string) => apiRequest("POST", "/api/shoutbox", { content: text }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/shoutbox"] }),
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = () => {
    const t = content.trim();
    if (!t || !isAuthenticated || tab !== 0) return;
    send.mutate(t);
    setContent("");
  };

  return (
    <div style={{ background: B.card, border: `1.5px solid ${B.border}`, borderRadius: 22, overflow: "hidden" }}>
      <div style={{ display: "flex", borderBottom: `1px solid ${B.border}`, padding: "0 12px", overflowX: "auto" as const }}>
        {CHAT_TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: tab === i ? B.orange : B.gray, cursor: "pointer", whiteSpace: "nowrap" as const, borderBottom: `2px solid ${tab === i ? B.orange : "transparent"}`, marginBottom: -1, background: "none", border: "none", borderBottom: `2px solid ${tab === i ? B.orange : "transparent"}` }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ padding: 14, display: "flex", flexDirection: "column" as const, gap: 10, minHeight: 160, maxHeight: 260, overflowY: "auto" as const }}>
        {tab === 0 ? (messages as any[]).slice(-20).map((msg: any) => (
          <div key={msg.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: B.grayLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              {(msg.username || "?")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: B.gray, marginBottom: 3 }}>{msg.username}</div>
              <div style={{ background: B.grayLight, borderRadius: "16px 16px 16px 4px", padding: "10px 14px", fontSize: 14, color: B.ink }}>{msg.content}</div>
            </div>
          </div>
        )) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: B.gray, fontSize: 13 }}>Wkrótce dostępne…</div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ borderTop: `1px solid ${B.border}`, padding: "10px 14px", display: "flex", gap: 8 }}>
        <input value={content} onChange={e => setContent(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder={isAuthenticated ? "Napisz wiadomość..." : "Zaloguj się, aby pisać"}
          disabled={!isAuthenticated || tab !== 0}
          style={{ flex: 1, background: B.grayLight, border: "none", borderRadius: 24, padding: "11px 18px", fontSize: 14, outline: "none", color: B.ink, fontFamily: "inherit" }} />
        <button onClick={handleSend} disabled={!isAuthenticated || !content.trim() || tab !== 0}
          style={{ width: 44, height: 44, borderRadius: "50%", background: B.orange, border: "none", color: "white", fontSize: 18, cursor: "pointer", flexShrink: 0, opacity: (!isAuthenticated || !content.trim()) ? 0.5 : 1 }}>
          ↑
        </button>
      </div>
    </div>
  );
}

export default function Dzis() {
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: B.ink, borderRadius: 22, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle,${B.orange} 0%,transparent 70%)`, opacity: .2, pointerEvents: "none" }} />
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: B.orange, marginBottom: 10 }}>Warszawa · Hoża 41 · Codziennie</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "white", letterSpacing: -1, lineHeight: 1 }}>Miejsce bez etykietek.</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 8 }}>Kino dla dorosłych otwarte dla wszystkich orientacji.</div>
      </div>
      <TodayCard />
      <BizChat />
      <div style={{ background: B.card, border: `1.5px solid ${B.border}`, borderRadius: 22, overflow: "hidden" }}>
        <div style={{ background: B.grayLight, height: 110, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontSize: 13, color: B.gray, fontWeight: 600 }}
          onClick={() => window.open("https://maps.google.com/?q=Hoża+41,+Warszawa", "_blank")}>
          <span style={{ fontSize: 24 }}>📍</span><span>Otwórz w Google Maps →</span>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Hoża 41, Warszawa</div>
          <div style={{ fontSize: 13, color: B.gray, marginBottom: 14 }}>Wejście od ul. Poznańskiej 16 · 50m od rogu za Piekarnią Lubaszka</div>
          <a href="tel:+48793012890" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, background: B.grayLight, borderRadius: 12, padding: "12px 16px" }}>
            <span style={{ fontSize: 20 }}>📞</span>
            <span style={{ fontWeight: 700, color: B.ink, fontSize: 15 }}>793 012 890</span>
          </a>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {SOCIALS.map(({ href, icon, label }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <div style={{ background: B.card, border: `1.5px solid ${B.border}`, borderRadius: 16, padding: "14px 6px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: B.ink }}>{label}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
