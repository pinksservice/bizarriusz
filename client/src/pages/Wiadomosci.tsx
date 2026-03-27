import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import { B } from "../layout/BizLayout";
import type { PrivateMessage } from "@shared/schema";

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "teraz";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} godz.`;
  return `${Math.floor(h / 24)} dni`;
}

function formatTime(dateStr: string | Date) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export default function Wiadomosci() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  // Read URL params for pre-selecting a conversation
  const params = new URLSearchParams(window.location.search);
  const toParam = params.get("to");
  const nameParam = params.get("name");
  const adIdParam = params.get("adId");
  const adTitleParam = params.get("adTitle");

  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(toParam || null);
  const [selectedPartnerName, setSelectedPartnerName] = useState<string>(nameParam ? decodeURIComponent(nameParam) : "");
  const [messageInput, setMessageInput] = useState("");
  const [sendError, setSendError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  // Inbox query
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/messages"],
    enabled: isAuthenticated,
    refetchInterval: 5000,
    staleTime: 0,
  });

  // Conversation query
  const { data: messages = [] } = useQuery<PrivateMessage[]>({
    queryKey: [`/api/messages/${selectedPartnerId}`],
    enabled: isAuthenticated && !!selectedPartnerId,
    refetchInterval: 3000,
    staleTime: 0,
  });

  // Mark as read when opening conversation
  useEffect(() => {
    if (!selectedPartnerId || !isAuthenticated) return;
    apiRequest("PATCH", `/api/messages/${selectedPartnerId}/read`).catch(() => {});
    qc.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    qc.invalidateQueries({ queryKey: ["/api/messages"] });
  }, [selectedPartnerId, isAuthenticated]);

  // Auto-scroll only on new messages (not initial load)
  useEffect(() => {
    const len = messages.length;
    if (prevLengthRef.current > 0 && len > prevLengthRef.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLengthRef.current = len;
  }, [messages]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const body: any = { content, recipientName: selectedPartnerName };
      if (adIdParam) body.adId = parseInt(adIdParam);
      if (adTitleParam) body.adTitle = decodeURIComponent(adTitleParam);
      const res = await apiRequest("POST", `/api/messages/${selectedPartnerId}`, body);
      return res.json();
    },
    onSuccess: (newMsg: PrivateMessage) => {
      qc.setQueryData<PrivateMessage[]>([`/api/messages/${selectedPartnerId}`], (old = []) => [...old, newMsg]);
      qc.invalidateQueries({ queryKey: ["/api/messages"] });
      setSendError("");
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    },
    onError: (err: any) => setSendError(err.message || "Błąd wysyłania"),
  });

  const handleSend = () => {
    const t = messageInput.trim();
    if (!t || !selectedPartnerId) return;
    sendMutation.mutate(t);
    setMessageInput("");
  };

  const openConversation = (conv: Conversation) => {
    setSelectedPartnerId(conv.partnerId);
    setSelectedPartnerName(conv.partnerName);
    prevLengthRef.current = 0;
  };

  const backToInbox = () => {
    setSelectedPartnerId(null);
    setSelectedPartnerName("");
    prevLengthRef.current = 0;
    qc.invalidateQueries({ queryKey: ["/api/messages"] });
    // Clear URL params
    navigate("/wiadomosci");
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <div style={{ fontSize: 48 }}>✉️</div>
        <p style={{ color: B.gray, fontSize: 15, textAlign: "center", margin: 0 }}>
          Zaloguj się aby korzystać z wiadomości
        </p>
        <button
          onClick={() => navigate("/login")}
          style={{ padding: "14px 32px", borderRadius: 14, background: B.orange, color: "white", border: "none", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
        >
          Zaloguj się
        </button>
      </div>
    );
  }

  // Conversation view
  if (selectedPartnerId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 58px - env(safe-area-inset-bottom) - 56px)", maxWidth: 520, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: `1px solid ${B.border}`, background: B.bg, flexShrink: 0 }}>
          <button
            onClick={backToInbox}
            style={{ background: B.grayLight, border: "none", borderRadius: 10, width: 38, height: 38, fontSize: 20, cursor: "pointer", color: B.ink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            ←
          </button>
          <div style={{ fontWeight: 800, fontSize: 18, color: B.ink, letterSpacing: -0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedPartnerName}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: B.gray, fontSize: 14, marginTop: 32 }}>
              Zacznij rozmowę – wyślij pierwszą wiadomość
            </div>
          )}
          {messages.map((msg) => {
            const isOwn = msg.senderId === user?.id;
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "75%" }}>
                  {msg.adTitle && (
                    <div style={{ fontSize: 10, fontWeight: 600, color: B.gray, marginBottom: 3, textAlign: isOwn ? "right" : "left" }}>
                      Re: {msg.adTitle}
                    </div>
                  )}
                  <div style={{
                    background: isOwn ? B.orange : B.grayLight,
                    color: isOwn ? "white" : B.ink,
                    borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    padding: "10px 14px",
                    fontSize: 14,
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: 10, color: B.gray, marginTop: 3, textAlign: isOwn ? "right" : "left" }}>
                    {msg.createdAt ? formatTime(msg.createdAt) : ""}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Input */}
        {sendError && (
          <div style={{ padding: "4px 16px", fontSize: 12, color: "#E53E3E", borderTop: `1px solid ${B.border}` }}>
            {sendError}
          </div>
        )}
        <div style={{ borderTop: `1px solid ${B.border}`, padding: "10px 16px", display: "flex", gap: 8, background: B.bg, flexShrink: 0 }}>
          <input
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Napisz wiadomość…"
            style={{ flex: 1, background: B.grayLight, border: "none", borderRadius: 22, padding: "11px 18px", fontSize: 14, outline: "none", color: B.ink, fontFamily: "inherit" }}
          />
          <button
            onClick={handleSend}
            disabled={!messageInput.trim() || sendMutation.isPending}
            style={{ width: 44, height: 44, borderRadius: "50%", background: B.orange, border: "none", color: "white", fontSize: 18, cursor: "pointer", flexShrink: 0, opacity: !messageInput.trim() ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ↑
          </button>
        </div>
      </div>
    );
  }

  // Inbox view
  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 4, color: B.ink }}>Wiadomości</h1>
      </div>

      {conversations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: B.gray }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Brak wiadomości</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Napisz do kogoś z ogłoszeń, aby zacząć</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {conversations.map((conv) => (
            <button
              key={conv.partnerId}
              onClick={() => openConversation(conv)}
              style={{ background: B.card, border: `1.5px solid ${B.border}`, borderRadius: 20, padding: "16px 18px", cursor: "pointer", textAlign: "left", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 14, transition: "border-color .2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = B.orange; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = B.border; }}
            >
              {/* Avatar */}
              <div style={{ width: 44, height: 44, borderRadius: 14, background: conv.unreadCount > 0 ? B.orange : B.grayLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: conv.unreadCount > 0 ? "white" : B.gray, flexShrink: 0 }}>
                {conv.partnerName[0]?.toUpperCase() || "?"}
              </div>
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: B.ink }}>{conv.partnerName}</span>
                  <span style={{ fontSize: 11, color: B.gray, flexShrink: 0, marginLeft: 8 }}>{timeAgo(conv.lastTime)}</span>
                </div>
                <div style={{ fontSize: 13, color: B.gray, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {conv.lastMessage.slice(0, 40)}{conv.lastMessage.length > 40 ? "…" : ""}
                </div>
              </div>
              {/* Unread badge */}
              {conv.unreadCount > 0 && (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: B.orange, flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
