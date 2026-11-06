import { NextRequest } from "next/server";
import sharp from "sharp";
import { ALLOWED_WIDTHS, MEDIA, PRIVATE_DIR, type MediaEntry } from "@/lib/media";
import path from "path";
import { readFile } from "fs/promises";

/**
 * Protected media endpoint.
 * - same-origin only (blocks hotlinking + "open image in new tab" + curl)
 * - serves images sized to display needs, never the original file
 * - burns a subtle BATOLITE watermark into the pixels via sharp
 * - no-store: nothing lands in shared caches or disk
 */
export const dynamic = "force-dynamic";

const cache = new Map<string, Buffer>();

function watermarkSvg(w: number, h: number, ink: "light" | "dark"): Buffer {
  const fs = Math.max(13, Math.min(30, Math.round(w * 0.02)));
  const ls = Math.round(fs * 0.38);
  const fill = ink === "light" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.13)";
  // Bottom-centre anchor: display boxes cover-crop the image, and a
  // bottom-right mark gets sliced mid-word whenever the box is squarer than
  // the image (hero scene, editorial frames). Centre-bottom survives every
  // horizontal crop; the hero additionally stamps a box-anchored mark
  // client-side so a visible mark always sits fully inside the frame.
  const x = Math.round(w / 2);
  const y = Math.round(h * 0.945);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="auto"
      font-family="DejaVu Sans, sans-serif" font-weight="600"
      font-size="${fs}" letter-spacing="${ls}" fill="${fill}">BATOLITE</text>
  </svg>`;
  return Buffer.from(svg);
}

function compositeFor(entry: MediaEntry, w: number, h: number) {
  // additive light layers must stay clean — a watermark would glow in the room
  return entry.wm === "none" ? [] : [{ input: watermarkSvg(w, h, entry.wm as "light" | "dark") }];
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const entry = MEDIA[id];
  if (!entry) {
    return new Response("Not found", { status: 404 });
  }

  // ---- same-origin gate -----------------------------------------------
  const site = req.headers.get("sec-fetch-site");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host") ?? "";
  let sameOrigin = false;
  if (site === "same-origin") {
    sameOrigin = true;
  } else if (!site && referer) {
    // older browsers: fall back to referer check
    try {
      sameOrigin = new URL(referer).host === host;
    } catch {
      sameOrigin = false;
    }
  }
  if (!sameOrigin) {
    return new Response("Forbidden", { status: 403 });
  }

  // ---- pick a display width (never upscale, whitelist only) -----------
  const requested = Number(req.nextUrl.searchParams.get("w") ?? 0);
  const target = ALLOWED_WIDTHS.includes(requested)
    ? Math.min(requested, entry.width)
    : entry.width;
  const key = `${id}@${target}`;

  let out = cache.get(key);
  if (!out) {
    const raw = await readFile(path.join(PRIVATE_DIR, entry.file));
    const scale = Math.min(1, target / entry.width);
    const w = Math.round(entry.width * scale);
    const h = Math.round(entry.height * scale);
    out = await sharp(raw)
      .resize({ width: w, height: h, fit: "fill", withoutEnlargement: true })
      .composite(compositeFor(entry, w, h))
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    cache.set(key, out);
  }

  return new Response(new Uint8Array(out), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-store",
      "Content-Disposition": "inline",
      "X-Robots-Tag": "noimageindex",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}
