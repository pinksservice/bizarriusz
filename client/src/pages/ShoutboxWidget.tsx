import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import type { ShoutboxMessage } from "@shared/schema";

const C = {
  bg: "#FFFEF9",
  ink: "#0D0D0D",
  orange: "#FFC824",
  gray: "#787878",
  light: "#F4F4F0",
  border: "rgba(13,13,13,.08)",
};

function formatTime(d: string | Date) {
  return new Date(d).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onLogin();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 24, gap: 16 }}>
      <div style={{ fontSize: 32 }}>💬</div>
      <div style={{ fontWeight: 800, fontSize: 18, color: C.ink }}>Czat Bizarriusz</div>
      <div style={{ fontSize: 13, color: C.gray, textAlign: "center" }}>Zaloguj się, aby pisać na czacie</div>
      <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          required
          style={{ width: "100%", padding: "11px 16px", borderRadius: 14, border: `1.5px solid ${C.border}`, background: C.light, fontSize: 14, outline: "none", color: C.ink, fontFamily: "inherit", boxSizing: "border-box" }}
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Hasło"
          required
          style={{ width: "100%", padding: "11px 16px", borderRadius: 14, border: `1.5px solid ${C.border}`, background: C.light, fontSize: 14, outline: "none", color: C.ink, fontFamily: "inherit", boxSizing: "border-box" }}
        />
        {error && <div style={{ fontSize: 12, color: "#E53E3E", textAlign: "center" }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "13px 0", borderRadius: 14, background: C.orange, border: "none", color: C.ink, fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}
        >
          {loading ? "…" : "Zaloguj się"}
        </button>
      </form>
      <div style={{ fontSize: 12, color: C.gray, textAlign: "center" }}>
        Nie masz konta?{" "}
        <a href="https://bizarriusz.club/login" target="_blank" rel="noopener noreferrer" style={{ color: C.orange, fontWeight: 700, textDecoration: "none" }}>
          Zarejestruj się
        </a>
      </div>
    </div>
  );
}

function Chat() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [sendError, setSendError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(0);

  const { data: messages = [] } = useQuery<ShoutboxMessage[]>({
    queryKey: ["/api/shoutbox"],
    refetchInterval: 4000,
    staleTime: 0,
  });

  useEffect(() => {
    const len = messages.length;
    if (prevLen.current === 0 && len > 0) {
      endRef.current?.scrollIntoView();
    } else if (len > prevLen.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLen.current = len;
  }, [messages]);

  const send = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/shoutbox", { content: text });
      return res.json();
    },
    onSuccess: (msg) => {
      qc.setQueryData<ShoutboxMessage[]>(["/api/shoutbox"], (old = []) => [...old, msg]);
      setContent("");
      setSendError("");
    },
    onError: (err: any) => setSendError(err.message || "Błąd wysyłania"),
  });

  const handleSend = () => {
    const t = content.trim();
    if (!t) return;
    send.mutate(t);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: C.bg, fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0, background: C.bg }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💬</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.ink, lineHeight: 1 }}>Czat Bizarriusz</div>
          <div style={{ fontSize: 11, color: C.gray }}>bizarriusz.club</div>
        </div>
        <div style={{ fontSize: 12, color: C.gray }}>
          👤 {(user as any)?.displayName || user?.email?.split("@")[0] || "Ty"}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.slice(-50).map((msg) => {
          const isOwn = (msg as any).userId === (user as any)?.id;
          return (
            <div key={msg.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", flexDirection: isOwn ? "row-reverse" : "row" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: isOwn ? C.orange : C.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: isOwn ? C.ink : C.gray, flexShrink: 0, overflow: "hidden" }}>
                {msg.avatarUrl
                  ? <img src={msg.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (msg.username?.[0]?.toUpperCase() || "?")}
              </div>
              <div style={{ maxWidth: "75%" }}>
                {!isOwn && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.gray, marginBottom: 2 }}>{msg.username}</div>
                )}
                <div style={{
                  background: isOwn ? C.orange : C.light,
                  color: C.ink,
                  borderRadius: isOwn ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  padding: "8px 12px",
                  fontSize: 13,
                  lineHeight: 1.5,
                  wordBreak: "break-word",
                }}>
                  {msg.content}
                </div>
                <div style={{ fontSize: 10, color: C.gray, marginTop: 2, textAlign: isOwn ? "right" : "left" }}>
                  {msg.createdAt ? formatTime(msg.createdAt) : ""}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      {sendError && <div style={{ padding: "4px 12px", fontSize: 11, color: "#E53E3E" }}>{sendError}</div>}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 12px", display: "flex", gap: 8, background: C.bg, flexShrink: 0 }}>
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Napisz wiadomość…"
          maxLength={500}
          style={{ flex: 1, background: C.light, border: "none", borderRadius: 20, padding: "10px 16px", fontSize: 13, outline: "none", color: C.ink, fontFamily: "inherit" }}
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || send.isPending}
          style={{ width: 40, height: 40, borderRadius: "50%", background: C.orange, border: "none", color: C.ink, fontSize: 16, cursor: "pointer", flexShrink: 0, opacity: !content.trim() ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}
        >↑</button>
      </div>
    </div>
  );
}

export default function ShoutboxWidget() {
  const { isAuthenticated, isLoading } = useAuth();
  const qc = useQueryClient();

  const handleLogin = () => {
    qc.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100dvh", background: C.bg, color: C.gray, fontSize: 14, fontFamily: "system-ui, sans-serif" }}>
        Ładowanie…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ height: "100dvh", background: C.bg, fontFamily: "system-ui, sans-serif" }}>
        <LoginForm onLogin={handleLogin} />
      </div>
    );
  }

  return <Chat />;
}
