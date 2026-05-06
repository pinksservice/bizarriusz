import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import { B } from "../layout/BizLayout";
import type { ShoutboxMessage, BizGroup, GroupActivity, GroupPost, GroupPostReaction, GroupPostComment } from "@shared/schema";

interface GroupInfo { isMember: boolean; memberCount: number; }

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(d: string | Date) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "przed chwilą";
  if (diff < 3600) return `${Math.floor(diff / 60)} min temu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h temu`;
  return `${Math.floor(diff / 86400)} dni temu`;
}

function activityLabel(a: GroupActivity) {
  switch (a.type) {
    case "created": return <><b>{a.username}</b> założył grupę <b>{a.groupName}</b></>;
    case "joined":  return <><b>{a.username}</b> dołączył do <b>{a.groupName}</b></>;
    case "left":    return <><b>{a.username}</b> opuścił <b>{a.groupName}</b></>;
    case "post":    return <><b>{a.username}</b> dodał post w <b>{a.groupName}</b>{a.payload ? `: ${a.payload.slice(0, 60)}${a.payload.length > 60 ? "…" : ""}` : ""}</>;
    case "message": return <><b>{a.username}</b> napisał w <b>{a.groupName}</b>{a.payload ? `: ${a.payload.slice(0, 60)}${a.payload.length > 60 ? "…" : ""}` : ""}</>;
    default:        return <>{a.username} — {a.groupName}</>;
  }
}

// ─── Activity Feed ───────────────────────────────────────────────────────────

function ActivityFeed() {
  const { data: items = [] } = useQuery<GroupActivity[]>({
    queryKey: ["/api/activity"],
    refetchInterval: 15_000,
    staleTime: 0,
  });

  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: B.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        Ostatnia aktywność
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.slice(0, 10).map(a => (
          <div key={a.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: B.grayLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: B.gray, flexShrink: 0 }}>
              {a.username?.[0]?.toUpperCase() || "?"}
            </div>
            <div style={{ flex: 1, fontSize: 13, color: B.ink, lineHeight: 1.4 }}>
              {activityLabel(a)}
              <span style={{ marginLeft: 6, fontSize: 11, color: B.gray }}>{timeAgo(a.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Group Chat ──────────────────────────────────────────────────────────────

function GroupChat({ slug, isMember }: { slug: string; isMember: boolean }) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [sendError, setSendError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<ShoutboxMessage[]>({
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
      qc.invalidateQueries({ queryKey: ["/api/activity"] });
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

// ─── Post Comments ───────────────────────────────────────────────────────────

function PostComments({ postId, groupSlug }: { postId: number; groupSlug: string }) {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const { data: comments = [] } = useQuery<GroupPostComment[]>({
    queryKey: [`/api/posts/${postId}/comments`],
    staleTime: 0,
  });

  const { data: membership } = useQuery<{ isMember: boolean; memberCount: number }>({
    queryKey: [`/api/groups/${groupSlug}/info`],
    staleTime: 30_000,
  });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/comments`, { content });
      return res.json() as Promise<GroupPostComment>;
    },
    onSuccess: (c) => {
      qc.setQueryData<GroupPostComment[]>([`/api/posts/${postId}/comments`], (old = []) => [...old, c]);
      qc.setQueryData<GroupPost[]>([`/api/groups/${groupSlug}/posts`], (old = []) =>
        old.map(p => p.id === postId ? { ...p, commentCount: (p.commentCount ?? 0) + 1 } : p)
      );
      setText("");
    },
  });

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${B.border}` }}>
      {comments.map(c => (
        <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: B.grayLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: B.gray, flexShrink: 0 }}>
            {c.username?.[0]?.toUpperCase() || "?"}
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: B.gray, marginRight: 6 }}>{c.username}</span>
            <span style={{ fontSize: 13, color: B.ink }}>{c.content}</span>
          </div>
        </div>
      ))}
      {isAuthenticated && membership?.isMember && (
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && text.trim() && addComment.mutate(text.trim())}
            placeholder="Dodaj komentarz…"
            maxLength={500}
            style={{ flex: 1, background: B.grayLight, border: "none", borderRadius: 16, padding: "8px 14px", fontSize: 13, outline: "none", color: B.ink, fontFamily: "inherit" }}
          />
          <button
            onClick={() => text.trim() && addComment.mutate(text.trim())}
            disabled={!text.trim() || addComment.isPending}
            style={{ width: 34, height: 34, borderRadius: "50%", background: B.orange, border: "none", fontSize: 14, cursor: "pointer", flexShrink: 0, opacity: !text.trim() ? 0.5 : 1 }}
          >↑</button>
        </div>
      )}
    </div>
  );
}

// ─── Post Item ────────────────────────────────────────────────────────────────

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "🔥"];

function PostItem({ post, groupSlug }: { post: GroupPost; groupSlug: string }) {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);

  const { data: reactions = [] } = useQuery<GroupPostReaction[]>({
    queryKey: [`/api/posts/${post.id}/reactions`],
    staleTime: 10_000,
  });

  const react = useMutation({
    mutationFn: async (emoji: string) => {
      const res = await apiRequest("POST", `/api/posts/${post.id}/reactions`, { emoji });
      return res.json() as Promise<GroupPostReaction[]>;
    },
    onSuccess: (updated) => {
      qc.setQueryData<GroupPostReaction[]>([`/api/posts/${post.id}/reactions`], updated);
    },
  });

  const counts: Record<string, number> = {};
  const mine = new Set<string>();
  reactions.forEach(r => {
    counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    if (r.userId === (user as any)?.id) mine.add(r.emoji);
  });

  function formatTime(d: string | Date) {
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60) return "przed chwilą";
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
  }

  return (
    <div style={{ background: B.card, borderRadius: 16, padding: "14px 16px", border: `1px solid ${B.border}` }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: B.grayLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: B.gray, flexShrink: 0 }}>
          {post.username?.[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: B.ink }}>{post.username}</div>
          <div style={{ fontSize: 11, color: B.gray }}>{formatTime(post.createdAt)}</div>
        </div>
      </div>

      <div style={{ fontSize: 14, color: B.ink, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word", marginBottom: 12 }}>
        {post.content}
      </div>

      {/* Reactions */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {REACTION_EMOJIS.map(e => {
          const count = counts[e] || 0;
          const active = mine.has(e);
          return (
            <button
              key={e}
              onClick={() => isAuthenticated && react.mutate(e)}
              style={{
                display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                borderRadius: 20, border: `1.5px solid ${active ? B.orange : B.border}`,
                background: active ? B.orangeSoft : B.bg,
                cursor: isAuthenticated ? "pointer" : "default",
                fontSize: 13, fontWeight: 700, color: B.ink,
              }}
            >
              {e} {count > 0 && <span style={{ fontSize: 12, color: active ? B.orange : B.gray }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Comments toggle */}
      <button
        onClick={() => setShowComments(s => !s)}
        style={{ fontSize: 12, color: B.gray, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
      >
        💬 {post.commentCount ?? 0} {showComments ? "↑" : "komentarzy"}
      </button>

      {showComments && <PostComments postId={post.id} groupSlug={groupSlug} />}
    </div>
  );
}

// ─── Group Posts List ─────────────────────────────────────────────────────────

function GroupPosts({ slug, isMember }: { slug: string; isMember: boolean }) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: posts = [] } = useQuery<GroupPost[]>({
    queryKey: [`/api/groups/${slug}/posts`],
    refetchInterval: 15_000,
    staleTime: 0,
  });

  const createPost = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/groups/${slug}/posts`, { content });
      if (!res.ok) { const b = await res.json(); throw new Error(b.message); }
      return res.json() as Promise<GroupPost>;
    },
    onSuccess: (p) => {
      qc.setQueryData<GroupPost[]>([`/api/groups/${slug}/posts`], (old = []) => [p, ...old]);
      qc.invalidateQueries({ queryKey: ["/api/activity"] });
      setText("");
      setShowForm(false);
    },
  });

  return (
    <div style={{ marginTop: 12 }}>
      {isMember && (
        <div style={{ marginBottom: 12 }}>
          {showForm ? (
            <div style={{ background: B.grayLight, borderRadius: 14, padding: 12 }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Co chcesz napisać?"
                maxLength={2000}
                rows={3}
                autoFocus
                style={{ width: "100%", background: "none", border: "none", fontSize: 14, color: B.ink, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button onClick={() => { setShowForm(false); setText(""); }}
                  style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: B.border, color: B.gray, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
                  Anuluj
                </button>
                <button onClick={() => text.trim() && createPost.mutate(text.trim())}
                  disabled={!text.trim() || createPost.isPending}
                  style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: B.orange, color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13, opacity: !text.trim() ? 0.5 : 1 }}>
                  {createPost.isPending ? "…" : "Opublikuj"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)}
              style={{ width: "100%", padding: "10px 16px", borderRadius: 14, border: `1.5px dashed ${B.border}`, background: "none", color: B.gray, fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
              ✏️ Napisz post w grupie…
            </button>
          )}
        </div>
      )}

      {posts.length === 0 ? (
        <div style={{ textAlign: "center", color: B.gray, fontSize: 13, padding: "20px 0" }}>
          {isMember ? "Brak postów — napisz pierwszy!" : "Brak postów"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {posts.map(p => <PostItem key={p.id} post={p} groupSlug={slug} />)}
        </div>
      )}
    </div>
  );
}

// ─── Group Card ──────────────────────────────────────────────────────────────

function GroupCard({ group }: { group: BizGroup }) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"czat" | "posty">("posty");

  const { data: info } = useQuery<GroupInfo>({
    queryKey: [`/api/groups/${group.slug}/info`],
    staleTime: 30_000,
  });

  const joinMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/groups/${group.slug}/join`, {}).then(r => r.json()),
    onSuccess: () => {
      qc.setQueryData<GroupInfo>([`/api/groups/${group.slug}/info`], old => ({ isMember: true, memberCount: (old?.memberCount ?? 0) + 1 }));
      qc.invalidateQueries({ queryKey: ["/api/activity"] });
      qc.invalidateQueries({ queryKey: ["/api/groups"] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/groups/${group.slug}/leave`).then(r => r.json()),
    onSuccess: () => {
      qc.setQueryData<GroupInfo>([`/api/groups/${group.slug}/info`], old => ({ isMember: false, memberCount: Math.max((old?.memberCount ?? 1) - 1, 0) }));
      qc.invalidateQueries({ queryKey: ["/api/groups"] });
    },
  });

  const isMember = info?.isMember ?? false;
  const memberCount = info?.memberCount ?? group.memberCount ?? 0;
  const isPending = joinMutation.isPending || leaveMutation.isPending;

  return (
    <div style={{ background: B.card, border: `1.5px solid ${open ? B.orange : B.border}`, borderRadius: 18, padding: "16px 20px", transition: "border-color .2s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: B.orangeSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
          {group.coverEmoji || "👥"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 3, color: B.ink }}>{group.name}</div>
          {group.description && <div style={{ fontSize: 12, color: B.gray }}>{group.description}</div>}
          <div style={{ fontSize: 11, color: B.gray, marginTop: 2 }}>zał. {group.createdByName}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: B.ink, lineHeight: 1 }}>{memberCount}</div>
          <div style={{ fontSize: 11, color: B.gray }}>członków</div>
        </div>
        <div style={{ color: B.gray, fontSize: 18, flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(90deg)" : "none" }}>›</div>
      </div>

      {open && (
        <div style={{ marginTop: 14 }}>
          {isAuthenticated && (
            <button
              onClick={() => isMember ? leaveMutation.mutate() : joinMutation.mutate()}
              disabled={isPending}
              style={{ width: "100%", padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: isMember ? B.grayLight : B.orange, color: isMember ? B.ink : "white", opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? "…" : isMember ? "Opuść grupę" : "Dołącz do grupy"}
            </button>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginTop: 12, background: B.grayLight, borderRadius: 12, padding: 4 }}>
            {(["posty", "czat"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: "8px 0", borderRadius: 9, border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 13, fontFamily: "inherit",
                background: tab === t ? B.bg : "none",
                color: tab === t ? B.ink : B.gray,
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,.08)" : "none",
              }}>
                {t === "posty" ? "📝 Posty" : "💬 Czat"}
              </button>
            ))}
          </div>

          {tab === "czat"
            ? <GroupChat slug={group.slug} isMember={isMember} />
            : <GroupPosts slug={group.slug} isMember={isMember} />
          }
        </div>
      )}
    </div>
  );
}

// ─── Create Group Modal ───────────────────────────────────────────────────────

const EMOJIS = ["👥","🔥","💑","⛓️","🏳️‍🌈","⚧️","👁️","🎉","💃","🕺","🌈","🎭","🎪","💋","🎸","🍸","🌙","⭐","🦋","🌺"];

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: (g: BizGroup) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("👥");
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/groups", { name, description: desc, coverEmoji: emoji, isPublic: true });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "Błąd tworzenia grupy");
      }
      return res.json() as Promise<BizGroup>;
    },
    onSuccess: (group) => {
      onCreated(group);
      onClose();
    },
    onError: (err: any) => setError(err.message),
  });

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: B.bg, borderRadius: "20px 20px 0 0", padding: 24, paddingBottom: "max(24px, calc(env(safe-area-inset-bottom) + 16px))", width: "100%", maxWidth: 480 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontWeight: 800, fontSize: 18, color: B.ink, marginBottom: 4 }}>Nowa grupa</div>
        <div style={{ fontSize: 13, color: B.gray, marginBottom: 20 }}>Stwórz społeczność wokół swojego tematu</div>

        <div style={{ fontSize: 11, fontWeight: 700, color: B.gray, marginBottom: 8 }}>IKONA</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${emoji === e ? B.orange : B.border}`, background: emoji === e ? B.orangeSoft : B.card, fontSize: 18, cursor: "pointer" }}
            >{e}</button>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: B.gray, marginBottom: 6 }}>NAZWA GRUPY *</div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="np. Biegacze poranni, Taniec swing..."
          maxLength={50}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: `1.5px solid ${B.border}`, background: B.grayLight, fontSize: 14, color: B.ink, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12 }}
        />

        <div style={{ fontSize: 11, fontWeight: 700, color: B.gray, marginBottom: 6 }}>OPIS (opcjonalnie)</div>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="O czym jest ta grupa?"
          maxLength={200}
          rows={2}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: `1.5px solid ${B.border}`, background: B.grayLight, fontSize: 14, color: B.ink, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 16 }}
        />

        {error && <div style={{ fontSize: 12, color: "#E53E3E", marginBottom: 12 }}>{error}</div>}

        <button
          onClick={() => createMutation.mutate()}
          disabled={name.trim().length < 3 || createMutation.isPending}
          style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", background: B.orange, color: "white", fontWeight: 800, fontSize: 16, cursor: "pointer", opacity: name.trim().length < 3 ? 0.5 : 1, fontFamily: "inherit" }}
        >
          {createMutation.isPending ? "Tworzę…" : "Utwórz grupę"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Grupy() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: groups = [], isLoading } = useQuery<BizGroup[]>({
    queryKey: ["/api/groups"],
    staleTime: 30_000,
  });

  const handleCreated = (g: BizGroup) => {
    qc.setQueryData<BizGroup[]>(["/api/groups"], (old = []) => [g, ...old]);
    qc.invalidateQueries({ queryKey: ["/api/activity"] });
  };

  return (
    <div style={{ padding: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: B.ink }}>Grupy</div>
          <div style={{ fontSize: 13, color: B.gray }}>{groups.length} grup społeczności</div>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => setShowCreate(true)}
            style={{ padding: "10px 18px", borderRadius: 14, border: "none", background: B.orange, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Utwórz
          </button>
        )}
      </div>

      {/* Activity feed */}
      <ActivityFeed />

      {/* Group list */}
      {isLoading ? (
        <div style={{ textAlign: "center", color: B.gray, padding: "40px 0", fontSize: 14 }}>Ładowanie grup…</div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign: "center", color: B.gray, padding: "40px 0", fontSize: 14 }}>
          Brak grup. {isAuthenticated ? "Utwórz pierwszą!" : "Zaloguj się, aby tworzyć grupy."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groups.map(g => <GroupCard key={g.id} group={g} />)}
        </div>
      )}

      {/* Telegram banner */}
      <div style={{ marginTop: 20, background: B.ink, borderRadius: 18, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <svg viewBox="0 0 24 24" width="36" height="36" fill="white" style={{ flexShrink: 0 }}>
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z"/>
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "white", marginBottom: 4 }}>Telegram Bizarriusz</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>Główny kanał ogłoszeń i czat społeczności.</div>
        </div>
        <a href="https://t.me/Bizarriuszczat" target="_blank" rel="noopener noreferrer"
          style={{ padding: "10px 18px", borderRadius: 12, background: B.orange, color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
          Dołącz
        </a>
      </div>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}
