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
  padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${B.border}`,
  background: B.bg, fontSize: 14, color: B.ink, outline: "none",
  width: "100%", fontFamily: "inherit", boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: B.gray, marginBottom: 5,
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

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setNotifStatus("unsupported"); return;
    }
    if (Notification.permission === "denied") { setNotifStatus("denied"); return; }
    getExistingSubscription().then(sub => setNotifStatus(sub ? "enabled" : "disabled")).catch(() => setNotifStatus("disabled"));
  }, []);

  const handleSave = async () => {
    setSaving(true); setInfo(""); setError("");
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName, age: age ? Number(age) : null, height: height ? Number(height) : null, weight: weight ? Number(weight) : null, about, looking_for: lookingFor, avatar_url: avatarUrl },
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
    if (gallery.length >= 5) { setError("Maksymalnie 5 zdjęć"); return; }
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

  const handleToggleNotifications = async () => {
    if (notifStatus === "enabled") {
      await unsubscribePush();
      await apiRequest("DELETE", "/api/push/unsubscribe", {});
      setNotifStatus("disabled"); return;
    }
    if (!vapidData?.publicKey) return;
    const permission = await Notification.requestPermission();
    if (permission === "denied") { setNotifStatus("denied"); return; }
    const sub = await subscribePush(vapidData.publicKey);
    if (!sub) return;
    const subJson = sub.toJSON();
    await apiRequest("POST", "/api/push/subscribe", { endpoint: sub.endpoint, keys: { p256dh: subJson.keys?.p256dh, auth: subJson.keys?.auth } });
    setNotifStatus("enabled");
  };

  if (isLoading) return null;
  const initials = (displayName || (user as any)?.email || "?")[0].toUpperCase();

  return (
    <div style={{ padding: "16px 16px 32px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Powiadomienia */}
      {notifStatus !== "unknown" && notifStatus !== "unsupported" && (
        <button onClick={handleToggleNotifications} disabled={notifStatus === "denied"}
          style={{ padding: "12px 16px", borderRadius: 14, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: notifStatus === "denied" ? "default" : "pointer", textAlign: "left" as const, background: notifStatus === "enabled" ? B.orangeSoft : B.grayLight, border: `1.5px solid ${notifStatus === "enabled" ? B.orange : B.border}`, color: notifStatus === "denied" ? B.gray : B.ink, opacity: notifStatus === "denied" ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span>{notifStatus === "enabled" ? "🔔 Powiadomienia włączone" : notifStatus === "denied" ? "🔕 Zablokowane w przeglądarce" : "🔕 Włącz powiadomienia"}</span>
          {notifStatus !== "denied" && <span style={{ fontSize: 11, color: notifStatus === "enabled" ? B.orange : B.gray, fontWeight: 700 }}>{notifStatus === "enabled" ? "Wyłącz" : "Włącz"}</span>}
        </button>
      )}

      {/* Avatar + nazwa */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ position: "relative", flexShrink: 0 }} onClick={() => fileRef.current?.click()}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", background: B.orange, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `3px solid ${B.orange}` }}>
            {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 26, fontWeight: 800, color: "white" }}>{initials}</span>}
          </div>
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderRadius: "50%", background: B.ink, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white", cursor: "pointer" }}>
            <span style={{ fontSize: 10, color: "white" }}>✎</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
        </div>
        <div style={{ flex: 1 }}>
          <input style={inp} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Wyświetlana nazwa" maxLength={50} />
          <div style={{ fontSize: 11, color: B.gray, marginTop: 4 }}>{uploading ? "Przesyłanie…" : (user as any)?.email}</div>
        </div>
      </div>

      {/* Wiek / wzrost / waga */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <div><span style={lbl}>Wiek</span><input style={inp} type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="28" min={18} max={99} /></div>
        <div><span style={lbl}>Wzrost cm</span><input style={inp} type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="180" min={140} max={220} /></div>
        <div><span style={lbl}>Waga kg</span><input style={inp} type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="75" min={40} max={200} /></div>
      </div>

      {/* O mnie */}
      <div>
        <span style={lbl}>O mnie</span>
        <textarea value={about} onChange={e => setAbout(e.target.value)} placeholder="Kilka słów o sobie…" maxLength={500} rows={3} style={{ ...inp, resize: "vertical" as const, minHeight: 72 }} />
      </div>

      {/* Czego szukam */}
      <div>
        <span style={lbl}>Czego szukam</span>
        <textarea value={lookingFor} onChange={e => setLookingFor(e.target.value)} placeholder="Co Cię interesuje…" maxLength={500} rows={3} style={{ ...inp, resize: "vertical" as const, minHeight: 72 }} />
      </div>

      {/* Galeria */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={lbl}>Galeria prywatna ({gallery.length}/5)</span>
          {gallery.length < 5 && (
            <button onClick={() => galleryRef.current?.click()} disabled={galleryUploading}
              style={{ padding: "5px 12px", borderRadius: 8, background: B.orange, color: "white", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: galleryUploading ? 0.6 : 1, fontFamily: "inherit" }}>
              {galleryUploading ? "…" : "+ Dodaj"}
            </button>
          )}
        </div>
        <input ref={galleryRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleGalleryPhoto} />
        {gallery.length === 0 ? (
          <div style={{ fontSize: 12, color: B.gray }}>Brak zdjęć — możesz wysyłać je w wiadomościach prywatnych.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {gallery.map(photo => (
              <div key={photo.id} style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "1", background: B.grayLight }}>
                <img src={photo.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={() => deletePhotoMutation.mutate(photo.id)}
                  style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", color: "white", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {info && <p style={{ color: B.green, fontSize: 13, fontWeight: 600, margin: 0 }}>✓ {info}</p>}
      {error && <p style={{ color: "#E53E3E", fontSize: 13, margin: 0 }}>{error}</p>}

      <button onClick={handleSave} disabled={saving}
        style={{ padding: 14, borderRadius: 14, background: B.orange, color: "white", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: saving ? 0.7 : 1, fontFamily: "inherit" }}>
        {saving ? "Zapisuję…" : "Zapisz profil"}
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => navigate("/reset-password")}
          style={{ padding: 13, borderRadius: 14, background: B.grayLight, border: "none", color: B.ink, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left" as const }}>
          🔑 Zmień hasło
        </button>
        <button onClick={() => logout()}
          style={{ padding: 13, borderRadius: 14, background: "#FFF0EE", border: "1.5px solid #FFCDC7", color: "#E53E3E", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Wyloguj się
        </button>
      </div>
    </div>
  );
}
