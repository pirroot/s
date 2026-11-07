#!/usr/bin/env python3
"""Batolite — placeholder asset pipeline.
Generates: 8 hero states (desktop + mobile crop), 6 B&W album covers, OG image.
Hero states: 3 light groups (Pendant, Cove-strip, Downlight) x on/off.
'Off' state is derived from the lit render (desaturate + darken) so crossfade stays seamless.
When the client's real 8 renders arrive, files in assets-private/hero/ are swapped 1:1.
"""
import os
import numpy as np
from PIL import Image, ImageOps, ImageDraw, ImageFont

ROOT = "/home/z/my-project"
SRC = f"{ROOT}/upload/photo_2026-11-04_23-19-22.jpg"
VIDEO_LIT = f"{ROOT}/.tmp/mob_lit.png"
OUT = f"{ROOT}/assets-private"
PUB = f"{ROOT}/public"
os.makedirs(f"{OUT}/hero", exist_ok=True)
os.makedirs(f"{OUT}/albums", exist_ok=True)
os.makedirs(PUB, exist_ok=True)

lit = Image.open(SRC).convert("RGB")
W, H = lit.size  # 1280 x 904

# ---------------- hero: off state (neutral, moody dark) ----------------
g = np.asarray(lit.convert("L"), dtype=np.float32)
off_arr = np.clip(g * 0.38 + 6, 0, 255)[..., None].repeat(3, axis=2)
lit_arr = np.asarray(lit, dtype=np.float32)

# light-group masks (fractions of W,H): center_x, center_y, radius_x, radius_y
G_P = [(0.424, 0.315, 0.095, 0.175), (0.699, 0.295, 0.074, 0.072)]   # pendants + disc
G_C = [(0.295, 0.365, 0.117, 0.144), (0.207, 0.575, 0.133, 0.077)]   # cove strip + floor spill
G_S = [(0.309, 0.208, 0.105, 0.061)]                                  # ceiling downlights
GROUPS = [G_P, G_C, G_S]

yy, xx = np.mgrid[0:H, 0:W]
xf, yf = xx / W, yy / H

def blob_mask(blobs):
    m = np.zeros((H, W), np.float32)
    for cx, cy, rx, ry in blobs:
        dx = (xf - cx) / rx
        dy = (yf - cy) / ry
        gm = np.exp(-0.6 * (dx * dx + dy * dy))
        m = np.maximum(m, gm)
    return np.clip(m * 1.3, 0, 1)[..., None]

def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

for p in range(2):
    for c in range(2):
        for s in range(2):
            if p == c == s == 1:
                img = lit
            else:
                wsum = np.zeros((H, W, 1), np.float32)
                for on, blobs in zip((p, c, s), GROUPS):
                    if on:
                        wsum = np.maximum(wsum, blob_mask(blobs))
                wsum = smoothstep(0.15, 0.75, wsum)
                arr = off_arr * (1 - wsum) + lit_arr * wsum
                img = Image.fromarray(arr.astype("uint8"))
            img.save(f"{OUT}/hero/state-{p}{c}{s}.jpg", quality=86)
            img.crop((250, 0, 666, H)).save(f"{OUT}/hero/m-state-{p}{c}{s}.jpg", quality=86)

# ---------------- album covers (900x1200, B&W) ----------------
def cover(img, box, name, gray=True, target=(900, 1200)):
    c = img.crop(box)
    w, h = c.size
    tr = target[0] / target[1]
    if w / h > tr:
        nw = int(h * tr)
        c = c.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w / tr)
        c = c.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    if gray:
        c = ImageOps.grayscale(c).convert("RGB")
    c = c.resize(target, Image.LANCZOS)
    c = ImageOps.autocontrast(c, cutoff=1)
    c.save(f"{OUT}/albums/{name}.jpg", quality=84)

rot = Image.open(VIDEO_LIT).convert("RGB").transpose(Image.ROTATE_90)  # frontal alternate camera, 1920x1072
rot.save(f"{OUT}/albums/_rot_full.jpg", quality=90)

cover(lit, (390, 140, 720, 580), "a1-orbit")       # island pendants
cover(lit, (190, 190, 530, 643), "a2-cove")        # warm alcove strip
cover(rot, (400, 100, 830, 673), "a3-halo")        # downlights, alternate angle
cover(rot, (558, 0, 1362, 1072), "a4-plan")        # island elevation, alternate angle
cover(Image.open(f"{ROOT}/upload/photo_2026-11-04_23-19-56.jpg").convert("RGB"),
      (135, 0, 945, 1080), "a5-object")            # product object study
cover(lit, (700, 150, 1120, 710), "a6-living")     # living room

# ---------------- OG image 1200x630 ----------------
og = lit.crop((0, 90, 1280, 762)).resize((1200, 630), Image.LANCZOS)
og = Image.blend(Image.new("RGB", og.size, (8, 8, 8)), og, 0.85)
d = ImageDraw.Draw(og)
fb = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 52)
fs = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 19)

def spaced(dr, xy, text, font, spacing, fill):
    x, y = xy
    for ch in text:
        dr.text((x, y), ch, font=font, fill=fill)
        x += dr.textlength(ch, font=font) + spacing

spaced(d, (66, 470), "BATOLITE", fb, 22, (240, 240, 240))
d.text((70, 548), "SCULPTED LIGHTING FOR CONTEMPORARY SPACES", font=fs, fill=(175, 175, 175))
og.save(f"{PUB}/og.jpg", quality=86)

# ---------------- contact sheet for review ----------------
def thumb(path, tw):
    im = Image.open(path)
    return im.resize((tw, int(tw * im.size[1] / im.size[0])), Image.LANCZOS)

rows = []
r3 = [thumb(f"{OUT}/albums/a{i}-{n}.jpg", 150) for i, n in
      [(1, "orbit"), (2, "cove"), (3, "halo"), (4, "plan"), (5, "object"), (6, "living")]]
sheet2 = Image.new("RGB", (6 * 150 + 7 * 8, 200 + 16), (250, 250, 250))
x = 8
for t in r3:
    sheet2.paste(t, (x, 8)); x += 158
sheet2.save(f"{ROOT}/.tmp/covers_check.jpg", quality=82)
print("ASSETS_OK")
for f in sorted(os.listdir(f"{OUT}/hero"))[:3]:
    print(" sample:", f, Image.open(f"{OUT}/hero/{f}").size)
