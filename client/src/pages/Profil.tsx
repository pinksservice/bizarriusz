import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/use-auth";
import { B } from "../layout/BizLayout";

export default function Profil() {
  const { user, isLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [user, isLoading]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const meta = session?.user?.user_metadata || {};
      setDisplayName(meta.full_name || meta.name || "");
    });
  }, []);

  const handleSave = async () => {
    setSaving(true); setInfo(""); setError("");
    const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } });
    setSaving(false);
    if (error) setError(error.message);
    else setInfo("Zapisano!");
  };

  if (isLoading) return null;

  const inp = { padding: "13px 16px", borderRadius: 14, border: `1.5px solid ${B.border}`, background: B.bg, fontSize: 15, color: B.ink, outline: "none", width: "100%", fontFamily: "inherit", boxSizing: "border-box" as const };

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 24, color: B.ink }}>Mój profil</h1>

      {/* Avatar + email */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: B.card, border: `1.5px solid ${B.border}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: B.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "white", flexShrink: 0 }}>
          {(displayName || user?.email || "?")[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: B.ink }}>{displayName || "Brak nazwy"}</div>
          <div style={{ fontSize: 13, color: B.gray, marginTop: 2 }}>{user?.email}</div>
        </div>
      </div>

      {/* Edit name */}
      <div style={{ background: B.card, border: `1.5px solid ${B.border}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: B.gray, marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: ".08em" }}>Wyświetlana nazwa</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input style={{ ...inp, flex: 1 }} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Twoja nazwa w czacie" maxLength={50} />
          <button onClick={handleSave} disabled={saving} style={{ padding: "13px 20px", borderRadius: 14, background: B.orange, color: "white", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0, opacity: saving ? 0.7 : 1, fontFamily: "inherit" }}>
            {saving ? "…" : "Zapisz"}
          </button>
        </div>
        {info && <p style={{ color: B.green, fontSize: 13, marginTop: 8, marginBottom: 0 }}>{info}</p>}
        {error && <p style={{ color: "#E53E3E", fontSize: 13, marginTop: 8, marginBottom: 0 }}>{error}</p>}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
        <button
          onClick={() => navigate("/reset-password")}
          style={{ padding: 16, borderRadius: 16, background: B.card, border: `1.5px solid ${B.border}`, color: B.ink, fontFamily: "inherit", fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "left" as const }}
        >
          🔑 Zmień hasło
        </button>
        <button
          onClick={() => logout()}
          style={{ padding: 16, borderRadius: 16, background: "#FFF0EE", border: "1.5px solid #FFCDC7", color: "#E53E3E", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
        >
          Wyloguj się
        </button>
      </div>
    </div>
  );
}
