#!/usr/bin/env python3
"""Batolite v2 asset pipeline — additive per-group light layers.

Why: v1 cross-faded the WHOLE scene between 8 pre-rendered states, so toggling
one light re-faded the entire room. v2 composites the scene from independent
layers:  base (all-off room) + one "light contribution" layer per group.
Each layer is faded in/out on its own canvas (mix-blend screen) with real
light physics easing — toggling a group only animates THAT group.

contribution_i = (lit - off) * smoothstep(blob_mask_i)
all-on composite (screen blend) ~= the original lit render.

Also generates the 5 real product covers (900x1200, unified B&W) from the
client's photos, and a verification sheet.
"""
import os
import numpy as np
from PIL import Image, ImageChops, ImageOps, ImageDraw, ImageFont

ROOT = "/home/z/my-project"
SRC = f"{ROOT}/upload/photo_2026-11-04_23-19-22.jpg"   # lit interior render (hero base art)
OUT = f"{ROOT}/assets-private"
PUB = f"{ROOT}/public"
os.makedirs(f"{OUT}/hero", exist_ok=True)
os.makedirs(f"{OUT}/albums", exist_ok=True)

lit = Image.open(SRC).convert("RGB")
W, H = lit.size  # 1280 x 904

# ---------------- base: all-off room (same look as v1, user approved) ----
g = np.asarray(lit.convert("L"), dtype=np.float32)
off_arr = np.clip(g * 0.38 + 6, 0, 255)[..., None].repeat(3, axis=2)
lit_arr = np.asarray(lit, dtype=np.float32)
delta = lit_arr - off_arr  # what ALL the light adds

# light-group masks (fractions of W,H): cx, cy, rx, ry — same regions as v1
G1 = [(0.424, 0.315, 0.095, 0.175), (0.699, 0.295, 0.074, 0.072)]  # pendants + disc
G2 = [(0.295, 0.365, 0.117, 0.144), (0.207, 0.575, 0.133, 0.077)]  # cove strip + floor spill
G3 = [(0.309, 0.208, 0.105, 0.061)]                                # ceiling spots
GROUPS = [G1, G2, G3]

yy, xx = np.mgrid[0:H, 0:W]
xf, yf = xx / W, yy / H

def blob_mask(blobs):
    m = np.zeros((H, W), np.float32)
    for cx, cy, rx, ry in blobs:
        dx = (xf - cx) / rx
        dy = (yf - cy) / ry
        m = np.maximum(m, np.exp(-0.6 * (dx * dx + dy * dy)))
    return m

def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

raw = [blob_mask(b) for b in GROUPS]
masks = [smoothstep(0.15, 0.75, r) for r in raw]

# Ambient bounce: each group also lifts the whole room a little (indirect
# light), so "all on" converges to the real lit render, not just the blobs.
A = smoothstep(0.04, 0.55, np.max(raw, axis=0))          # wide global field
F = 0.18 + 0.55 * A                                      # ambient floor + falloff
SHARE = [0.40, 0.32, 0.28]                               # sums to 1
masks = [np.minimum(1.0, m + SHARE[i] * F) for i, m in enumerate(masks)]

def save_layer(name, contrib, box=None):
    """contribution -> JPEG on black; optional crop box for the mobile set."""
    img = Image.fromarray(np.clip(contrib, 0, 255).astype("uint8"))
    if box:
        img = img.crop(box)
    img.save(f"{OUT}/hero/{name}.jpg", quality=90)
    return img

MOBILE_BOX = (250, 0, 666, H)  # same portrait crop as v1 m-states

save_layer("d-base", off_arr)
for i, m in enumerate(masks, 1):
    c = delta * (m[..., None] * 0.97)          # 0.97: keep all-on just under clipping
    save_layer(f"d-g{i}", c)
    save_layer(f"m-g{i}", delta[:, MOBILE_BOX[0]:MOBILE_BOX[2]] * (m[:, MOBILE_BOX[0]:MOBILE_BOX[2], None] * 0.97))
base_m = Image.fromarray(off_arr.astype("uint8")).crop(MOBILE_BOX)
base_m.save(f"{OUT}/hero/m-base.jpg", quality=90)

# ---------------- verification: screen-composite key states --------------
def screen_all(images):
    out = images[0]
    for im in images[1:]:
        out = ImageChops.screen(out, im)
    return out

d_base = Image.open(f"{OUT}/hero/d-base.jpg")
layers = [Image.open(f"{OUT}/hero/d-g{i}.jpg") for i in (1, 2, 3)]
combos = {"100": [0], "110": [0, 1], "111": [0, 1, 2]}
thumbs = [(d_base, "base(off)")]
for k, idx in combos.items():
    comp = screen_all([d_base] + [layers[i] for i in idx])
    thumbs.append((comp, f"state {k}"))
thumbs.append((lit, "target (lit)"))

# ---------------- 5 real product covers (900x1200, B&W) ------------------
# (file, out-name, focus fx, fy, watermark ink)
PRODUCTS = [
    ("upload/photo_2026-11-06_12-27-04.jpg", "p1-tube-chalk",    0.44, 0.52, "dark"),
    ("upload/photo_2026-11-06_12-27-08.jpg", "p2-tube-graphite", 0.44, 0.52, "dark"),
    ("upload/photo_2026-11-06_12-27-15.jpg", "p3-flute-concrete",0.5, 0.46, "dark"),
    ("upload/photo_2026-11-06_12-27-21.jpg", "p4-flute-ornament",0.5, 0.5,  "light"),
    ("upload/photo_2026-11-06_12-27-25.jpg", "p5-eclipse",       0.5, 0.42, "dark"),
]
covers = []
for path, name, fx, fy, wm in PRODUCTS:
    im = Image.open(f"{ROOT}/{path}").convert("RGB")
    w, h = im.size
    tr = 900 / 1200
    cw, chh = (w, int(w / tr)) if w / h < tr else (int(h * tr), h)
    if cw > w:
        cw = w
    if chh > h:
        chh = h
    x0 = min(max(int(fx * w - cw / 2), 0), w - cw)
    y0 = min(max(int(fy * h - chh / 2), 0), h - chh)
    c = im.crop((x0, y0, x0 + cw, y0 + chh)).resize((900, 1200), Image.LANCZOS)
    c = ImageOps.autocontrast(ImageOps.grayscale(c), cutoff=1).convert("RGB")
    c.save(f"{OUT}/albums/{name}.jpg", quality=86)
    covers.append((c, name.split("-", 1)[-1] if "-" in name else name))
    print(f"cover {name}: src {w}x{h} crop {cw}x{chh}@({x0},{y0}) wm={wm}")

# ---------------- contact sheet ------------------------------------------
FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
def thumb(im, tw):
    return im.resize((tw, int(tw * im.size[1] / im.size[0])), Image.LANCZOS)

row1 = [thumb(t, 300) for t, _ in thumbs]
row2 = [thumb(c, 220) for c, _ in covers]
h1m = max(t.size[1] for t in row1) + 40
h2m = max(t.size[1] for t in row2) + 40
S = Image.new("RGB", (8 + len(row1) * 308, 8 + h1m + 8 + h2m), (20, 20, 20))
d = ImageDraw.Draw(S)
x = 8
for t, (im, label) in zip(row1, thumbs):
    S.paste(t, (x, 36)); d.text((x, 8), label, font=FONT, fill=(255, 210, 80)); x += 308
x = 8
for t, (im, label) in zip(row2, covers):
    S.paste(t, (x, 8 + h1m + 36)); d.text((x, 8 + h1m + 8), label, font=FONT, fill=(255, 210, 80)); x += 228
S.save(f"{ROOT}/.tmp/layers_check.jpg", quality=82)
print("LAYERS_OK")
for f in sorted(os.listdir(f"{OUT}/hero")):
    if f.startswith(("d-", "m-")):
        print(" ", f, Image.open(f"{OUT}/hero/{f}").size)
