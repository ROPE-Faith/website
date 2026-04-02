"use client";
import { useState, useRef } from "react";

type Theme = "cream" | "dark" | "white";
type Size = "story" | "square";

const THEMES: Record<Theme, { bg: string; text: string; muted: string; accent: string }> = {
  cream: { bg: "#f5efe3", text: "#2e2418", muted: "#9a8e7a", accent: "#c4a265" },
  dark: { bg: "#1a1714", text: "#f5efe3", muted: "#8a7e6a", accent: "#c4a265" },
  white: { bg: "#ffffff", text: "#1a1a1a", muted: "#888888", accent: "#c4a265" },
};

export default function ShareCard({ verse, reference, reflection, onClose }: {
  verse: string; reference: string; reflection?: string; onClose: () => void;
}) {
  const [theme, setTheme] = useState<Theme>("cream");
  const [size, setSize] = useState<Size>("square");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const t = THEMES[theme];
  const w = 1080;
  const h = size === "story" ? 1920 : 1080;

  async function generateAndDownload() {
    // Ensure fonts are loaded before drawing
    if (typeof document !== "undefined") {
      await document.fonts.ready;
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle border
    ctx.strokeStyle = t.accent + "30";
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, w - 120, h - 120);

    // Cross icon at top
    const crossY = size === "story" ? 240 : 160;
    ctx.fillStyle = t.accent + "40";
    ctx.fillRect(w / 2 - 4, crossY, 8, 60);
    ctx.fillRect(w / 2 - 25, crossY + 15, 50, 8);

    // Verse text - scaled up for 1080px
    ctx.fillStyle = t.text;
    ctx.font = "italic 64px Georgia, serif";
    ctx.textAlign = "center";
    const verseY = size === "story" ? 500 : 380;
    const maxWidth = w - 240;
    const lines = wrapText(ctx, `\u201C${verse}\u201D`, maxWidth);
    lines.forEach((line, i) => {
      ctx.fillText(line, w / 2, verseY + i * 82);
    });

    // Reference - scaled up
    const refY = verseY + lines.length * 82 + 60;
    ctx.fillStyle = t.muted;
    ctx.font = "32px Inter, sans-serif";
    ctx.fillText(`\u2014 ${reference}`, w / 2, refY);

    // Reflection (if present) - scaled up
    if (reflection) {
      const reflY = refY + 100;
      ctx.fillStyle = t.text + "cc";
      ctx.font = "42px Inter, sans-serif";
      const reflLines = wrapText(ctx, reflection, maxWidth - 80);
      reflLines.slice(0, 6).forEach((line, i) => {
        ctx.fillText(line, w / 2, reflY + i * 60);
      });
    }

    // ROPE branding at bottom
    const brandY = h - 140;
    ctx.fillStyle = t.accent;
    ctx.font = "bold 36px Georgia, serif";
    ctx.fillText("ROPE", w / 2, brandY);
    ctx.fillStyle = t.muted + "cc";
    ctx.font = "20px Inter, sans-serif";
    ctx.fillText("Revelation \u00B7 Observation \u00B7 Prayer \u00B7 Execution", w / 2, brandY + 40);

    // Reliable download with Blob
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `rope-${reference.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = url;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    }, "image/png");
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current ? current + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="bg-ivory dark:bg-[#231f1a] rounded-2xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto" style={{ animation: "fadeInUp 0.3s ease-out both" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-dark">Share Verse Card</h3>
          <button onClick={onClose} className="text-muted hover:text-dark transition text-xl leading-none">&times;</button>
        </div>

        {/* Preview */}
        <div className="rounded-xl overflow-hidden mb-4 border border-brown/10" style={{ background: t.bg, aspectRatio: size === "story" ? "9/16" : "1/1", padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: t.accent + "60", fontSize: "0.6rem", marginBottom: "0.75rem" }}>&#x271D;</div>
          <p style={{ color: t.text, fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "0.7rem", textAlign: "center", lineHeight: 1.6, maxWidth: "85%" }}>
            &ldquo;{verse.length > 150 ? verse.slice(0, 150) + "..." : verse}&rdquo;
          </p>
          <p style={{ color: t.muted, fontSize: "0.45rem", marginTop: "0.5rem" }}>&mdash; {reference}</p>
          {reflection && <p style={{ color: t.text + "aa", fontSize: "0.45rem", marginTop: "0.5rem", textAlign: "center", maxWidth: "80%" }}>{reflection.length > 80 ? reflection.slice(0, 80) + "..." : reflection}</p>}
          <div style={{ marginTop: "auto", paddingTop: "0.75rem" }}>
            <p style={{ color: t.accent, fontFamily: "Georgia, serif", fontWeight: "bold", fontSize: "0.5rem" }}>ROPE</p>
          </div>
        </div>

        {/* Theme selector */}
        <div className="flex gap-2 mb-3">
          {(["cream", "dark", "white"] as Theme[]).map(th => (
            <button key={th} onClick={() => setTheme(th)} className={`flex-1 py-2 text-xs rounded-lg border transition ${theme === th ? "border-brown text-dark font-medium" : "border-brown/10 text-muted"}`}>
              {th.charAt(0).toUpperCase() + th.slice(1)}
            </button>
          ))}
        </div>

        {/* Size selector */}
        <div className="flex gap-2 mb-4">
          {(["square", "story"] as Size[]).map(s => (
            <button key={s} onClick={() => setSize(s)} className={`flex-1 py-2 text-xs rounded-lg border transition ${size === s ? "border-brown text-dark font-medium" : "border-brown/10 text-muted"}`}>
              {s === "square" ? "Square (1:1)" : "Story (9:16)"}
            </button>
          ))}
        </div>

        {/* Download button */}
        <button onClick={generateAndDownload} className="w-full btn-primary py-3 text-center text-sm">
          Download Card
        </button>
      </div>
    </div>
  );
}
