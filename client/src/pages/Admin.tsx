import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { apiRequest } from "../lib/queryClient";
import { B } from "../layout/BizLayout";

const TABS = [
  { id: "users", label: "Użytkownicy" },
  { id: "ogloszenia", label: "Ogłoszenia" },
  { id: "czat", label: "Czat" },
  { id: "info", label: "Info" },
];

const inp: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${B.border}`,
  background: B.bg, fontSize: 14, color: B.ink, outline: "none",
  width: "100%", fontFamily: "inherit", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: B.gray, marginBottom: 5,
  textTransform: "uppercase", letterSpacing: ".08em", display: "block",
};

function ConfirmButton({ label, confirmLabel = "Potwierdź", onClick, danger }: {
  label: string; confirmLabel?: string; onClick: () => void; danger?: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) return (
    <button
      onClick={() => { setConfirm(false); onClick(); }}
      style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, border: "none", background: "#E53E3E", color: "white", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
    >{confirmLabel}</button>
  );
  return (
    <button
      onClick={() => setConfirm(true)}
      style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${B.border}`, background: "transparent", color: danger ? "#E53E3E" : B.gray, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
    >{label}</button>
  );
}

// ─── UŻYTKOWNICY ─────────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  bannedUntil: string | null;
  createdAt: string;
}

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await apiRequest("GET", "/api/admin/users");
      setUsers(await res.json());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  async function ban(id: string, ban: boolean) {
    try { await apiRequest("PATCH", `/api/admin/users/${id}/ban`, { ban }); load(); }
    catch (e: any) { alert(e.message); }
  }

  async function del(id: string) {
    try { await apiRequest("DELETE", `/api/admin/users/${id}`); load(); }
    catch (e: any) { alert(e.message); }
  }

  const filtered = users.filter(u =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: B.gray }}>Ładowanie…</div>;
  if (error) return <div style={{ color: "#E53E3E", padding: 16, fontSize: 13 }}>{error}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: B.gray }}>{users.length} użytkowników</span>
      </div>
      <input
        style={inp}
        placeholder="Szukaj po emailu lub nazwie…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {filtered.map(u => {
        const isBanned = u.bannedUntil && new Date(u.bannedUntil) > new Date();
        const initials = (u.displayName || u.email || "?")[0].toUpperCase();
        return (
          <div key={u.id} style={{
            background: B.card, border: `1px solid ${B.border}`, borderRadius: 16,
            padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
              background: u.avatarUrl ? "transparent" : B.orange,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700, color: "white", overflow: "hidden",
            }}>
              {u.avatarUrl
                ? <img src={u.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{u.displayName || u.email?.split("@")[0] || "—"}</span>
                {isBanned && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: "#FFF0EE", color: "#E53E3E", padding: "2px 8px", borderRadius: 20 }}>Zbanowany</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: B.gray, marginTop: 2 }}>{u.email}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0, alignItems: "flex-end" }}>
              {isBanned ? (
                <button onClick={() => ban(u.id, false)} style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, border: "none", background: B.orangeSoft, color: B.orange, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                  Odbanuj
                </button>
              ) : (
                <ConfirmButton label="Zbanuj" confirmLabel="Tak, zbanuj" onClick={() => ban(u.id, true)} />
              )}
              <ConfirmButton label="Usuń" confirmLabel="Tak, usuń" onClick={() => del(u.id)} danger />
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && (
        <div style={{ color: B.gray, textAlign: "center", padding: 32 }}>Brak wyników</div>
      )}
    </div>
  );
}

// ─── OGŁOSZENIA ───────────────────────────────────────────────────────────────
interface Ad {
  id: number;
  title: string;
  category: string;
  location: string | null;
  status: string;
  created_at: string;
  createdAt: string;
}

function OgloszeniaTab() {
  const [items, setItems] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/admin/ads");
      setItems(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function del(id: number) {
    try { await apiRequest("DELETE", `/api/admin/ads/${id}`); setItems(i => i.filter(x => x.id !== id)); }
    catch (e: any) { alert(e.message); }
  }

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: B.gray }}>Ładowanie…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ fontSize: 12, color: B.gray }}>{items.length} ogłoszeń</span>
      {items.map(item => (
        <div key={item.id} style={{
          background: B.card, border: `1px solid ${B.border}`, borderRadius: 16,
          padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{item.title}</div>
            <div style={{ fontSize: 11, color: B.gray }}>
              {item.category}{item.location ? ` · ${item.location}` : ""} · {item.status}
            </div>
          </div>
          <ConfirmButton label="Usuń" confirmLabel="Usuń" onClick={() => del(item.id)} danger />
        </div>
      ))}
      {items.length === 0 && <div style={{ color: B.gray, textAlign: "center", padding: 32 }}>Brak ogłoszeń</div>}
    </div>
  );
}

// ─── CZAT (SHOUTBOX) ──────────────────────────────────────────────────────────
interface ShoutMsg {
  id: number;
  username: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  groupSlug: string | null;
}

function CzatTab() {
  const [msgs, setMsgs] = useState<ShoutMsg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/admin/shoutbox");
      setMsgs(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function del(id: number) {
    try { await apiRequest("DELETE", `/api/admin/shoutbox/${id}`); setMsgs(m => m.filter(x => x.id !== id)); }
    catch (e: any) { alert(e.message); }
  }

  async function togglePin(msg: ShoutMsg) {
    try {
      await apiRequest("PATCH", `/api/admin/shoutbox/${msg.id}/pin`, { pinned: !msg.isPinned });
      load();
    } catch (e: any) { alert(e.message); }
  }

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: B.gray }}>Ładowanie…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ fontSize: 12, color: B.gray }}>{msgs.length} wiadomości</span>
      {msgs.map(msg => (
        <div key={msg.id} style={{
          background: msg.isPinned ? B.orangeSoft : B.card,
          border: `1px solid ${msg.isPinned ? B.orange : B.border}`,
          borderRadius: 16, padding: "12px 14px",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ fontWeight: 700, fontSize: 12 }}>{msg.username}</span>
              {msg.isPinned && <span style={{ fontSize: 10, fontWeight: 700, color: B.orange }}>📌 Przypięty</span>}
              {msg.groupSlug && <span style={{ fontSize: 10, color: B.gray }}>Grupa: {msg.groupSlug}</span>}
            </div>
            <div style={{ fontSize: 13, color: B.ink, lineHeight: 1.5 }}>{msg.content}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
            <button
              onClick={() => togglePin(msg)}
              style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, border: `1.5px solid ${B.border}`, background: "transparent", color: B.gray, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
            >
              {msg.isPinned ? "Odepnij" : "Przypnij"}
            </button>
            <ConfirmButton label="Usuń" confirmLabel="Usuń" onClick={() => del(msg.id)} danger />
          </div>
        </div>
      ))}
      {msgs.length === 0 && <div style={{ color: B.gray, textAlign: "center", padding: 32 }}>Brak wiadomości</div>}
    </div>
  );
}

// ─── INFO (ARTYKUŁY) ──────────────────────────────────────────────────────────
interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  author: string | null;
  status: string;
  featured: boolean;
  cover_image: string | null;
  tags: string[] | null;
  category_slug: string | null;
  created_at: string;
}

const BLANK_FORM = { title: "", slug: "", excerpt: "", content: "", author: "", status: "published", featured: false, cover_image: "", tags: "", category_slug: "" };

function InfoTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Article | "new" | null>(null);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/admin/blog");
      setArticles(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  function startNew() {
    setForm({ ...BLANK_FORM });
    setEditing("new");
    setError("");
  }

  function startEdit(a: Article) {
    setForm({
      title: a.title, slug: a.slug, excerpt: a.excerpt || "", content: a.content || "",
      author: a.author || "", status: a.status, featured: a.featured as any,
      cover_image: a.cover_image || "", tags: (a.tags || []).join(", "), category_slug: a.category_slug || "",
    });
    setEditing(a);
    setError("");
  }

  function cancel() { setEditing(null); setError(""); }

  async function save() {
    if (!form.title.trim()) { setError("Tytuł jest wymagany"); return; }
    setSaving(true); setError("");
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim() || null,
      content: form.content.trim(),
      author: form.author.trim() || null,
      status: form.status,
      featured: Boolean(form.featured),
      cover_image: form.cover_image.trim() || null,
      tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : null,
      category_slug: form.category_slug.trim() || null,
    };
    try {
      if (editing === "new") {
        await apiRequest("POST", "/api/admin/blog", payload);
      } else {
        await apiRequest("PUT", `/api/admin/blog/${(editing as Article).id}`, payload);
      }
      setEditing(null);
      load();
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  }

  async function del(id: number) {
    try { await apiRequest("DELETE", `/api/admin/blog/${id}`); setArticles(a => a.filter(x => x.id !== id)); }
    catch (e: any) { alert(e.message); }
  }

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: B.gray }}>Ładowanie…</div>;

  const STATUS_COLORS: Record<string, string> = { published: "#00C27A", draft: B.gray, scheduled: "#DD8500" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {editing && (
        <div style={{ background: B.grayLight, borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
            {editing === "new" ? "Nowy artykuł" : "Edytuj artykuł"}
          </div>
          <div>
            <span style={lbl}>Tytuł</span>
            <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Tytuł artykułu" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <span style={lbl}>Status</span>
              <select style={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="published">Opublikowany</option>
                <option value="draft">Szkic</option>
                <option value="scheduled">Zaplanowany</option>
              </select>
            </div>
            <div>
              <span style={lbl}>Kategoria</span>
              <input style={inp} value={form.category_slug} onChange={e => setForm(f => ({ ...f, category_slug: e.target.value }))} placeholder="np. poradniki" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <span style={lbl}>Autor</span>
              <input style={inp} value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Redakcja" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 20 }}>
              <input type="checkbox" id="art-featured" checked={Boolean(form.featured)} onChange={e => setForm(f => ({ ...f, featured: e.target.checked as any }))} />
              <label htmlFor="art-featured" style={{ ...lbl, margin: 0 }}>Wyróżniony</label>
            </div>
          </div>
          <div>
            <span style={lbl}>Zdjęcie (URL)</span>
            <input style={inp} value={form.cover_image} onChange={e => setForm(f => ({ ...f, cover_image: e.target.value }))} placeholder="https://…" />
          </div>
          <div>
            <span style={lbl}>Tagi (przecinkami)</span>
            <input style={inp} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="sauna, zdrowie, imprezy" />
          </div>
          <div>
            <span style={lbl}>Opis (excerpt)</span>
            <textarea style={{ ...inp, resize: "vertical", minHeight: 60 }} value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Krótki opis…" rows={2} />
          </div>
          <div>
            <span style={lbl}>Treść (Markdown)</span>
            <textarea
              style={{ ...inp, resize: "vertical", minHeight: 160, fontFamily: "monospace", fontSize: 12, lineHeight: 1.5 }}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder={"# Tytuł\n\nTreść artykułu w formacie Markdown…"}
              rows={10}
            />
          </div>
          {error && <p style={{ color: "#E53E3E", fontSize: 12, margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={save}
              disabled={saving}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, background: B.orange, color: "white", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}
            >{saving ? "…" : "Zapisz"}</button>
            <button
              onClick={cancel}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, background: B.grayLight, color: B.ink, border: `1.5px solid ${B.border}`, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
            >Anuluj</button>
          </div>
        </div>
      )}

      {!editing && (
        <button
          onClick={startNew}
          style={{ width: "100%", padding: "12px 0", borderRadius: 12, background: B.orange, color: "white", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
        >+ Nowy artykuł</button>
      )}

      <span style={{ fontSize: 12, color: B.gray }}>{articles.length} artykułów</span>

      {articles.map(a => (
        <div key={a.id} style={{
          background: B.card, border: `1px solid ${B.border}`, borderRadius: 16,
          padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</span>
              {a.featured && <span style={{ fontSize: 10, background: B.orangeSoft, color: B.orange, padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>★ Wyróżniony</span>}
            </div>
            <div style={{ fontSize: 11, color: B.gray }}>
              {a.category_slug || "—"} ·{" "}
              <span style={{ color: STATUS_COLORS[a.status] || B.gray, fontWeight: 600 }}>{a.status}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => startEdit(a)}
              style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, border: "none", background: B.orangeSoft, color: B.orange, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
            >Edytuj</button>
            <ConfirmButton label="Usuń" confirmLabel="Usuń" onClick={() => del(a.id)} danger />
          </div>
        </div>
      ))}

      {articles.length === 0 && !editing && (
        <div style={{ color: B.gray, textAlign: "center", padding: 32 }}>Brak artykułów</div>
      )}
    </div>
  );
}

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────
export default function Admin() {
  const { isAdmin, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState("users");

  useEffect(() => {
    if (!isLoading && !isAdmin) navigate("/");
  }, [isAdmin, isLoading]);

  if (isLoading) return null;
  if (!isAdmin) return null;

  return (
    <div style={{ padding: "0 0 60px" }}>
      {/* Nagłówek */}
      <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${B.border}` }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>Panel admina</h1>
        <p style={{ fontSize: 12, color: B.gray, marginTop: 4 }}>bizarriusz.club</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, padding: "12px 16px", overflowX: "auto", borderBottom: `1px solid ${B.border}` }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "7px 16px", borderRadius: 20, border: "none",
              whiteSpace: "nowrap", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              background: tab === t.id ? B.orange : B.grayLight,
              color: tab === t.id ? "white" : B.gray,
              flexShrink: 0,
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 0" }}>
        {tab === "users" && <UsersTab />}
        {tab === "ogloszenia" && <OgloszeniaTab />}
        {tab === "czat" && <CzatTab />}
        {tab === "info" && <InfoTab />}
      </div>
    </div>
  );
}
