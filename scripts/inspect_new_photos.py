#!/usr/bin/env python3
"""Inspect the 7 new user photos: size, alpha, brightness, same-camera alignment."""
import os, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont

UP = "/home/z/my-project/upload"
OUT = "/home/z/my-project/.tmp"
os.makedirs(OUT, exist_ok=True)

files = sorted(glob.glob(os.path.join(UP, "*.png")))
# keep only the 7 new ones (exclude older known product photos)
new_names = ["خام.png", "سیلندر چهار.png", "سیلندر دو.png", "سیلندر سه.png",
             "سیلندر یک.png", "کانتر یک.png", "لامپ بزرگ.png"]
paths = [os.path.join(UP, n) for n in new_names]

imgs = {}
for p in paths:
    im = Image.open(p)
    name = os.path.basename(p)
    print(f"--- {name}")
    print(f"    size={im.size} mode={im.mode}")
    rgba = im.convert("RGBA")
    a = np.array(rgba)
    alpha = a[..., 3]
    rgb = a[..., :3].astype(np.float32)
    lum = rgb.mean(axis=2)
    print(f"    alpha min={alpha.min()} max={alpha.max()}  transparent px={(alpha<255).sum()}")
    print(f"    lum mean={lum.mean():.1f} p99={np.percentile(lum,99):.1f} max={lum.max():.0f}")
    # white pixels (near pure white)
    white = ((rgb>245).all(axis=2)).sum()
    print(f"    near-white px={white} ({100*white/rgb[...,0].size:.2f}%)")
    imgs[name] = im

# ---- same-camera alignment check: downscale luminance, correlate
print("\n=== alignment (corr of luminance, downscaled 256w) ===")
def lum_small(im, w=256):
    g = np.array(im.convert("RGB").astype(np.float32).mean(axis=2) if False else im.convert("L").resize((w, int(w*im.size[1]/im.size[0]))), dtype=np.float32)
    g = (g - g.mean()) / (g.std() + 1e-6)
    return g

keys = list(imgs.keys())
for i in range(len(keys)):
    for j in range(i+1, len(keys)):
        a, b = lum_small(imgs[keys[i]]), lum_small(imgs[keys[j]])
        h = min(a.shape[0], b.shape[0]); w = min(a.shape[1], b.shape[1])
        c = float((a[:h,:w]*b[:h,:w]).mean())
        print(f"  {keys[i][:12]:12s} vs {keys[j][:12]:12s}: {c:+.3f}")

# ---- contact sheet
TILE_W = 520
cols = 2
rows = (len(paths)+cols-1)//cols
tiles = []
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
except Exception:
    font = ImageFont.load_default()
for p in paths:
    im = Image.open(p).convert("RGB")
    th = im.resize((TILE_W, int(TILE_W*im.size[1]/im.size[0])))
    tiles.append((os.path.basename(p), th))
tile_h = max(t.size[1] for _, t in tiles) + 44
sheet = Image.new("RGB", (cols*(TILE_W+16)+16, rows*tile_h+16), (24,24,24))
d = ImageDraw.Draw(sheet)
for k, (name, t) in enumerate(tiles):
    x = 16 + (k % cols)*(TILE_W+16); y = 16 + (k // cols)*tile_h
    d.text((x, y), name, fill=(255,255,120), font=font)
    sheet.paste(t, (x, y+34))
sheet.save(os.path.join(OUT, "new_photos_sheet.jpg"), quality=82)
print(f"\nsheet saved: {OUT}/new_photos_sheet.jpg size={sheet.size}")
