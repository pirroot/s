"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PRODUCTS } from "@/data/site";
import { ProductCard } from "./product-card";

/**
 * The catalogue row — the client's reference layout: one long horizontal
 * row of cards. Drag-to-scroll with the mouse, native swipe on touch,
 * hairline prev/next steppers, a thin progress bar, and edge fades that
 * hint there is more beyond the frame.
 */

export function ProductsRow() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  const sync = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const p = max > 0 ? el.scrollLeft / max : 0;
    setProgress(p);
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= max - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    /* initial measure deferred to the next frame — setState must not run
       synchronously inside the effect (react-hooks/set-state-in-effect);
       ResizeObserver also fires once on observe, this just keeps the first
       paint exact */
    const raf = requestAnimationFrame(sync);
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [sync]);

  /* drag-to-scroll (mouse); a click that follows a real drag is swallowed */
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return; // touch swipes natively
    const el = scrollerRef.current;
    if (!el) return;
    drag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const el = scrollerRef.current;
    const d = drag.current;
    if (!el || !d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 6) {
      d.moved = true;
      el.scrollLeft = d.left - dx;
    }
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current?.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current = null;
    }
  };

  const step = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const w = card ? card.offsetWidth + 20 : 380;
    el.scrollBy({ left: dir * w, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* edge fades */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-white to-transparent transition-opacity duration-500 ${
          atStart ? "opacity-0" : "opacity-100"
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-white to-transparent transition-opacity duration-500 ${
          atEnd ? "opacity-0" : "opacity-100"
        }`}
      />

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:px-10 [&::-webkit-scrollbar]:hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        style={{ cursor: "grab" }}
      >
        {PRODUCTS.map((p, i) => (
          <div key={p.slug} data-card className="snap-center">
            <ProductCard product={p} variant="catalogue" priority={i < 2} />
          </div>
        ))}
        <div aria-hidden className="w-[6vw] shrink-0" />
      </div>

      {/* hairline steppers + thin progress bar */}
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-5 pt-6 pb-16 md:px-10 md:pb-24">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous products"
            onClick={() => step(-1)}
            disabled={atStart}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 text-neutral-900 transition-colors hover:border-neutral-900 disabled:opacity-30 disabled:hover:border-neutral-300"
          >
            <span aria-hidden>←</span>
          </button>
          <button
            type="button"
            aria-label="Next products"
            onClick={() => step(1)}
            disabled={atEnd}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 text-neutral-900 transition-colors hover:border-neutral-900 disabled:opacity-30 disabled:hover:border-neutral-300"
          >
            <span aria-hidden>→</span>
          </button>
        </div>
        <div className="relative h-px flex-1 bg-neutral-200">
          <div
            aria-hidden
            className="absolute top-0 h-px bg-neutral-900 transition-[width,left] duration-200"
            style={{ width: "18%", left: `${progress * 82}%` }}
          />
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
          Drag · {Math.round(progress * 100)}%
        </p>
      </div>
    </div>
  );
}
