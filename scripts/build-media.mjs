// scripts/build-media.mjs
import sharp from "sharp";
import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { ALLOWED_WIDTHS, MEDIA, PRIVATE_DIR } from "../src/lib/media.ts"; // اگه TS مستقیم نمیشه، با tsx اجرا کن

function watermarkSvg(w, h, ink) {
  const fs = Math.max(13, Math.min(30, Math.round(w * 0.02)));
  const ls = Math.round(fs * 0.38);
  const fill = ink === "light" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.13)";
  const x = Math.round(w / 2);
  const y = Math.round(h * 0.945);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <text x="${x}" y="${y}" text-anchor="middle" font-family="DejaVu Sans, sans-serif"
      font-weight="600" font-size="${fs}" letter-spacing="${ls}" fill="${fill}">BATOLITE</text></svg>`);
}

const outDir = "public/_m";
await mkdir(outDir, { recursive: true });

for (const [id, entry] of Object.entries(MEDIA)) {
  const raw = await readFile(path.join(PRIVATE_DIR, entry.file));
  for (const width of [...ALLOWED_WIDTHS, entry.width]) {
    const target = Math.min(width, entry.width);
    const scale = target / entry.width;
    const w = Math.round(entry.width * scale);
    const h = Math.round(entry.height * scale);
    const comp =
      entry.wm === "none" ? [] : [{ input: watermarkSvg(w, h, entry.wm) }];
    const buf = await sharp(raw)
      .resize({ width: w, height: h, fit: "fill" })
      .composite(comp)
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    await writeFile(path.join(outDir, `${id}-${target}.jpg`), buf);
  }
}
