import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/use-auth";
import { apiRequest } from "../lib/queryClient";
import { B } from "../layout/BizLayout";
import type { UserGalleryPhoto } from "@shared/schema";
import { subscribePush, getExistingSubscription, unsubscribePush } from "../lib/notifications";

const inp: React.CSSProperties = {
  padding: "13px 16px", borderRadius: 14, border: `1.5px solid ${B.border}`,
  background: B.bg, fontSize: 15, color: B.ink, outline: "none",
  width: "100%", fontFamily: "inherit", boxSizing: "border-box",
};

const card: React.CSSProperties = {
  background: "#fff", border: `1.5px solid ${B.border}`, borderRadius: 20, padding: 20, marginBottom: 16,
};

const label: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: B.gray, marginBottom: 8,
  textTransform: "uppercase", letterSpacing: ".08em", display: "block",
};

export default function Profil() {
  const { user, isLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [about, setAbout] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [notifStatus, setNotifStatus] = useState<"unknown" | "enabled" | "disabled" | "denied" | "unsupported">("unknown");

  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const { data: gallery = [] } = useQuery<UserGalleryPhoto[]>({
    queryKey: ["/api/gallery"],
    enabled: !!user,
  });

  const { data: vapidData } = useQuery<{ publicKey: string }>({
    queryKey: ["/api/push/public-key"],
    enabled: !!user,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setNotifStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setNotifStatus("denied");
      return;
    }
    getExistingSubscription().then(sub => {
      setNotifStatus(sub ? "enabled" : "disabled");
    }).catch(() => {
      setNotifStatus("disabled");
    });
  }, []);

  const handleToggleNotifications = async () => {
    if (notifStatus === "enabled") {
      await unsubscribePush();
      await apiRequest("DELETE", "/api/push/unsubscribe", {});
      setNotifStatus("disabled");
      return;
    }
    if (!vapidData?.publicKey) return;
    const permission = await Notification.requestPermission();
    if (permission === "denied") { setNotifStatus("denied"); return; }
    const sub = await subscribePush(vapidData.publicKey);
    if (!sub) return;
    const subJson = sub.toJSON();
    await apiRequest("POST", "/api/push/subscribe", {
      endpoint: sub.endpoint,
      keys: { p256dh: subJson.keys?.p256dh, auth: subJson.keys?.auth },
    });
    setNotifStatus("enabled");
  };

  const deletePhotoMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/gallery/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/gallery"] }),
  });

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [user, isLoading]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const m = session?.user?.user_metadata || {};
      setDisplayName(m.full_name || m.name || "");
      setAge(m.age ? String(m.age) : "");
      setHeight(m.height ? String(m.height) : "");
      setWeight(m.weight ? String(m.weight) : "");
      setAbout(m.about || "");
      setLookingFor(m.looking_for || "");
      setAvatarUrl(m.avatar_url || "");
    });
  }, []);

  const handleSave = async () => {
    setSaving(true); setInfo(""); setError("");
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: displayName,
        age: age ? Number(age) : null,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
        about,
        looking_for: lookingFor,
        avatar_url: avatarUrl,
      },
    });
    setSaving(false);
    if (error) setError(error.message);
    else setInfo("Zapisano!");
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true); setError("");
    const ext = file.name.split(".").pop();
    const path = `${(user as any).id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setError(upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = data.publicUrl + "?t=" + Date.now();
    setAvatarUrl(url);
    await supabase.auth.updateUser({ data: { avatar_url: url } });
    setUploading(false);
  };

  const handleGalleryPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = "";
    if (gallery.length >= 5) { setError("Maksymalnie 5 zdjęć w galerii"); return; }
    setGalleryUploading(true); setError("");
    const ext = file.name.split(".").pop();
    const path = `${(user as any).id}/gallery/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: false });
    if (upErr) { setError(upErr.message); setGalleryUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await apiRequest("POST", "/api/gallery", { imageUrl: data.publicUrl });
    qc.invalidateQueries({ queryKey: ["/api/gallery"] });
    setGalleryUploading(false);
  };

  if (isLoading) return null;

  const initials = (displayName || (user as any)?.email || "?")[0].toUpperCase();

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>
      {/* Avatar */}
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", background: B.orange, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `3px solid ${B.orange}` }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 32, fontWeight: 800, color: "white" }}>{initials}</span>
            )}
          </div>
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: "50%", background: B.ink, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid white" }}
            onClick={() => fileRef.current?.click()}>
            <span style={{ fontSize: 11, color: "white" }}>✎</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: B.ink }}>{displayName || "Brak nazwy"}</div>
          <div style={{ fontSize: 13, color: B.gray, marginTop: 2 }}>{(user as any)?.email}</div>
          {uploading && <div style={{ fontSize: 12, color: B.orange, marginTop: 4 }}>Przesyłanie…</div>}
          <div style={{ fontSize: 12, color: B.gray, marginTop: 4 }}>Kliknij zdjęcie, aby zmienić</div>
        </div>
      </div>

      {/* Podstawowe dane */}
      <div style={card}>
        <span style={label}>Wyświetlana nazwa</span>
        <input style={inp} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Twoja nazwa w czacie" maxLength={50} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
          <div>
            <span style={label}>Wiek</span>
            <input style={inp} type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="np. 28" min={18} max={99} />
          </div>
          <div>
            <span style={label}>Wzrost (cm)</span>
            <input style={inp} type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="np. 180" min={140} max={220} />
          </div>
          <div>
            <span style={label}>Waga (kg)</span>
            <input style={inp} type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="np. 75" min={40} max={200} />
          </div>
        </div>
      </div>

      {/* O mnie */}
      <div style={card}>
        <span style={label}>O mnie</span>
        <textarea
          value={about}
          onChange={e => setAbout(e.target.value)}
          placeholder="Kilka słów o sobie…"
          maxLength={500}
          rows={3}
          style={{ ...inp, resize: "vertical" as const, minHeight: 80 }}
        />
        <div style={{ fontSize: 11, color: B.gray, marginTop: 4, textAlign: "right" }}>{about.length}/500</div>
      </div>

      {/* Czego szukam */}
      <div style={card}>
        <span style={label}>Czego szukam</span>
        <textarea
          value={lookingFor}
          onChange={e => setLookingFor(e.target.value)}
          placeholder="Co Cię interesuje, czego szukasz…"
          maxLength={500}
          rows={3}
          style={{ ...inp, resize: "vertical" as const, minHeight: 80 }}
        />
        <div style={{ fontSize: 11, color: B.gray, marginTop: 4, textAlign: "right" }}>{lookingFor.length}/500</div>
      </div>

      {/* Galeria prywatna */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={label}>Galeria prywatna ({gallery.length}/5)</span>
          {gallery.length < 5 && (
            <button
              onClick={() => galleryRef.current?.click()}
              disabled={galleryUploading}
              style={{ padding: "6px 14px", borderRadius: 10, background: B.orange, color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: galleryUploading ? 0.6 : 1, fontFamily: "inherit" }}
            >
              {galleryUploading ? "Przesyłanie…" : "+ Dodaj zdjęcie"}
            </button>
          )}
        </div>
        <input ref={galleryRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleGalleryPhoto} />
        {gallery.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: B.gray, fontSize: 13 }}>
            Brak zdjęć. Możesz dodać do 5 zdjęć.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {gallery.map(photo => (
              <div key={photo.id} style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "1", background: B.grayLight }}>
                <img src={photo.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  onClick={() => deletePhotoMutation.mutate(photo.id)}
                  style={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", color: "white", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 11, color: B.gray, marginTop: 8 }}>
          Zdjęcia z galerii możesz wysyłać w prywatnych wiadomościach.
        </div>
      </div>

      {info && <p style={{ color: B.green, fontSize: 14, fontWeight: 600, marginBottom: 12, marginTop: -8 }}>✓ {info}</p>}
      {error && <p style={{ color: "#E53E3E", fontSize: 13, marginBottom: 12, marginTop: -8 }}>{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ width: "100%", padding: 16, borderRadius: 16, background: B.orange, color: "white", border: "none", fontWeight: 700, fontSize: 16, cursor: "pointer", opacity: saving ? 0.7 : 1, fontFamily: "inherit", marginBottom: 12 }}
      >
        {saving ? "Zapisuję…" : "Zapisz profil"}
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notifStatus !== "unknown" && notifStatus !== "unsupported" && (
          <button
            onClick={handleToggleNotifications}
            disabled={notifStatus === "denied"}
            style={{
              padding: 16, borderRadius: 16, fontFamily: "inherit", fontSize: 15, fontWeight: 600,
              cursor: notifStatus === "denied" ? "default" : "pointer", textAlign: "left" as const,
              background: notifStatus === "enabled" ? B.orangeSoft : B.card,
              border: `1.5px solid ${notifStatus === "enabled" ? B.orange : B.border}`,
              color: notifStatus === "denied" ? B.gray : B.ink,
              opacity: notifStatus === "denied" ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <span>{notifStatus === "enabled" ? "🔔 Powiadomienia włączone" : notifStatus === "denied" ? "🔕 Powiadomienia zablokowane" : "🔕 Włącz powiadomienia"}</span>
            {notifStatus !== "denied" && (
              <span style={{ fontSize: 12, color: notifStatus === "enabled" ? B.orange : B.gray, fontWeight: 700 }}>
                {notifStatus === "enabled" ? "Wyłącz" : "Włącz"}
              </span>
            )}
          </button>
        )}
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
