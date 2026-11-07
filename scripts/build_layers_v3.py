#!/usr/bin/env python3
"""
Batolite v3 — build hero layers from the client's real per-light renders.

Sources (upload/):
  خام.png          raw room, all lights off (monochrome ambient) -> BASE
  سیلندر یک..چهار  same camera, one cylinder wall light on  -> pools l1..l4
  کانتر یک         same camera, island pendants on          -> pool l5 (Flute)
  لامپ بزرگ        same camera, living-room disc on         -> pool l6 (Eclipse)

Engine model (additive, faithful to the renders):
  base  = خام premultiplied on black, masked to the room domain
  pool_i= max(0, light_i - darkbase) * GAIN   (darkbase = min over the 6 lights)
  on-screen: base <canvas> + 6 pool <canvas mix-blend plus-lighter>

Outputs into assets-private/hero/:
  d-base.jpg d-l1..l6.jpg   (1280x904)
  m-base.jpg m-l1..l6.jpg   (900x816, crop x 12%..88%)
  d-allon.jpg m-allon.jpg   (pre-composited all-on, for the "scene" section)

Run with --preview to write .tmp/v3_preview.jpg instead of writing assets.
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

UP = "/home/z/my-project/upload"
OUT_DIR = "/home/z/my-project/assets-private/hero"
TMP = "/home/z/my-project/.tmp"
PREVIEW = "--preview" in sys.argv

LIGHTS = [  # (file, key, label)
    ("سیلندر یک.png", "l1", "Tube I"),
    ("سیلندر دو.png", "l2", "Tube II"),
    ("سیلندر سه.png", "l3", "Tube III"),
    ("سیلندر چهار.png", "l4", "Tube IV"),
    ("کانتر یک.png", "l5", "Flute"),
    ("لامپ بزرگ.png", "l6", "Eclipse"),
]
GAIN = 1.7           # gentle boost so pools read against the grey ambient base
DESKTOP = (1280, 904)
MOBILE_BOX = (0.12, 0.88)   # x-range kept for the mobile crop (fraction of width)
MOBILE = (900, 816)

os.makedirs(TMP, exist_ok=True)

def load(name, size=None, box=None):
    """Load PNG, optionally crop x-range (fractions) and resize to `size`."""
    im = Image.open(os.path.join(UP, name)).convert("RGBA")
    if box:
        w, h = im.size
        im = im.crop((int(w * box[0]), 0, int(w * box[1]), h))
    if size:
        im = im.resize(size, Image.LANCZOS)
    a = np.array(im)
    return a[..., :3].astype(np.float32), a[..., 3].astype(np.float32) / 255.0

def build(size, box=None, tag="d"):
    print(f"--- building [{tag}] size={size} box={box}")
    raw_rgb, raw_a = load("خام.png", size, box)
    lights = [(k, *load(f, size, box)) for f, k, _ in LIGHTS]

    # room domain: union of the light renders' opaque area, holes filled
    # (fills the window/curtain zone that the light exports cut away),
    # then trimmed to the raw render's own opaque area and to its alpha.
    union = np.zeros((size[1], size[0]), bool)
    for _, _, a in lights:
        union |= a >= 0.5
    domain = ndimage.binary_fill_holes(union)
    domain &= raw_a >= 0.5
    print(f"    domain={domain.mean()*100:.1f}% of frame")

    # base = خام on black
    base = raw_rgb * raw_a[..., None]
    base = np.where(domain[..., None], base, 0.0)

    # darkbase = per-channel min across the six light renders
    INF = 1e9
    stack = np.stack([np.where(a[..., None] >= 0.5, rgb, INF) for _, rgb, a in lights])
    darkbase = np.where(stack.min(axis=0) >= INF / 2, 0.0, stack.min(axis=0))
    del stack

    pools = {}
    for k, rgb, a in lights:
        pool = np.clip(rgb * a[..., None] - darkbase, 0, 255) * GAIN
        pools[k] = np.where(domain[..., None], pool, 0.0)

    allon = np.clip(base + sum(pools.values()), 0, 255)
    return base, pools, allon, domain

def save_jpg(arr, path, q=85):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(path, quality=q)

if PREVIEW:
    base, pools, allon, domain = build((1024, 724))
    tiles = [("base", base)] + [(k, pools[k]) for k in sorted(pools)] + [("ALL-ON", allon)]
    cols = 4
    rows = (len(tiles) + cols - 1) // cols
    tw, th = 500, 354
    sheet = Image.new("RGB", (cols * (tw + 10) + 10, rows * (th + 40) + 10), (16, 16, 16))
    d = ImageDraw.Draw(sheet)
    f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
    for i, (name, arr) in enumerate(tiles):
        im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).resize((tw, th))
        x = 10 + (i % cols) * (tw + 10)
        y = 10 + (i // cols) * (th + 40)
        d.text((x, y + th + 6), name, fill=(255, 255, 100), font=f)
        sheet.paste(im, (x, y))
    sheet.save(os.path.join(TMP, "v3_preview.jpg"), quality=86)
    print("preview -> .tmp/v3_preview.jpg")
    sys.exit(0)

# ---------------- final assets ----------------
os.makedirs(OUT_DIR, exist_ok=True)
for tag, size, box in [("d", DESKTOP, None), ("m", MOBILE, MOBILE_BOX)]:
    base, pools, allon, _ = build(size, box, tag)
    save_jpg(base, os.path.join(OUT_DIR, f"{tag}-base.jpg"))
    for k in sorted(pools):
        save_jpg(pools[k], os.path.join(OUT_DIR, f"{tag}-{k}.jpg"), q=88)
    save_jpg(allon, os.path.join(OUT_DIR, f"{tag}-allon.jpg"), q=85)
    print(f"    wrote {tag}-base / {tag}-l1..l6 / {tag}-allon")

# verification contact sheet (desktop states)
base, pools, allon, _ = build(DESKTOP, None, "check")
states = [("all OFF", base)]
for k in ["l1", "l5"]:
    states.append((f"base+{k}", np.clip(base + pools[k], 0, 255)))
states.append(("ALL-ON", allon))
sheet = Image.new("RGB", (2 * 640 + 30, 2 * 452 + 70), (16, 16, 16))
d = ImageDraw.Draw(sheet)
f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
for i, (name, arr) in enumerate(states):
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).resize((630, 444))
    x = 10 + (i % 2) * 650
    y = 10 + (i // 2) * 502
    d.text((x, y + 452), name, fill=(255, 255, 100), font=f)
    sheet.paste(im, (x, y))
sheet.save(os.path.join(TMP, "v3_states_check.jpg"), quality=88)
print("check sheet -> .tmp/v3_states_check.jpg")
print("DONE")
