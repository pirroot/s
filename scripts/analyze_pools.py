#!/usr/bin/env python3
"""Deep analysis at working resolution (downscale first -> low memory)."""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

UP = "/home/z/my-project/upload"
OUT = "/home/z/my-project/.tmp"
LIGHTS = ["سیلندر یک.png", "سیلندر دو.png", "سیلندر سه.png", "سیلندر چهار.png",
          "کانتر یک.png", "لامپ بزرگ.png"]
KEYS = ["c1", "c2", "c3", "c4", "k1", "b1"]
W = 1024  # analysis width

def load_scaled(name, w=W):
    im = Image.open(os.path.join(UP, name)).convert("RGBA")
    h = int(w * im.size[1] / im.size[0])
    a = np.array(im.resize((w, h), Image.LANCZOS))
    return a[..., :3].astype(np.float32), a[..., 3], (w, h)

rgbs, alphas = {}, {}
size = None
for k, n in zip(KEYS, LIGHTS):
    rgbs[k], alphas[k], size = load_scaled(n)
raw_rgb, raw_a, _ = load_scaled("خام.png")
H, Wd = size[1], size[0]
print(f"analysis size: {Wd}x{H}")

print("=== alpha==0 region RGB (stored values) ===")
for k in KEYS:
    t = alphas[k] < 128
    print(f"{k}: transparent={t.mean()*100:.1f}%  stored-rgb mean={rgbs[k][t].mean():.1f}" if t.any() else f"{k}: no transparency")
t = raw_a < 128
print(f"raw: transparent={t.mean()*100:.1f}%  stored-rgb mean={raw_rgb[t].mean():.1f}" if t.any() else "raw: opaque")

raw_op = raw_a >= 128
inter = np.ones((H, Wd), bool)
union = np.zeros((H, Wd), bool)
for k in KEYS:
    op = alphas[k] >= 128
    inter &= op
    union |= op
print(f"raw-opaque={(raw_op).mean()*100:.0f}% union={union.mean()*100:.0f}% intersection={inter.mean()*100:.0f}%")
cov = ((alphas[k] >= 128) & raw_op).sum() / raw_op.sum()
print(f"last-light coverage of raw-opaque: {cov*100:.1f}%")

# darkbase = per-channel min across lights (transparent -> +inf)
INF = 1e9
stack = np.stack([np.where(alphas[k][..., None] >= 128, rgbs[k], INF) for k in KEYS])
darkbase = np.where(stack.min(axis=0) >= INF / 2, 0.0, stack.min(axis=0))
del stack

pools = {}
for k in KEYS:
    filled = np.where(alphas[k][..., None] >= 128, rgbs[k], 0.0)
    pools[k] = np.clip(filled - darkbase, 0, 255)

f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
tiles = [("darkbase", darkbase)] + [(k, pools[k]) for k in KEYS]
sheet = Image.new("RGB", (3 * 510 + 40, 2 * 300 + 100), (18, 18, 18))
d2 = ImageDraw.Draw(sheet)
for idx, (name, arr) in enumerate(tiles):
    a = np.where(inter[..., None], arr, 0)
    lum = a.mean(axis=2)
    nz = lum[lum > 2]
    p995 = np.percentile(a, 99.5)
    gain = 255.0 / max(p995, 1.0)
    vis = np.clip(a * gain, 0, 255).astype(np.uint8)
    im = Image.fromarray(vis).resize((500, 281))
    x = 10 + (idx % 3) * 520
    y = 60 + (idx // 3) * 390
    d2.text((x, y - 26), f"{name} gain x{gain:.1f} litpx={int((lum>25).sum())}", fill=(255, 255, 0), font=f)
    sheet.paste(im, (x, y))
sheet.save(os.path.join(OUT, "pools_sheet.jpg"), quality=85)

# centroids of each pool (weighted by luminance, inside room domain)
print("\n=== pool centroids (percent of frame) ===")
for k in KEYS:
    lum = np.where(inter, pools[k].mean(axis=2), 0)
    lum = np.where(lum > 12, lum, 0)
    tot = lum.sum()
    cy, cx = np.average(np.indices(lum.shape), weights=lum, axis=(1, 2))
    ys, xs = np.where(lum > 40)
    bbox = f"bbox x[{xs.min()}-{xs.max()}] y[{ys.min()}-{ys.max()}]" if len(ys) else "no bright px"
    print(f"{k}: centroid ({cx/Wd*100:.0f}%, {cy/H*100:.0f}%)  {bbox}")

# raw + all-on preview
base_room = np.where(raw_op[..., None] & union[..., None], raw_rgb, 0.0)
allon = np.clip(base_room + sum(np.where(inter[..., None], pools[k], 0.0) for k in KEYS), 0, 255)
comp = Image.new("RGB", (2 * 700 + 30, 550), (18, 18, 18))
d3 = ImageDraw.Draw(comp)
for idx, (name, arr) in enumerate([("raw base (opaque+union)", base_room), ("ALL-ON = raw + 6 pools", allon)]):
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).resize((690, 488))
    d3.text((10 + idx * 715, 8), name, fill=(255, 255, 0), font=f)
    comp.paste(im, (10 + idx * 715, 40))
comp.save(os.path.join(OUT, "allon_preview.jpg"), quality=88)
print("\nsaved pools_sheet.jpg + allon_preview.jpg")
