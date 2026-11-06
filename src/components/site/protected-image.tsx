"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** key in src/lib/media.ts — the ONLY reference the client ever sees */
  id: string;
  alt: string;
  className?: string; // container classes (must resolve to a sized box)
  placeholderClassName?: string;
  /** fetch immediately instead of waiting for intersection */
  priority?: boolean;
  children?: React.ReactNode; // overlay rendered ABOVE the protection layer
};

/**
 * ProtectedImage — renders media on a <canvas>, never an <img>.
 * The image bytes are fetched from /api/media/[id] (same-origin, watermarked)
 * and drawn off-DOM, so there is no src to copy, no <img> to drag out,
 * and nothing in the context menu. A transparent shield <div> sits on top
 * and all drag/context events are swallowed.
 */
export function ProtectedImage({
  id,
  alt,
  className = "",
  placeholderClassName = "bg-neutral-200",
  priority = false,
  children,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bmpRef = useRef<ImageBitmap | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    let aborted = false;
    let raf = 0;

    const draw = () => {
      const bmp = bmpRef.current;
      if (!bmp || !canvas) return;
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.max(1, Math.round(rect.width * dpr));
      const ch = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      const s = Math.max(cw / bmp.width, ch / bmp.height);
      const dw = bmp.width * s;
      const dh = bmp.height * s;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(bmp, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };

    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(wrap);

    const load = async () => {
      try {
        const res = await fetch(`/api/media/${id}`);
        if (!res.ok) return;
        const blob = await res.blob();
        const bmp = await createImageBitmap(blob);
        if (aborted) {
          bmp.close();
          return;
        }
        bmpRef.current = bmp;
        setLoaded(true);
        draw();
      } catch {
        /* network hiccup — placeholder stays */
      }
    };

    if (priority) {
      load();
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io.disconnect();
            load();
          }
        },
        { rootMargin: "400px" }
      );
      io.observe(wrap);
      return () => {
        aborted = true;
        io.disconnect();
        ro.disconnect();
        cancelAnimationFrame(raf);
      };
    }

    return () => {
      aborted = true;
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [id, priority]);

  return (
    <div
      ref={wrapRef}
      data-protected
      className={`relative select-none overflow-hidden ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div
        aria-hidden
        className={`absolute inset-0 transition-opacity duration-700 ${placeholderClassName} ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
      />
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={alt}
        className="block h-full w-full"
      />
      {/* shield: swallows long-press / touch popups on iOS */}
      <div aria-hidden className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
      {children ? (
        <div className="absolute inset-0 z-20">{children}</div>
      ) : null}
    </div>
  );
}
