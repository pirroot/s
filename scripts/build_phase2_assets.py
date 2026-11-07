#!/usr/bin/env python3
"""
Batolite v4 gallery assets — rebuild the fully-lit reference frame at full
4961px resolution (خام + every light group's contribution), then cut the
detail-page gallery crops (g-*.jpg) from it.

Recipe mirrors build_layers_v3_1.py: each light state minus the خام frame is
that group's pure light (noise floor cut so blacks stay black); the lit frame
is خام + sum of contributions.

Outputs:
  /tmp/gallery_preview.jpg   — the lit frame, downscaled, for visual crop check
  /tmp/gallery_crops.jpg     — contact sheet of the six crops
  assets-private/gallery/g-*.jpg
"""

from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os

SRC = "upload"
OUT = "assets-private/gallery"
NOISE_FLOOR = 10  # levels below this stay black — keeps blacks clean

# خام first, then the five group states used by the v3.1 engine
BASE = "خام.png"
STATES = ["همه سیلندر ها.png", "سیلندر دو.png", "سیلندر چهار.png", "کل کانتر.png", "لامپ بزرگ.png"]


def load_rgb(name: str) -> np.ndarray:
    """Load a render and alpha-composite it onto black — the client's PNGs
    are transparent cutaways (backdrop RGB is meaningless, alpha=0); the hero
    assets present the room on black, and the gallery must match."""
    im = Image.open(os.path.join(SRC, name))
    if im.mode == "RGBA":
        im = Image.alpha_composite(Image.new("RGBA", im.size, (0, 0, 0, 255)), im)
    im = im.convert("RGB")
    return np.asarray(im, dtype=np.int16)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    base = load_rgb(BASE)
    h, w = base.shape[:2]
    print(f"base {w}x{h}")

    acc = np.zeros_like(base, dtype=np.int16)
    for s in STATES:
        cur = load_rgb(s)
        delta = cur - base
        delta[delta < NOISE_FLOOR] = 0
        acc += delta
        del cur, delta
        print(f"  + {s}")

    lit = np.clip(base.astype(np.int16) + acc, 0, 255).astype(np.uint8)
    del acc, base
    full = Image.fromarray(lit)
    del lit

    full.resize((1400, 990), Image.LANCZOS).save("/tmp/gallery_preview.jpg", quality=88)
    print("preview -> /tmp/gallery_preview.jpg")

    # ---- crops (normalized boxes, aspect matched to the registry dims) ----
    W, H = full.size
    CROPS: list[tuple[str, tuple[float, float, float, float], tuple[int, int]]] = [
        # id, (x0, y0, x1, y1) normalized, (target_w, target_h)
        ("g-tube-a", (0.060, 0.165, 0.490, 0.790), (1008, 1400)),
        ("g-tube-b", (0.045, 0.170, 0.695, 0.615), (1400, 966)),
        ("g-flute-a", (0.285, 0.115, 0.705, 0.700), (1008, 1400)),
        ("g-eclipse-a", (0.530, 0.135, 0.950, 0.720), (1007, 1400)),
        ("g-eclipse-b", (0.360, 0.220, 1.000, 0.665), (1400, 875)),
        ("g-wide", (0.030, 0.160, 0.970, 0.690), (1400, 875)),
    ]

    shots = []
    for gid, (x0, y0, x1, y1), (tw, th) in CROPS:
        box = (round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H))
        crop = full.crop(box)
        # enforce the exact box aspect by centre-cropping to the target ratio
        ratio = tw / th
        cw, ch = crop.size
        if cw / ch > ratio:
            nw = round(ch * ratio)
            off = (cw - nw) // 2
            crop = crop.crop((off, 0, off + nw, ch))
        else:
            nh = round(cw / ratio)
            off = (ch - nh) // 2
            crop = crop.crop((0, off, cw, off + nh))
        crop = crop.resize((tw, th), Image.LANCZOS)
        crop.save(os.path.join(OUT, f"{gid}.jpg"), quality=90, mozjpeg=True)
        shots.append((gid, crop.copy()))
        print(f"  {gid} <- box={box} -> {tw}x{th}")

    # contact sheet for the visual check
    cols, rows = 3, 2
    cw0, ch0 = 460, 420
    sheet = Image.new("RGB", (cols * cw0, rows * ch0), (18, 18, 18))
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
    for i, (gid, im) in enumerate(shots):
        th = im.copy()
        th.thumbnail((cw0 - 16, ch0 - 34), Image.LANCZOS)
        cx, cy = (i % cols) * cw0, (i // cols) * ch0
        sheet.paste(th, (cx + 8, cy + 26))
        d = ImageDraw.Draw(sheet)
        d.text((cx + 8, cy + 6), gid, fill=(255, 255, 120), font=font)
    sheet.save("/tmp/gallery_crops.jpg", quality=85)
    print("crops sheet -> /tmp/gallery_crops.jpg")


if __name__ == "__main__":
    main()
