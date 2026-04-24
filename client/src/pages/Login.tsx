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
        window.location.href = "/";
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/profil",
          },
        });
        if (error) {
          if (error.message.toLowerCase().includes("already registered")) {
            setMode("login");
            setError("Ten email jest już zarejestrowany. Zaloguj się.");
          } else {
            throw error;
          }
          return;
        }
        setInfo("Sprawdź skrzynkę — wysłaliśmy link potwierdzający rejestrację.");
        setMode("login");
      }
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd");
    } finally {
      setLoading(false);
    }
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
          {mode === "login" && (
            <button
              type="button"
              onClick={async () => {
                if (!email) { setError("Wpisz email żeby zresetować hasło."); return; }
                setError(""); setLoading(true);
                const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
                setLoading(false);
                if (error) setError(error.message);
                else setInfo("Wysłaliśmy link do resetu hasła na " + email);
              }}
              style={{ background: "none", border: "none", color: B.gray, fontSize: 13, cursor: "pointer", textAlign: "right", padding: 0, alignSelf: "flex-end" }}
            >
              Nie pamiętam hasła
            </button>
          )}
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
