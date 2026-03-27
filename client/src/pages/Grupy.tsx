import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import { B } from "../layout/BizLayout";
import type { ShoutboxMessage } from "@shared/schema";

const GROUPS = [
  { slug: "swing",    icon: "💑", name: "Swing & Pary",      desc: "Związki otwarte, doświadczenia, porady" },
  { slug: "bdsm",     icon: "⛓️", name: "Fetysz & BDSM",     desc: "Skóra, dominacja, bezpieczeństwo" },
  { slug: "lgbt",     icon: "🏳️‍🌈", name: "LGBT & Darkroom",  desc: "Niedziela i cały tydzień" },
  { slug: "trans",    icon: "⚧️", name: "Trans & Non-binary", desc: "Bezpieczna, przyjazna przestrzeń" },
  { slug: "voyeur",   icon: "👁️", name: "Voyeur & Cuckold",  desc: "Obserwacja, pary, fantazje" },
  { slug: "gangbang", icon: "👥", name: "Gang Bang",          desc: "Czwartkowe imprezy grupowe" },
];

interface GroupInfo { isMember: boolean; memberCount: number; }

function GroupChat({ slug, isMember }: { slug: string; isMember: boolean }) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [sendError, setSendError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], error: msgsError } = useQuery<ShoutboxMessage[]>({
    queryKey: [`/api/groups/${slug}/messages`],
    refetchInterval: 4000,
    staleTime: 0,
  });

  const send = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", `/api/groups/${slug}/messages`, { content: text });
      return res.json();
    },
    onSuccess: (newMsg) => {
      qc.setQueryData<ShoutboxMessage[]>([`/api/groups/${slug}/messages`], (old = []) => [...old, newMsg]);
      setContent("");
      setSendError("");
    },
    onError: (err: any) => setSendError(err.message || "Błąd wysyłania"),
  });

  const prevLen = useRef(0);
  useEffect(() => {
    const len = messages.length;
    if (prevLen.current > 0 && len > prevLen.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLen.current = len;
  }, [messages]);

  const handleSend = () => {
    const t = content.trim();
    if (!t) return;
    send.mutate(t);
  };

  return (
    <div style={{ borderTop: `1px solid ${B.border}`, marginTop: 12 }}>
      <div style={{ maxHeight: 220, overflowY: "auto", padding: "10px 0", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: B.gray, fontSize: 13, padding: "20px 0" }}>Brak wiadomości — napisz pierwszy!</div>
        ) : messages.slice(-30).map((msg) => (
          <div key={msg.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: B.grayLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {(msg.username || "?")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: B.gray, marginBottom: 2 }}>{msg.username}</div>
              <div style={{ background: B.grayLight, borderRadius: "14px 14px 14px 3px", padding: "8px 12px", fontSize: 13, color: B.ink, wordBreak: "break-word" }}>{msg.content}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {sendError && <div style={{ fontSize: 12, color: "#E53E3E", padding: "4px 0" }}>{sendError}</div>}
      {isMember ? (
        <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
          <input
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Napisz wiadomość..."
            maxLength={500}
            style={{ flex: 1, background: B.grayLight, border: "none", borderRadius: 20, padding: "10px 16px", fontSize: 13, outline: "none", color: B.ink, fontFamily: "inherit" }}
          />
          <button
            onClick={handleSend}
            disabled={!content.trim() || send.isPending}
            style={{ width: 40, height: 40, borderRadius: "50%", background: B.orange, border: "none", color: "white", fontSize: 16, cursor: "pointer", flexShrink: 0, opacity: !content.trim() ? 0.5 : 1 }}
          >↑</button>
        </div>
      ) : (
        <div style={{ paddingTop: 8, fontSize: 12, color: B.gray, textAlign: "center" }}>
          {isAuthenticated ? "Dołącz do grupy, aby pisać" : "Zaloguj się i dołącz, aby pisać"}
        </div>
      )}
    </div>
  );
}

function GroupCard({ slug, icon, name, desc }: { slug: string; icon: string; name: string; desc: string }) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: info } = useQuery<GroupInfo>({
    queryKey: [`/api/groups/${slug}/info`],
    staleTime: 30_000,
  });

  const joinMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/groups/${slug}/join`, {}).then(r => r.json()),
    onSuccess: () => {
      qc.setQueryData<GroupInfo>([`/api/groups/${slug}/info`], old => ({
        isMember: true,
        memberCount: (old?.memberCount ?? 0) + 1,
      }));
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/groups/${slug}/leave`).then(r => r.json()),
    onSuccess: () => {
      qc.setQueryData<GroupInfo>([`/api/groups/${slug}/info`], old => ({
        isMember: false,
        memberCount: Math.max((old?.memberCount ?? 1) - 1, 0),
      }));
    },
  });

  const isMember = info?.isMember ?? false;
  const memberCount = info?.memberCount ?? 0;
  const isPending = joinMutation.isPending || leaveMutation.isPending;

  return (
    <div style={{ background: B.card, border: `1.5px solid ${open ? B.orange : B.border}`, borderRadius: 18, padding: "16px 20px", transition: "border-color .2s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: B.orangeSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 3, color: B.ink }}>{name}</div>
          <div style={{ fontSize: 12, color: B.gray }}>{desc}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: B.ink, lineHeight: 1 }}>{memberCount}</div>
          <div style={{ fontSize: 11, color: B.gray }}>członków</div>
        </div>
        <div style={{ color: B.gray, fontSize: 18, flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }}>›</div>
      </div>

      {open && (
        <div style={{ marginTop: 14 }}>
          {isAuthenticated && (
            <button
              onClick={() => isMember ? leaveMutation.mutate() : joinMutation.mutate()}
              disabled={isPending}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 14,
                background: isMember ? B.grayLight : B.orange,
                color: isMember ? B.ink : "white",
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? "…" : isMember ? "Opuść grupę" : "Dołącz do grupy"}
            </button>
          )}
          <GroupChat slug={slug} isMember={isMember} />
        </div>
      )}
    </div>
  );
}

export default function Grupy() {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 8, color: B.ink }}>Grupy</h1>
        <p style={{ color: B.gray }}>Dołącz do grupy i rozmawiaj z jej członkami.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {GROUPS.map(g => <GroupCard key={g.slug} {...g} />)}
      </div>

      <div style={{ marginTop: 20, background: B.ink, borderRadius: 18, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <svg viewBox="0 0 24 24" width="36" height="36" fill="white" style={{ flexShrink: 0 }}>
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z"/>
        </svg>
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
