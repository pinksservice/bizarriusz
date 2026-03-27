import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "../lib/supabase";
import { B } from "../layout/BizLayout";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Sprawdź skrzynkę email – wysłaliśmy link aktywacyjny.");
      }
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  };

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8, color: B.ink }}>
          {mode === "login" ? "Zaloguj się" : "Rejestracja"}
        </h1>
        <p style={{ color: B.gray, fontSize: 14, marginBottom: 32 }}>
          {mode === "login" ? "Nie masz konta? " : "Masz już konto? "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setInfo(""); }}
            style={{ background: "none", border: "none", color: B.orange, fontWeight: 700, cursor: "pointer", fontSize: 14, padding: 0 }}
          >
            {mode === "login" ? "Zarejestruj się" : "Zaloguj się"}
          </button>
        </p>

        <button
          onClick={handleGoogle}
          style={{ width: "100%", padding: "14px 20px", borderRadius: 14, border: `1.5px solid ${B.border}`, background: B.card, color: B.ink, fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Kontynuuj z Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: B.border }} />
          <span style={{ fontSize: 12, color: B.gray }}>lub</span>
          <div style={{ flex: 1, height: 1, background: B.border }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            type="email"
            placeholder="Adres email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ padding: "14px 16px", borderRadius: 14, border: `1.5px solid ${B.border}`, background: B.bg, fontSize: 15, color: B.ink, outline: "none" }}
          />
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={e => setPassword(e.target.value)}
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
            {loading ? "Chwila…" : mode === "login" ? "Zaloguj się" : "Zarejestruj się"}
          </button>
        </form>
      </div>
    </div>
  );
}
