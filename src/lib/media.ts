import path from "path";

/**
 * Private media registry — images live OUTSIDE /public and are only served
 * through /api/media/[id] with same-origin checks + optional burned-in
 * watermark. No direct image URL is ever exposed to the client.
 */
export type MediaEntry = {
  file: string; // relative to assets-private/
  width: number;
  height: number;
  wm: "light" | "dark" | "none"; // watermark ink; "none" for additive light layers
};

export const MEDIA: Record<string, MediaEntry> = {};

// ---------------------------------------------------------------------------
// Hero — v3.1 "real renders" engine (client's own high-res per-light exports).
// base = خام (raw room, all off). l1..l5 = one real render per light group,
// diffed against its reference frame so each layer is a pure light
// contribution. Stacked with mix-blend plus-lighter on the client, so a
// switch fades ONLY that group's real light — bounce light included.
// Watermark lives on the base only: additive layers must stay clean.
// ---------------------------------------------------------------------------
const HERO_DIMS: Record<string, [number, number]> = { d: [1440, 1018], m: [900, 816] };
for (const o of ["d", "m"] as const) {
  const [w, h] = HERO_DIMS[o];
  MEDIA[`${o}-base`] = { file: `hero/${o}-base.jpg`, width: w, height: h, wm: "light" };
  for (let i = 1; i <= 5; i++) {
    MEDIA[`${o}-l${i}`] = { file: `hero/${o}-l${i}.jpg`, width: w, height: h, wm: "none" };
  }
  MEDIA[`${o}-allon`] = { file: `hero/${o}-allon.jpg`, width: w, height: h, wm: "light" };
}

// ---------------------------------------------------------------------------
// Collection — real product photography from the client (unified B&W, 3:4).
// p* = studio covers. a* = editorial monochrome renders. g* = high-res
// in-situ crops from the client's own render set (detail-page gallery).
// ---------------------------------------------------------------------------
const ALBUM_FILES: Array<[string, string, "light" | "dark", number, number]> = [
  ["p1", "albums/p1-tube-chalk.jpg", "dark", 900, 1200],
  ["p2", "albums/p2-tube-graphite.jpg", "dark", 900, 1200],
  ["p3", "albums/p3-flute-concrete.jpg", "dark", 900, 1200],
  ["p4", "albums/p4-flute-ornament.jpg", "light", 900, 1200],
  ["p5", "albums/p5-eclipse.jpg", "dark", 900, 1200],
  ["a1-orbit", "albums/a1-orbit.jpg", "dark", 900, 1200],
  ["a2-cove", "albums/a2-cove.jpg", "dark", 900, 1200],
  ["a3-halo", "albums/a3-halo.jpg", "dark", 900, 1200],
  ["a4-plan", "albums/a4-plan.jpg", "dark", 900, 1200],
  ["a5-object", "albums/a5-object.jpg", "light", 900, 1200],
  ["a6-living", "albums/a6-living.jpg", "dark", 900, 1200],
  ["g-tube-a", "gallery/g-tube-a.jpg", "dark", 1008, 1400],
  ["g-tube-b", "gallery/g-tube-b.jpg", "dark", 1400, 966],
  ["g-flute-a", "gallery/g-flute-a.jpg", "dark", 1008, 1400],
  ["g-eclipse-a", "gallery/g-eclipse-a.jpg", "dark", 1007, 1400],
  ["g-eclipse-b", "gallery/g-eclipse-b.jpg", "dark", 1400, 875],
  ["g-wide", "gallery/g-wide.jpg", "dark", 1400, 875],
];
for (const [id, file, wm, w, h] of ALBUM_FILES) {
  MEDIA[id] = { file, width: w, height: h, wm };
}

export const PRIVATE_DIR = path.join(process.cwd(), "assets-private");

/** Whitelisted serve widths — never larger than the intrinsic asset. */
export const ALLOWED_WIDTHS = [480, 800, 1200, 1600];
