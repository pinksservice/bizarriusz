import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";

export const B = {
  bg: "#FFFEF9",
  ink: "#0D0D0D",
  orange: "#FFC824",
  orangeSoft: "rgba(255,200,36,.10)",
  orangeMid: "rgba(255,200,36,.18)",
  gray: "#787878",
  grayLight: "#F4F4F0",
  border: "rgba(13,13,13,.08)",
  card: "#FFFFFF",
  green: "#00C27A",
} as const;

const NAV = [
  {
    href: "/",
    label: "Dziś",
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    href: "/repertuar",
    label: "Repertuar",
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/galeria",
    label: "Galeria",
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  {
    href: "/grupy",
    label: "Grupy",
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.85" />
      </svg>
    ),
  },
  {
    href: "/ogloszenia",
    label: "Ogłoszenia",
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/info",
    label: "Info",
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
];

function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: B.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: B.bg, borderRadius: 32, padding: "48px 36px", maxWidth: 400, width: "100%", textAlign: "center" }}>
        <span style={{ fontSize: 64, display: "block", marginBottom: 20 }}>🔞</span>
        <h2 style={{ fontFamily: "system-ui,-apple-system,sans-serif", fontSize: 34, fontWeight: 800, marginBottom: 12, letterSpacing: -1, color: B.ink }}>Chwila.</h2>
        <p style={{ fontSize: 14, color: B.gray, lineHeight: 1.8, marginBottom: 32 }}>
          Ta strona jest przeznaczona tylko dla osób pełnoletnich. Wchodząc potwierdzasz że masz ukończone 18 lat.
        </p>
        <button
          onClick={onConfirm}
          style={{ display: "block", width: "100%", padding: 18, borderRadius: 16, background: B.orange, color: "white", border: "none", fontFamily: "system-ui,sans-serif", fontSize: 18, fontWeight: 700, cursor: "pointer", marginBottom: 10, letterSpacing: -0.3 }}
        >
          Mam 18 lat – wchodzę →
        </button>
        <button
          onClick={() => { window.location.href = "https://google.com"; }}
          style={{ display: "block", width: "100%", padding: 14, borderRadius: 16, background: B.grayLight, color: B.gray, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          Nie, wychodzę
        </button>
      </div>
    </div>
  );
}

const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

export function BizLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  const { isAuthenticated } = useAuth();
  const [ageConfirmed, setAgeConfirmed] = useState(() => {
    try { return localStorage.getItem("biz_age") === "1"; } catch { return false; }
  });

  const handleAgeConfirm = () => {
    try { localStorage.setItem("biz_age", "1"); } catch {}
    setAgeConfirmed(true);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <style>{`
        .biz-root {
          background: ${B.bg};
          color: ${B.ink};
          min-height: 100dvh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow-x: hidden;
        }

        /* ── MOBILE (default) ── */
        .biz-sidebar { display: none; }
        .biz-topbar { display: flex; }
        .biz-bottom-nav { display: flex; }
        .biz-content { padding-bottom: 80px; }

        /* ── DESKTOP ── */
        @media (min-width: 768px) {
          .biz-root {
            display: flex;
            align-items: flex-start;
          }
          .biz-sidebar {
            display: flex;
            flex-direction: column;
            position: sticky;
            top: 0;
            height: 100dvh;
            width: 220px;
            flex-shrink: 0;
            background: rgba(255,254,249,.96);
            backdrop-filter: blur(20px);
            border-right: 1px solid ${B.border};
            padding: 28px 16px 24px;
            z-index: 100;
            gap: 4px;
            overflow-y: auto;
          }
          .biz-sidebar-logo {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: ${B.ink};
            text-decoration: none;
            margin-bottom: 24px;
            padding: 0 8px;
            display: block;
          }
          .biz-sidebar-profile {
            margin-top: auto;
            padding: 12px 8px 0;
            border-top: 1px solid ${B.border};
          }
          .biz-topbar { display: none; }
          .biz-bottom-nav { display: none; }
          .biz-content {
            flex: 1;
            min-width: 0;
            max-width: 680px;
            margin: 0 auto;
            padding: 24px 24px 24px 24px;
          }
        }
      `}</style>

      <div className="biz-root">
        {!ageConfirmed && <AgeGate onConfirm={handleAgeConfirm} />}

        {/* Sidebar (desktop) */}
        <nav className="biz-sidebar">
          <Link href="/" className="biz-sidebar-logo">
            Bizarr<span style={{ color: B.orange }}>i</span>usz
          </Link>

          {NAV.map(({ href, label, icon }) => {
            const isActive = location === href || (href !== "/" && location.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 12px", borderRadius: 14, textDecoration: "none",
                  color: isActive ? B.ink : B.gray,
                  background: isActive ? B.orangeSoft : "transparent",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 14, transition: "background .15s, color .15s",
                }}
              >
                <span style={{ color: isActive ? B.orange : "currentColor", display: "flex" }}>{icon}</span>
                {label}
              </Link>
            );
          })}

          <div className="biz-sidebar-profile">
            <div style={{ display: "flex", gap: 8 }}>
              <Link
                href={isAuthenticated ? "/profil" : "/login"}
                style={{ flex: 1, display: "block", padding: "10px 12px", borderRadius: 14, background: B.ink, color: "white", textDecoration: "none", fontWeight: 700, fontSize: 13, textAlign: "center" }}
              >
                {isAuthenticated ? "Mój profil" : "Zaloguj →"}
              </Link>
              {isAuthenticated && (
                <Link
                  href="/wiadomosci"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 42, borderRadius: 14,
                    background: location === "/wiadomosci" ? B.orangeSoft : B.grayLight,
                    color: location === "/wiadomosci" ? B.orange : B.gray,
                    textDecoration: "none",
                  }}
                >
                  <MailIcon />
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Top bar (mobile) */}
        <div className="biz-topbar" style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,254,249,.88)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${B.border}`, padding: "0 16px", alignItems: "center", height: 58, gap: 10 }}>
          <Link href="/" style={{ textDecoration: "none", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", fontSize: 22, fontWeight: 800, color: B.ink, letterSpacing: -0.5, marginRight: "auto" }}>
            Bizarr<span style={{ color: B.orange }}>i</span>usz
          </Link>
          {isAuthenticated && (
            <Link
              href="/wiadomosci"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 38, height: 38, borderRadius: "50%",
                background: location === "/wiadomosci" ? B.orangeSoft : B.grayLight,
                color: location === "/wiadomosci" ? B.orange : B.gray,
                textDecoration: "none",
              }}
            >
              <MailIcon />
            </Link>
          )}
          <Link
            href={isAuthenticated ? "/profil" : "/login"}
            style={{ fontSize: 12, fontWeight: 700, background: B.ink, color: "white", borderRadius: 20, padding: "7px 16px", textDecoration: "none", letterSpacing: -0.2 }}
          >
            {isAuthenticated ? "Mój profil" : "Zaloguj →"}
          </Link>
        </div>

        <main className="biz-content">{children}</main>

        {/* Bottom nav (mobile) */}
        <nav className="biz-bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,254,249,.92)", backdropFilter: "saturate(180%) blur(20px)", borderTop: `1px solid ${B.border}`, paddingBottom: "env(safe-area-inset-bottom)", zIndex: 1000 }}>
          <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", justifyContent: "space-around", padding: "8px 0 6px", width: "100%" }}>
            {NAV.map(({ href, label, icon }) => {
              const isActive = location === href || (href !== "/" && location.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0", textDecoration: "none", color: isActive ? B.orange : B.gray, transition: "color .2s" }}
                >
                  <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {icon}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 600 }}>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}