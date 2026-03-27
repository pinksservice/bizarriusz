import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "../lib/supabase";
import { B } from "../layout/BizLayout";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) { setError("Hasła nie są zgodne."); return; }
    if (password.length < 6) { setError("Hasło musi mieć co najmniej 6 znaków."); return; }
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setInfo("Hasło zmienione! Za chwilę przejdziesz do strony głównej.");
    setTimeout(() => navigate("/"), 2000);
  };

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8, color: B.ink }}>Nowe hasło</h1>
        <p style={{ color: B.gray, fontSize: 14, marginBottom: 32 }}>Wpisz nowe hasło dla swojego konta.</p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            type="password"
            placeholder="Nowe hasło (min. 6 znaków)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ padding: "14px 16px", borderRadius: 14, border: `1.5px solid ${B.border}`, background: B.bg, fontSize: 15, color: B.ink, outline: "none" }}
          />
          <input
            type="password"
            placeholder="Powtórz hasło"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            required
            style={{ padding: "14px 16px", borderRadius: 14, border: `1.5px solid ${B.border}`, background: B.bg, fontSize: 15, color: B.ink, outline: "none" }}
          />
          {error && <p style={{ color: "#E53E3E", fontSize: 13, margin: 0 }}>{error}</p>}
          {info && <p style={{ color: B.green, fontSize: 13, margin: 0 }}>{info}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ padding: 16, borderRadius: 14, background: B.orange, color: "white", border: "none", fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Zapisuję…" : "Zmień hasło"}
          </button>
        </form>
      </div>
    </div>
  );
}
