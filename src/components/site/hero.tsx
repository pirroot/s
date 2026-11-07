"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Eyebrow, PillLink } from "./primitives";

/**
 * Interactive showroom hero — v4 "white gallery".
 *
 * The page is a classic white editorial spread: copy column on the left, and
 * on desktop the live scene runs as a full-bleed background image flush with
 * the right, top and bottom edges — no floating card. On mobile the scene
 * sits edge-to-edge under the text block.
 *
 * v4.2 polish: the visible BATOLITE mark is stamped by the canvas against
 * the BOX (never against the image), so the cover-crop can no longer slice
 * it mid-word; the scene breathes in with a slow cinematic zoom-out; the
 * switches glow warm (2700 K) when their group is lit; mobile gains a taller
 * scene.
 *
 * The engine is unchanged from v3.1: the client's own high-res render set
 * (4961px exports) — one raw frame with every fitting off (خام) plus one real
 * render per light group, each diffed against its reference frame, so layer
 * l1..l5 is a pure light contribution. Canvases stack with mix-blend
 * plus-lighter, so flipping a switch fades ONLY that group's real light —
 * bounce, falloff and shadows included. Five switches, four families.
 */

type Orient = "d" | "m";

const LIGHTS = [
  { key: "l1", label: "Tubes", family: "Tube" },
  { key: "l2", label: "Counter", family: "Ambience" },
  { key: "l3", label: "Flutes", family: "Flute" },
  { key: "l4", label: "Spots", family: "Ambience" },
  { key: "l5", label: "Eclipse", family: "Eclipse" },
] as const;

const FAMILIES = [
  { name: "Tube", note: "Wall quartet, kitchen", ids: [0] },
  { name: "Flute", note: "Pair over the island", ids: [2] },
  { name: "Eclipse", note: "Disc above the table", ids: [4] },
  { name: "Ambience", note: "Counter strip · ceiling spots", ids: [1, 3] },
] as const;

const ALL_ON = LIGHTS.map(() => true);
const ALL_OFF = LIGHTS.map(() => false);
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${label} light`}
      onClick={onChange}
      className="group flex flex-col items-center gap-1.5 rounded-lg px-0.5 py-0.5 outline-none focus-visible:ring-1 focus-visible:ring-white/70"
    >
      <span
        className="text-[8px] font-medium uppercase tracking-[0.18em] text-white/55 transition-colors duration-300 group-hover:text-white group-focus-visible:text-white md:text-[8.5px]"
        style={{ marginRight: "-0.18em" }}
      >
        {label}
      </span>
      <span
        aria-hidden
        className={`relative block h-[22px] w-[40px] rounded-full border transition-all duration-500 ${
          on
            ? "border-white/90 bg-white shadow-[0_0_18px_rgba(255,206,140,0.42)]"
            : "border-white/35 bg-white/10"
        }`}
      >
        <span
          className={`absolute top-1/2 h-[14px] w-[14px] -translate-y-1/2 rounded-full transition-all duration-500 ease-out ${
            on ? "left-[21px] bg-black" : "left-[2px] bg-white/85"
          }`}
        />
      </span>
    </button>
  );
}

export function Hero() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const layerRefs = useRef<(HTMLCanvasElement | null)[]>(LIGHTS.map(() => null));
  const store = useRef<Map<string, ImageBitmap>>(new Map());
  const introTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [orient, setOrient] = useState<Orient>("d");
  const [state, setState] = useState<boolean[]>(ALL_OFF);
  const [ready, setReady] = useState(false);
  const [touched, setTouched] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [wave, setWave] = useState(false); // stagger only multi-light changes
  const [blend, setBlend] = useState<"plus-lighter" | "screen">("screen");
  const [reduced, setReduced] = useState(false);

  /* ---------- media loading ---------- */

  const load = useCallback(async (id: string) => {
    const map = store.current;
    if (map.has(id)) return map.get(id)!;
    const res = await fetch(`/api/media/${id}`);
    if (!res.ok) throw new Error(`media ${id}: ${res.status}`);
    const bmp = await createImageBitmap(await res.blob());
    map.set(id, bmp);
    return bmp;
  }, []);

  /* ---------- canvas painting ---------- */

  const drawBitmap = useCallback((c: HTMLCanvasElement, img: ImageBitmap, stamp = false) => {
    const wrap = sceneRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, w, h);
    const s = Math.max(w / img.width, h / img.height);
    const dw = img.width * s;
    const dh = img.height * s;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);

    if (!stamp) return;
    // Visible BATOLITE mark, anchored to the BOX (not the image) — the
    // cover-crop can never slice it. Burned-in byte protection stays on the
    // served file; this is the design-facing mark. Top-right, subtle ink.
    const fs = Math.max(9, Math.min(13, (w / dpr) * 0.011)) * dpr;
    const text = "BATOLITE";
    const tracking = fs * 0.34;
    ctx.font = `600 ${fs}px "DejaVu Sans", Arial, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.textBaseline = "top";
    let total = 0;
    for (const ch of text) total += ctx.measureText(ch).width + tracking;
    let x = w - Math.round(18 * dpr) - total;
    const y = Math.round(16 * dpr);
    for (const ch of text) {
      ctx.fillText(ch, x, y);
      x += ctx.measureText(ch).width + tracking;
    }
  }, []);

  const paintAll = useCallback(
    (o: Orient) => {
      const base = store.current.get(`${o}-base`);
      if (base && baseRef.current) drawBitmap(baseRef.current, base, true);
      LIGHTS.forEach((l, i) => {
        const bmp = store.current.get(`${o}-${l.key}`);
        const c = layerRefs.current[i];
        if (bmp && c) drawBitmap(c, bmp);
      });
    },
    [drawBitmap]
  );

  // load the seven bitmaps of the active orientation, then paint
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await Promise.all([`${orient}-base`, ...LIGHTS.map((l) => `${orient}-${l.key}`)].map(load));
      } catch {
        try {
          await load(`${orient}-base`); // graceful: missing layers render as "off"
        } catch {
          return;
        }
      }
      if (!alive) return;
      paintAll(orient);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [orient, load, paintAll]);

  // crisp repaint (no fade) when the scene box resizes
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    let t = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(() => paintAll(orient), 120);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [orient, paintAll]);

  /* ---------- orientation (narrow scene box -> tighter crop) ---------- */

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setOrient(r.width / Math.max(1, r.height) < 1.05 ? "m" : "d");
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ---------- additive blend support + motion preference ---------- */

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (CSS.supports("mix-blend-mode", "plus-lighter")) setBlend("plus-lighter");
      } catch {
        /* keep screen */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const upd = () => setReduced(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);

  /* ---------- intro film: the room lights fitting by fitting ---------- */

  useEffect(() => {
    if (!ready || introDone) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => {
        setState(ALL_ON);
        setIntroDone(true);
      }, 0);
      return () => clearTimeout(t);
    }
    const timers = ALL_ON.map((_, i) =>
      setTimeout(() => setState((prev) => prev.map((v, j) => (j === i ? true : v))), 650 + i * 430)
    );
    timers.push(setTimeout(() => setIntroDone(true), 650 + ALL_ON.length * 430 + 500));
    introTimers.current = timers;
    return () => timers.forEach(clearTimeout);
  }, [ready, introDone]);

  /* ---------- user control ---------- */

  const takeControl = () => {
    introTimers.current.forEach(clearTimeout);
    setIntroDone(true);
    setTouched(true);
  };
  const toggle = (i: number) => {
    takeControl();
    setWave(false);
    setState((prev) => prev.map((v, j) => (j === i ? !v : v)));
  };
  const master = () => {
    takeControl();
    setWave(true);
    setState((prev) => (prev.every(Boolean) ? ALL_OFF : ALL_ON));
  };

  const onCount = state.filter(Boolean).length;

  /** per-layer opacity transition; stagger only on multi-light waves */
  const layerStyle = (i: number, on: boolean): CSSProperties => ({
    opacity: on ? 1 : 0,
    transition: `opacity ${on ? 520 : 460}ms ${EASE} ${wave && on ? i * 70 : 0}ms`,
  });

  /* ---------- render ---------- */

  return (
    <section
      id="top"
      aria-label="Interactive Batolite showroom"
      className="relative flex min-h-[calc(100svh-3.5rem)] flex-col overflow-hidden bg-white text-neutral-900 md:min-h-[calc(100svh-4rem)]"
    >
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-12">
        {/* ------- copy column: classic white editorial ------- */}
        <div className="order-1 flex flex-col justify-center px-5 pb-2 pt-10 md:px-10 lg:col-span-5 lg:pb-10 lg:pl-10 lg:pr-6 lg:pt-0 xl:pl-16">
          <Eyebrow>Interactive showroom</Eyebrow>
          <h1
            className="mt-4 text-5xl font-extralight uppercase leading-[0.95] tracking-[0.1em] text-neutral-900 md:text-7xl xl:text-8xl"
            style={{ marginRight: "-0.1em" }}
          >
            Batolite
          </h1>
          <p className="mt-5 max-w-md font-serif text-xl font-light italic text-neutral-700 md:text-2xl">
            Light, composed — fitting by fitting.
          </p>
          <p className="mt-4 max-w-md text-[13px] leading-relaxed text-neutral-500 md:text-sm">
            This apartment is wired live — five switch groups, from the Tube quartet on the
            kitchen wall to the Eclipse above the table. Flip them and the room answers exactly
            as the fittings behave in situ.
          </p>

          <ul className="mt-7 hidden max-w-md flex-col gap-3 lg:flex">
            {FAMILIES.map((f) => {
              const onN = f.ids.filter((i) => state[i]).length;
              const allOn = onN === f.ids.length;
              return (
                <li key={f.name} className="flex items-baseline gap-3.5">
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full transition-all duration-500 ${
                      allOn
                        ? "bg-neutral-900 shadow-[0_0_10px_rgba(0,0,0,0.35)]"
                        : onN > 0
                          ? "bg-neutral-500"
                          : "bg-neutral-300"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-medium uppercase tracking-[0.22em] transition-colors duration-500 ${
                      onN > 0 ? "text-neutral-900" : "text-neutral-400"
                    }`}
                  >
                    {f.name}
                  </span>
                  <span className="text-[11px] text-neutral-400">{f.note}</span>
                  <span className="ml-auto text-[10px] tabular-nums text-neutral-400">
                    {onN}/{f.ids.length}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <PillLink href="/products">Explore the products</PillLink>
            <p aria-hidden className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
              {onCount} / {LIGHTS.length} on
            </p>
          </div>
        </div>

        {/* ------- the live scene: full-bleed on desktop, edge-to-edge below the text on mobile ------- */}
        <div className="order-2 lg:col-span-7">
          <div
            ref={sceneRef}
            data-protected
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            className="relative h-[50svh] min-h-[340px] w-full overflow-hidden bg-[#0b0b0b] lg:h-full lg:min-h-0"
          >
            {/* cinematic breath: the scene settles from a hair of zoom as it fades in */}
            <div
              aria-hidden
              className="absolute inset-0 motion-reduce:transition-none"
              style={{
                transform: reduced || ready ? "scale(1)" : "scale(1.045)",
                transitionProperty: "transform",
                transitionDuration: ready ? "2600ms" : "0ms",
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                willChange: ready ? "auto" : "transform",
              }}
            >
              <canvas
                ref={baseRef}
                aria-hidden
                className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${
                  ready ? "opacity-100" : "opacity-0"
                }`}
              />
              {LIGHTS.map((l, i) => (
                <canvas
                  key={l.key}
                  ref={(el) => {
                    layerRefs.current[i] = el;
                  }}
                  aria-hidden
                  className="absolute inset-0 h-full w-full motion-reduce:transition-none"
                  style={{ mixBlendMode: blend, ...(ready ? layerStyle(i, state[i]) : { opacity: 0 }) }}
                />
              ))}
            </div>

            {/* dock legibility gradient */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-28 bg-gradient-to-t from-black/55 to-transparent"
            />

            <p className="sr-only" aria-live="polite">
              {`Showroom lighting: ${onCount} of ${LIGHTS.length} switch groups on.`}
            </p>

            {/* switch hint */}
            <p
              aria-hidden
              className={`absolute bottom-[92px] left-1/2 z-30 -translate-x-1/2 text-[9px] uppercase tracking-[0.4em] text-white/55 transition-opacity duration-1000 md:bottom-[96px] ${
                ready && !touched ? "opacity-100" : "opacity-0"
              }`}
              style={{ marginRight: "-0.4em" }}
            >
              Flip the switches
            </p>

            {/* control dock */}
            <div className="absolute bottom-3.5 left-1/2 z-40 -translate-x-1/2">
              <div className="flex items-end gap-2.5 rounded-2xl border border-white/15 bg-black/45 px-3.5 py-2.5 shadow-[0_12px_44px_rgba(0,0,0,0.45)] backdrop-blur-md md:gap-3.5 md:rounded-full md:px-6 md:py-3">
                {LIGHTS.map((l, i) => (
                  <Switch key={l.key} label={l.label} on={state[i]} onChange={() => toggle(i)} />
                ))}
                <div aria-hidden className="h-8 w-px self-center bg-white/15" />
                <Switch label="All" on={onCount === LIGHTS.length} onChange={master} />
              </div>
            </div>

            {/* scroll cue over the dark scene */}
            <a
              href="#products"
              aria-label="Scroll to the products"
              className="absolute bottom-6 right-6 z-20 hidden flex-col items-center gap-3 text-white/45 transition-colors hover:text-white/85 lg:flex"
            >
              <span className="text-[9px] uppercase tracking-[0.4em]" style={{ marginRight: "-0.4em" }}>
                Scroll
              </span>
              <span aria-hidden className="relative block h-12 w-px overflow-hidden bg-white/15">
                <span className="absolute left-0 top-0 h-4 w-px animate-scrollcue bg-white/80" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
