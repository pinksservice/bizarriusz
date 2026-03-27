import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAds } from "../hooks/use-ads";
import { useAuth } from "../hooks/use-auth";
import { apiRequest, queryClient } from "../lib/queryClient";
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

const CATEGORIES = ["Swing", "BDSM", "LGBT", "Inne"];

function NewAdForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Inne");
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/ads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      onClose();
    },
    onError: (err: any) => setError(err.message || "Błąd podczas dodawania"),
  });

  const inp = { padding: "13px 16px", borderRadius: 14, border: `1.5px solid ${B.border}`, background: B.bg, fontSize: 15, color: B.ink, outline: "none", width: "100%", fontFamily: "inherit", boxSizing: "border-box" as const };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: B.bg, borderRadius: "28px 28px 0 0", padding: 24, paddingBottom: 32, width: "100%", maxWidth: 520, maxHeight: "calc(90vh - 80px)", overflowY: "auto", marginBottom: 80 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: B.ink, margin: 0 }}>Nowe ogłoszenie</h2>
          <button onClick={onClose} style={{ background: B.grayLight, border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, cursor: "pointer", color: B.gray }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input style={inp} placeholder="Tytuł *" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
          <textarea style={{ ...inp, minHeight: 100, resize: "vertical" }} placeholder="Opis *" value={description} onChange={e => setDescription(e.target.value)} maxLength={1000} />
          <select style={inp} value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input style={inp} placeholder="Lokalizacja (opcjonalnie)" value={location} onChange={e => setLocation(e.target.value)} maxLength={80} />
          <input style={inp} placeholder="Kontakt (opcjonalnie)" value={contactInfo} onChange={e => setContactInfo(e.target.value)} maxLength={100} />
          {error && <p style={{ color: "#E53E3E", fontSize: 13, margin: 0 }}>{error}</p>}
          <button
            onClick={() => mutation.mutate({ title, description, category, location, contactInfo })}
            disabled={mutation.isPending || !title.trim() || !description.trim()}
            style={{ padding: 16, borderRadius: 14, background: B.orange, color: "white", border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer", opacity: mutation.isPending ? 0.7 : 1 }}
          >
            {mutation.isPending ? "Dodawanie…" : "Dodaj ogłoszenie"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactModal({ ad, onClose }: { ad: any; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: B.bg, borderRadius: 24, padding: 28, width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: B.ink, margin: 0 }}>Kontakt</h2>
          <button onClick={onClose} style={{ background: B.grayLight, border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 18, cursor: "pointer", color: B.gray }}>×</button>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: B.ink, marginBottom: 8 }}>{ad.title}</div>
        {ad.contactInfo ? (
          <div style={{ background: B.grayLight, borderRadius: 14, padding: "14px 16px", fontSize: 15, color: B.ink, wordBreak: "break-all" as const }}>
            {ad.contactInfo}
          </div>
        ) : (
          <p style={{ color: B.gray, fontSize: 14 }}>Autor nie podał danych kontaktowych. Napisz do niego na czacie ogólnym.</p>
        )}
        <button onClick={onClose} style={{ marginTop: 20, width: "100%", padding: 14, borderRadius: 14, background: B.ink, color: "white", border: "none", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Zamknij</button>
      </div>
    </div>
  );
}

export default function Ogloszenia() {
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [contactAd, setContactAd] = useState<any>(null);
  const { isAuthenticated, user } = useAuth();
  const { data: ads = [], isLoading } = useAds({ category: filter === "all" ? undefined : filter });

  return (
    <div style={{ padding: 16 }}>
      {showForm && <NewAdForm onClose={() => setShowForm(false)} />}
      {contactAd && <ContactModal ad={contactAd} onClose={() => setContactAd(null)} />}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 4, color: B.ink }}>Ogłoszenia</h1>
        <p style={{ color: B.gray, margin: 0 }}>Szukasz kogoś? Tu jest najlepsze miejsce.</p>
      </div>
      {isAuthenticated && (
        <button onClick={() => setShowForm(true)} style={{ position: "fixed", bottom: "calc(80px + env(safe-area-inset-bottom))", right: 20, zIndex: 1050, width: 56, height: 56, borderRadius: "50%", background: B.orange, color: "white", border: "none", fontSize: 28, fontWeight: 300, cursor: "pointer", boxShadow: "0 4px 20px rgba(255,107,53,.5)", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
          +
        </button>
      )}
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
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setContactAd(ad)} style={{ flex: 1, padding: 12, borderRadius: 12, background: B.ink, color: "white", border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    ✉️ Napisz wiadomość
                  </button>
                  {ad.authorUuid === user?.id && (
                    <button
                      onClick={async () => {
                        if (!confirm("Usunąć to ogłoszenie?")) return;
                        await apiRequest("DELETE", `/api/ads/${ad.id}`);
                        queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
                      }}
                      style={{ padding: 12, borderRadius: 12, background: "#FFF0EE", border: "1.5px solid #FFCDC7", color: "#E53E3E", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                      🗑️
                    </button>
                  )}
                </div>
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
