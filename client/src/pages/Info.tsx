import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { B } from "../layout/BizLayout";

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
  created_at: string;
  tags: string[] | null;
  category_slug: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

function ArticleView({ article, onBack }: { article: Article; onBack: () => void }) {
  // Very basic markdown-like rendering: **bold**, # headings, - lists, line breaks
  const render = (md: string) => {
    const lines = md.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.startsWith("# ")) {
        elements.push(<h1 key={i} style={{ fontSize: 22, fontWeight: 800, margin: "20px 0 8px", letterSpacing: -0.5 }}>{line.slice(2)}</h1>);
      } else if (line.startsWith("## ")) {
        elements.push(<h2 key={i} style={{ fontSize: 17, fontWeight: 700, margin: "16px 0 6px" }}>{line.slice(3)}</h2>);
      } else if (line.startsWith("### ")) {
        elements.push(<h3 key={i} style={{ fontSize: 15, fontWeight: 700, margin: "12px 0 4px" }}>{line.slice(4)}</h3>);
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        const items: string[] = [];
        while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
          items.push(lines[i].slice(2));
          i++;
        }
        elements.push(
          <ul key={i} style={{ paddingLeft: 20, margin: "8px 0", display: "flex", flexDirection: "column", gap: 4 }}>
            {items.map((it, j) => <li key={j} style={{ fontSize: 14, lineHeight: 1.7, color: B.ink }}>{renderInline(it)}</li>)}
          </ul>
        );
        continue;
      } else if (line.trim() === "") {
        elements.push(<div key={i} style={{ height: 8 }} />);
      } else {
        elements.push(<p key={i} style={{ fontSize: 14, lineHeight: 1.8, margin: "4px 0", color: B.ink }}>{renderInline(line)}</p>);
      }
      i++;
    }
    return elements;
  };

  const renderInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
      if (p.startsWith("*") && p.endsWith("*")) return <em key={i}>{p.slice(1, -1)}</em>;
      return p;
    });
  };

  return (
    <div style={{ padding: "16px 16px 40px", maxWidth: 680, margin: "0 auto" }}>
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", cursor: "pointer", color: B.gray, fontSize: 13, fontWeight: 600, padding: "4px 0", marginBottom: 16, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}
      >
        ← Powrót
      </button>

      {article.cover_image && (
        <img src={article.cover_image} alt="" style={{ width: "100%", borderRadius: 20, marginBottom: 20, objectFit: "cover", maxHeight: 300 }} />
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {article.featured && (
          <span style={{ fontSize: 11, fontWeight: 700, background: B.orangeSoft, color: B.orange, padding: "3px 10px", borderRadius: 20 }}>Wyróżniony</span>
        )}
        {article.category_slug && (
          <span style={{ fontSize: 11, fontWeight: 600, background: B.grayLight, color: B.gray, padding: "3px 10px", borderRadius: 20 }}>{article.category_slug}</span>
        )}
        {(article.tags || []).map(tag => (
          <span key={tag} style={{ fontSize: 11, background: B.grayLight, color: B.gray, padding: "3px 10px", borderRadius: 20 }}>{tag}</span>
        ))}
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8, marginBottom: 8, lineHeight: 1.3 }}>{article.title}</h1>

      <div style={{ fontSize: 12, color: B.gray, marginBottom: 20 }}>
        {article.author && <span>{article.author} · </span>}
        {formatDate(article.created_at)}
      </div>

      <div>{render(article.content || "")}</div>
    </div>
  );
}

export default function Info() {
  const [selected, setSelected] = useState<Article | null>(null);

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/blog"],
  });

  if (selected) return <ArticleView article={selected} onBack={() => setSelected(null)} />;

  const featured = articles.filter(a => a.featured);
  const rest = articles.filter(a => !a.featured);

  return (
    <div style={{ padding: "16px 16px 40px", maxWidth: 680, margin: "0 auto" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8, marginBottom: 4 }}>Info</h1>
      <p style={{ fontSize: 13, color: B.gray, marginBottom: 20 }}>Artykuły, porady i aktualności z Bizarriusz</p>

      {isLoading && (
        <div style={{ textAlign: "center", padding: 48, color: B.gray }}>Ładowanie…</div>
      )}

      {!isLoading && articles.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: B.gray }}>Brak artykułów</div>
      )}

      {featured.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {featured.map(article => (
            <div
              key={article.id}
              onClick={() => setSelected(article)}
              style={{
                background: B.orange, color: "white", borderRadius: 20,
                padding: 20, cursor: "pointer", marginBottom: 12,
                position: "relative", overflow: "hidden",
              }}
            >
              {article.cover_image && (
                <img src={article.cover_image} alt="" style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  objectFit: "cover", opacity: 0.25,
                }} />
              )}
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8, opacity: 0.8 }}>Wyróżniony</div>
                <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3, marginBottom: 8, letterSpacing: -0.5 }}>{article.title}</div>
                {article.excerpt && <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>{article.excerpt}</div>}
                <div style={{ fontSize: 11, marginTop: 12, opacity: 0.7 }}>{formatDate(article.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rest.map(article => (
          <div
            key={article.id}
            onClick={() => setSelected(article)}
            style={{
              background: B.card, border: `1px solid ${B.border}`, borderRadius: 16,
              padding: 16, cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start",
            }}
          >
            {article.cover_image && (
              <img src={article.cover_image} alt="" style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, lineHeight: 1.4 }}>{article.title}</div>
              {article.excerpt && <div style={{ fontSize: 12, color: B.gray, lineHeight: 1.6, marginBottom: 6 }}>{article.excerpt}</div>}
              <div style={{ fontSize: 11, color: B.gray }}>
                {article.author && <span>{article.author} · </span>}
                {formatDate(article.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
