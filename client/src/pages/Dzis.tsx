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
  {
    href: "https://t.me/Bizarriuszczat",
    label: "Telegram",
    bg: "#229ED9",
    svg: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z"/>
      </svg>
    ),
  },
  {
    href: "https://www.facebook.com/bizarriusz",
    label: "Facebook",
    bg: "#1877F2",
    svg: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
        <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.532-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
    ),
  },
  {
    href: "https://www.instagram.com/bizarriusz",
    label: "Instagram",
    bg: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
    svg: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    href: "https://wa.me/48793012890",
    label: "WhatsApp",
    bg: "#25D366",
    svg: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
  },
];

function TodayCard() {
  const day = new Date().getDay();
  const event = SCHEDULE[day];
  const cols = event.ladies ? 3 : 2;
  return (
    <div style={{ background: B.orange, borderRadius: 22, padding: 22, position: "relative", overflow: "hidden" }}>
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
          <div style={{ fontSize: 15, fontWeight: 800, color: "white", lineHeight: 1.1 }}>{event.price}</div>
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
  const [sendError, setSendError] = useState("");
  const { isAuthenticated, isAdmin } = useAuth();
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<ShoutboxMessage[]>({
    queryKey: ["/api/shoutbox"],
    refetchInterval: 3000,
    staleTime: 0,
  });

  const send = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/shoutbox", { content: text });
      return res.json();
    },
    onSuccess: (newMsg) => {
      queryClient.setQueryData<ShoutboxMessage[]>(["/api/shoutbox"], (old = []) => [...old, newMsg]);
      setSendError("");
    },
    onError: (err: any) => setSendError(err.message || "Błąd wysyłania"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/shoutbox/${id}`);
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<ShoutboxMessage[]>(["/api/shoutbox"], (old = []) => old.filter(m => m.id !== id));
    },
  });

  const pinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: number; pinned: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/shoutbox/${id}/pin`, { pinned });
      return res.json();
    },
    onSuccess: (_, { id, pinned }) => {
      queryClient.setQueryData<ShoutboxMessage[]>(["/api/shoutbox"], (old = []) =>
        old.map(m => ({ ...m, isPinned: pinned ? m.id === id : false }))
      );
    },
  });

  const prevLengthRef = useRef(0);
  useEffect(() => {
    const len = messages.length;
    if (prevLengthRef.current > 0 && len > prevLengthRef.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLengthRef.current = len;
  }, [messages]);

  const handleSend = () => {
    const t = content.trim();
    if (!t || !isAuthenticated || tab !== 0) return;
    send.mutate(t);
    setContent("");
  };

  const pinned = messages.find(m => m.isPinned);

  return (
    <div style={{ background: B.card, border: `1.5px solid ${B.border}`, borderRadius: 22, overflow: "hidden" }}>
      <div style={{ display: "flex", borderBottom: `1px solid ${B.border}`, padding: "0 12px", overflowX: "auto" as const }}>
        {CHAT_TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: tab === i ? B.orange : B.gray, cursor: "pointer", whiteSpace: "nowrap" as const, background: "none", border: "none", borderBottom: `2px solid ${tab === i ? B.orange : "transparent"}`, marginBottom: -1 }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && pinned && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "10px 14px 0", padding: "10px 14px", background: `${B.orange}18`, border: `1.5px solid ${B.orange}40`, borderRadius: 14 }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>📌</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: B.orange, marginBottom: 2 }}>{pinned.username}</div>
            <div style={{ fontSize: 13, color: B.ink, wordBreak: "break-word" as const }}>{pinned.content}</div>
          </div>
          {isAdmin && (
            <button onClick={() => pinMutation.mutate({ id: pinned.id, pinned: false })}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: B.gray, fontSize: 16, flexShrink: 0, padding: 0 }}>
              ✕
            </button>
          )}
        </div>
      )}

      <div style={{ padding: 14, display: "flex", flexDirection: "column" as const, gap: 10, minHeight: 160, maxHeight: 260, overflowY: "auto" as const }}>
        {tab === 0 ? messages.slice(-20).map((msg) => (
          <div key={msg.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: B.grayLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              {(msg.username || "?")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: B.gray, marginBottom: 3 }}>{msg.username}</div>
              <div style={{ background: B.grayLight, borderRadius: "16px 16px 16px 4px", padding: "10px 14px", fontSize: 14, color: B.ink, wordBreak: "break-word" as const }}>{msg.content}</div>
            </div>
            {isAdmin && (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => pinMutation.mutate({ id: msg.id, pinned: !msg.isPinned })}
                  title={msg.isPinned ? "Odepnij" : "Przypnij"}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: msg.isPinned ? 1 : 0.4, padding: 2 }}>
                  📌
                </button>
                <button
                  onClick={() => deleteMutation.mutate(msg.id)}
                  title="Usuń"
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: 0.5, padding: 2 }}>
                  🗑️
                </button>
              </div>
            )}
          </div>
        )) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: B.gray, fontSize: 13 }}>Wkrótce dostępne…</div>
        )}
        <div ref={endRef} />
      </div>
      {sendError && <div style={{ padding: "6px 14px", fontSize: 12, color: "#E53E3E", borderTop: `1px solid ${B.border}` }}>{sendError}</div>}
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
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: B.orange, marginBottom: 10 }}>Warszawa · Centrum · Codziennie</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "white", letterSpacing: -1, lineHeight: 1 }}>Miejsce bez etykietek.</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 8 }}>Kino dla dorosłych otwarte dla wszystkich orientacji.</div>
      </div>
      <TodayCard />
      <BizChat />
      <div style={{ background: B.card, border: `1.5px solid ${B.border}`, borderRadius: 22, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: B.gray, lineHeight: 1.6 }}>Wejście od ul. Poznańskiej 16<br />50 metrów od rogu za Piekarnią Lubaszka</div>
          </div>
          <a
            href="https://maps.google.com/?q=Hoża+41,+Warszawa"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 6, background: B.grayLight, borderRadius: 12, padding: "10px 14px", flexShrink: 0 }}
          >
            <span style={{ fontSize: 18 }}>📍</span>
            <span style={{ fontWeight: 700, color: B.ink, fontSize: 13 }}>Mapa</span>
          </a>
        </div>
        <a href="tel:+48793012890" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, background: B.grayLight, borderRadius: 12, padding: "12px 16px" }}>
          <span style={{ fontSize: 20 }}>📞</span>
          <span style={{ fontWeight: 700, color: B.ink, fontSize: 15 }}>793 012 890</span>
        </a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {SOCIALS.map(({ href, label, bg, svg }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <div style={{ borderRadius: 16, padding: "14px 6px", textAlign: "center", background: bg }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{svg}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "white" }}>{label}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
