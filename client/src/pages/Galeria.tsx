import { useState } from "react";
import { B } from "../layout/BizLayout";

const PHOTOS = [
  "IMG_1977.jpeg",
  "IMG_1979.jpeg",
  "IMG_1983.jpeg",
  "IMG_1985.jpeg",
  "IMG_1987.jpeg",
  "IMG_1988.jpeg",
  "IMG_1991.jpeg",
  "IMG_1993.jpeg",
  "IMG_1997.jpeg",
  "IMG_2001.jpeg",
  "IMG_2004.jpeg",
  "IMG_2005.jpeg",
  "IMG_2007.jpeg",
  "IMG_2012.jpeg",
  "IMG_2015.jpeg",
  "IMG_2018.jpeg",
  "IMG_2019.jpeg",
  "IMG_2021.jpeg",
  "IMG_2022.jpeg",
  "IMG_2024.jpeg",
  "IMG_2030.jpeg",
];

export default function Galeria() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ color: B.gray, fontSize: 14 }}>Wnętrza klubu Bizarriusz.</p>
      </div>

      {/* Privacy note */}
      <div style={{ background: B.orangeSoft, borderRadius: 14, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 20 }}>🔒</span>
        <span style={{ fontSize: 13, color: B.ink, fontWeight: 500 }}>
          Nie fotografujemy gości ani imprez. Twoja prywatność jest dla nas priorytetem.
        </span>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
        {PHOTOS.map((name) => (
          <div
            key={name}
            onClick={() => setLightbox(`/galeria/${name}`)}
            style={{ aspectRatio: "1", borderRadius: 12, overflow: "hidden", cursor: "pointer", background: B.border }}
          >
            <img
              src={`/galeria/${name}`}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 16,
          }}
        >
          <img
            src={lightbox}
            alt=""
            style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" }}
          />
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "rgba(255,255,255,0.15)", border: "none",
              color: "white", fontSize: 24, width: 44, height: 44,
              borderRadius: "50%", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>
      )}
    </div>
  );
}
