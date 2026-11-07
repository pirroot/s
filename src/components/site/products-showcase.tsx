"use client";

import { useEffect, useRef, useState } from "react";
import { PRODUCTS } from "@/data/site";
import { ProductCard } from "./product-card";
import { SectionHead, ArrowLink } from "./primitives";

/**
 * 01 — The products (homepage).
 *
 * Desktop (motion allowed): the row glides sideways slowly as the page
 * scrolls — a sticky runway, lerp-smoothed. Hovering a card raises its
 * details with a More-details link (see ProductCard).
 * Touch / reduced-motion: a native snap-swipe row, details always visible,
 * one tap opens the product page.
 */

type Mode = "scroll" | "row";

export function ProductsShowcase() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("row");

  /* mode: desktop + fine pointer + motion allowed → scroll-driven glide.
     The initial read is deferred to the next frame — setState must not run
     synchronously inside the effect (react-hooks/set-state-in-effect) */
  useEffect(() => {
    const mqTouch = window.matchMedia("(pointer: coarse)");
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const upd = () => setMode(mqTouch.matches || mqReduced.matches ? "row" : "scroll");
    const raf = requestAnimationFrame(upd);
    mqTouch.addEventListener("change", upd);
    mqReduced.addEventListener("change", upd);
    return () => {
      cancelAnimationFrame(raf);
      mqTouch.removeEventListener("change", upd);
      mqReduced.removeEventListener("change", upd);
    };
  }, []);

  /* scroll-driven glide, lerp-smoothed */
  useEffect(() => {
    if (mode !== "scroll") return;
    const runway = runwayRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!runway || !stage || !track) return;

    // if the row already fits, there is nothing to glide — the fallback is
    // deferred a frame so no setState runs synchronously in the effect
    const total = track.scrollWidth - stage.clientWidth;
    if (total <= 60) {
      const raf = requestAnimationFrame(() => setMode("row"));
      return () => cancelAnimationFrame(raf);
    }

    let target = 0;
    let current = -1; // force first paint to the true position
    let raf = 0;

    const measure = () => {
      const r = runway.getBoundingClientRect();
      const span = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / span));
      target = p * total;
    };

    const tick = () => {
      measure();
      if (current < 0) current = target;
      current += (target - current) * 0.075;
      if (Math.abs(target - current) < 0.2) current = target;
      track.style.transform = `translate3d(${-current}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  return (
    <section id="products" aria-label="The products" className="bg-white text-neutral-900">
      <div className="mx-auto max-w-[1400px] px-5 pt-20 md:px-10 md:pt-28">
        <SectionHead
          eyebrow="01 — The products"
          title={
            <>
              Five pieces, two
              <br />
              families of <em className="font-serif font-light italic">light.</em>
            </>
          }
          lede="Spun pendants and quiet wall cylinders in one monochrome language. Keep scrolling — the row glides with the page; hover a piece to meet it."
        />
      </div>

      {mode === "scroll" ? (
        /* ---- desktop: sticky runway, the row glides as the page scrolls ---- */
        <div ref={runwayRef} className="relative h-[240vh]">
          <div ref={stageRef} className="sticky top-0 flex h-screen items-center overflow-hidden">
            <div
              ref={trackRef}
              className="flex gap-5 pr-[14vw] pl-5 will-change-transform md:pl-10"
            >
              {PRODUCTS.map((p, i) => (
                <ProductCard key={p.slug} product={p} variant="showcase" priority={i < 2} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ---- touch / reduced motion: native snap row ---- */
        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 pt-10 md:px-10 md:pt-12">
          {PRODUCTS.map((p, i) => (
            <div key={p.slug} className="snap-center">
              <ProductCard product={p} variant="showcase" priority={i < 2} />
            </div>
          ))}
        </div>
      )}

      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-5 pb-20 md:flex-row md:items-center md:justify-between md:px-10 md:pb-28">
        <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">
          {mode === "scroll" ? "The row follows your scroll" : "Swipe — every piece waits inside"}
        </p>
        <ArrowLink href="/products">The full collection</ArrowLink>
      </div>
    </section>
  );
}
