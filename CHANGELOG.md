# Batolite — Version History

Each released state of the site is committed and tagged in git.
If a version is not wanted, restoring it is one command — no rebuilding.

## v4.3 — 2026-11-07  (current)

**Tooling refresh — npm-only, Tailwind upgraded to the latest v4.3.5.**

No visual changes — every page looks exactly like v4.2. This release is
about the project structure and package hygiene:

- **Tailwind CSS upgraded 4.1.18 → 4.3.5** (both `tailwindcss` and
  `@tailwindcss/postcss`). The project stays fully on the v4 CSS-first
  configuration — `@import "tailwindcss"` + `@theme inline` in
  `src/app/globals.css`.
- **Legacy `tailwind.config.ts` deleted.** The file was a leftover from
  the v3 era (shadcn `hsl(var(--…))` pattern + `tailwindcss-animate`);
  Tailwind v4 never loads it (no `@config` directive anywhere), so it
  was dead code. All theme tokens already live in `globals.css`.
- **bun removed everywhere.** `bun.lock` deleted, every Bun mention in
  the docs removed — the project is plain **npm** only
  (`package-lock.json` is the single source of truth).
- Docs (`HOW-TO-RUN.md`) updated to match.

Run it the same way as always:

```bash
npm install
npm run dev
```

## v4.2 — 2026-11-07

**v4.0 restored as the baseline — the hero alone gets a polish pass.**

The verdict on v4.1's white-sheet hero: not good. The site returns to the
v4.0 white-editorial baseline (copy column left, full-bleed live scene
right) and only the hero is refined.

**Hero**
- **Watermark fixed.** The burned-in mark was anchored to the image's
  bottom-right corner, and the scene's cover-crop sliced it mid-word — a
  giant cropped "BATO…" floated at the frame edge on desktop and a fragment
  peeked from under the dock on mobile. Two changes:
  - The served image now carries its protection mark **bottom-centre**
    (survives every horizontal crop; on the hero it hides behind the glass
    dock — byte protection unchanged).
  - The hero canvas stamps the **visible** mark itself, anchored to the
    *box* (top-right, subtle ink, letterspaced) — it can never be cropped,
    whatever the viewport.
- **Cinematic breath:** as the scene fades in it settles from a 4.5 % zoom
  to rest over 2.6 s (skipped for `prefers-reduced-motion`).
- **Warm switches:** a lit switch now glows in the room's own 2700 K warm
  white instead of a cold white halo — the dock reads as part of the light.
- **Mobile:** the scene grows 47 → 50 svh (min 340 px) and the copy block
  sits a touch tighter; the dock and all six switches stay inside 390 px.
- The engine is untouched: five real-render light groups, plus-lighter
  additive blending, intro film, staggered wave on All.

**Media**
- `watermarkSvg` anchors every burned-in mark bottom-centre — the same
  slicing bug would have hit editorial frames on detail pages; all now keep
  a whole, centred mark.

## v4.1 — 2026-11-07

**The hero returns full-screen like v1 — on the design's own white sheet.**
*(rejected by the client — kept only for rollback)*

The client's verdict on v4.0's white editorial hero: keep the v1 full-screen
immersive scene, but do not present the room on black — present it colored
like the design itself. The hero went `100svh` full-bleed with the cutaway
alpha-composited on pure white and ink-on-white UI. Rejected in review;
superseded by v4.2.

## v4.0 — 2026-11-07

**The site becomes a full site — white, classic, multi-page.**

**Homepage — "White Gallery" hero**
- The hero is now a **classic white editorial spread**: copy column on the
  left — dark ink on white — and on desktop the live scene runs as a
  **full-bleed background image** flush with the right, top and bottom
  edges: no floating card, no frame. On mobile the scene sits edge-to-edge
  beneath the text block with the switch dock.
- The switch engine is untouched from v3.1: five switch groups diffed from
  the client's own 4961px renders, additive plus-lighter blending, intro
  film, reduced-motion support. Single site header now serves every page
  (sticky, white, hairline).

**Products — the album becomes products**
- The old "album" section is now the **products showcase**: on desktop the
  row glides sideways slowly as the page scrolls (sticky section, lerp
  smoothing) and hovering a card raises its details with a More-details
  link; on touch it is a native snap-swipe row.
  `prefers-reduced-motion` falls back to a plain horizontal scroller.

**Phase 2 — three new pages**
- `/products` — the client's reference layout: breadcrumb, a huge "The
  Collection." masthead, and a horizontally scrolling catalogue row
  (drag-to-scroll with the mouse, native swipe on touch, hairline
  prev/next steppers, thin progress bar, edge fades). Every card: studio
  photo, index — family, name, blurb, **More Details →**.
- `/products/[slug]` — the detail page with **multiple photographs per
  product**: studio portrait + high-res in-situ crops extracted from the
  client's own render set (`scripts/build_phase2_assets.py` →
  `assets-private/gallery/`), each with a classic caption rule. Sticky
  info column (story paragraphs, spec grid, finish, Enquire mailto),
  prev/next product band. Static params for all five products.
- `/about` — **About & Contact combined** on one page: "The house of
  sculpted light." masthead, story beside the reference render, three
  numbered principles on hairline rows, and the contact section with
  studio details plus a working hairline **enquiry form** (composes a
  mailto: — no backend needed; swap for the API route in phase 3).

**Data & media**
- `site.ts` re-modelled: albums merged into `Product` with `cover`,
  `gallery[]` (mediaId + caption), expanded description paragraphs and
  label/value specs. Product index helpers for prev/next navigation.
- `media.ts` registers the new gallery images (p*, a*, g* families) with
  intrinsic sizes.

**Optimisation & housekeeping (the client's code-quality brief)**
- New shared primitives file (`primitives.tsx`: Eyebrow, Display,
  SectionHead, ArrowLink, PillLink, Breadcrumb) and one product card with
  two variants (`product-card.tsx`) — no more copy-pasted little UI.
- **Unused npm packages removed** — the whole unused shadcn/radix set,
  Prisma, framer-motion, tanstack, dnd-kit, next-auth, next-intl,
  recharts, react-hook-form, zod, zustand and friends. `src/components/ui`,
  `src/hooks`, `src/lib/{utils,db}.ts`, `prisma/`, `db/` and the unused
  demo API route deleted. `package.json` now lists exactly what the site
  uses: next, react, react-dom, sharp.
- SEO: per-page metadata with canonicals, sitemap with all routes, JSON-LD
  (ItemList on /products, Product on detail pages, AboutPage on /about).

## v3.1 — 2026-11-06

**Hero — rebuilt on the client's new high-res render set (4961×3508 exports)**
- The client re-exported the reference apartment at print quality and added
  new light states (همه سیلندرها / کانتر دو / کل کانتر). Every hero layer is
  re-extracted from the new frames — the room is visibly sharper on retina.
- Layer recipe upgraded from "one render per fitting" to **independent group
  extraction with reference subtraction**:
  `Tubes = همه سیلندرها − خام`, `Counter = سیلندردو − خام`,
  `Flutes = سیلندرچهار − سیلندردو`, `Spots = کل‌کانتر − کانتریک`,
  `Eclipse = لامپ‌بزرگ − خام` — each layer is that group's *pure* light,
  bounce included, with a noise-floor cut so blacks stay black.
- Engine faithfulness measured against the real renders: mean diff 0.2–1.9
  levels (0–255) — switching a group on reproduces the client's own render.
- **Six switches → five switch groups** (Tubes · Counter · Flutes · Spots ·
  Eclipse + master All), four families in the legend (Tube / Flute / Eclipse
  / Ambience). Counter strip and ceiling spots join the scene as the
  "Ambience" group.
- Desktop assets up-sized 1280×904 → **1440×1018** (source is 1:√2, no
  crop needed); mobile crop unchanged (900×816).
- Copy aligned to what the room actually contains: seven Batolite pieces
  (four Tubes, a pair of Flutes, one Eclipse) on five switch groups — hero,
  "In situ" section, and the site meta description now all say it honestly.

**Housekeeping**
- `assets-private/hero/{d,m}-{base,l1..l5,allon}.jpg`; stale l6 files removed
  (still recoverable from git history).
- Layer builder moved to `scripts/build_layers_v3_1.py` (per-layer reference
  subtraction, gain table, engine self-check, states contact sheet).

## v3.0 — 2026-11-06

**Hero — real per-fitting renders (the client's own exports)**
- The client supplied one render per fitting: خام (raw room, all off) plus
  six frames of the same camera with exactly one light on — سیلندر یک…چهار
  (Tube I–IV wall cylinders), کانتر (Flute island trio), لامپ بزرگ (Eclipse
  disc). v3 is built directly on them.
- Each fitting's layer = its render minus the shared dark base → a pure
  light contribution with **real bounce, falloff and shadows** (no synthetic
  blur). Layers stack with mix-blend **plus-lighter** (screen fallback), so
  flipping a switch fades only that fitting's real light into the room.
- **Six switches, three families**: Tube I–IV, Flute, Eclipse + a master
  All. Family legend in the copy shows live per-family counts (4/4, 1/1…).
- Intro film relights the room fitting by fitting; master "All" plays a
  staggered wave. Reduced-motion users get the lit room instantly.
- Watermark stays on the base frame only — additive layers stay clean so
  the light pools never ghost the mark.

**Homepage — classic editorial pass, complete**
- New hairline **values strip** under the hero (materials / light / finish /
  production) in small caps.
- New **"In situ"** section (02): the pre-composited all-on render shown
  full-bleed with a classic caption rule — the still frame of the
  interactive showroom.
- New **"The Atelier"** section (03): serif pull-quote beside the studio
  story + hairline numbers row (03 families · 05 pieces · 2700 K · CRI 90+).
- Cormorant Garamond serif accents throughout; section numbering 01–04;
  anchor scroll padding for the sticky header.
- Quiet **reveal-on-scroll** entrances (IntersectionObserver, once, honors
  prefers-reduced-motion).
- SEO: description + keywords refreshed; JSON-LD now lists the five pieces.

**Housekeeping**
- Assets: `assets-private/hero/{d,m}-{base,l1..l6,allon}.jpg`
  (desktop 1280×904, mobile 900×816 room crop). Old v1/v2 state & layer
  files removed (still available in git tags).
- `wm: "none"` added to the media registry for additive layers.

## v2.0 — 2026-11-06

**Hero**
- New layout: the description (brand, tagline, copy, light-family legend,
  live "n / 3 on" counter) now sits **beside** the scene — text left,
  live room right; stacked on mobile.
- New **additive light engine**: the scene is a base (all-off) plus one
  independent light layer per family. Flipping a switch animates **only that
  family's light** — the room and the other lights never re-fade.
- Light-physics timing: sharp pass snaps on like an LED; a blurred bloom pass
  lingers like glow spilling into the room. Staggered wave when several
  families change together (All / intro).
- Intro film relights the room family by family (like the reference video).
- Larger, more tactile switches with a glow halo; hint stays until first use.

**Collection**
- Real product photography (client photos, unified B&W): Tube — Chalk,
  Tube — Graphite, Flute — Concrete, Flute — Ornament, Eclipse.
- Same click-to-expand interaction; subtle edge ring for white-background
  shots.

**Housekeeping**
- Assets: `assets-private/hero/{d,m}-{base,g1,g2,g3}.jpg` — swap 1:1 with the
  real renders later, no code changes needed.
- SEO copy/keywords updated to the two families.

## v1.0 — first approved homepage

Fullscreen hero with the 8 pre-rendered states (whole-scene crossfade),
placeholder collection imagery, image protection tier (same-origin media
route + canvas rendering + watermark + no-save guards), on-page SEO.

---

## Rollback

```bash
git tag                     # list versions
git checkout v1.0           # inspect a version
git checkout main           # back to current
```

To make an old version the live one: `git checkout <tag>` and restart the
dev server (or ask the assistant to roll back to vX.Y).
