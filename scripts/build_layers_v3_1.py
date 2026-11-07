#!/usr/bin/env python3
"""
Batolite v3.1 — rebuild hero layers from the client's NEW high-res renders (4961x3508).

Sources (upload/), all one camera/geometry, dark room on transparent bg:
  خام.png           all off                                   -> BASE
  همه سیلندر ها.png  four wall cylinders on (wall graze)        -> l1 Tubes   = F - A
  سیلندر دو.png     under-cabinet counter strip on             -> l2 Counter = B - A
  سیلندر چهار.png   strip + island pair (superset of دو)        -> l3 Flutes  = D - B
  کل کانتر.png      full kitchen + front floor pools            -> l4 Spots   = I - H
  لامپ بزرگ.png     living-room disc on                        -> l5 Eclipse = E - A

Engine: base canvas + 5 additive pool canvases (mix-blend plus-lighter).
Outputs (assets-private/hero/): d-base, d-l1..l5, d-allon (1440x1018)
                                m-base, m-l1..l5, m-allon (900x816, x-crop 12..88%)

Run with --preview to only write .tmp/v31_preview.jpg (states + faithfulness).
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

UP = "/home/z/my-project/upload"
OUT_DIR = "/home/z/my-project/assets-private/hero"
TMP = "/home/z/my-project/.tmp"
PREVIEW = "--preview" in sys.argv

F_RAW = "خام.png"
F_TUBES = "همه سیلندر ها.png"
F_STRIP = "سیلندر دو.png"
F_STRIP_PEND = "سیلندر چهار.png"
F_KAN_YEK = "کانتر یک.png"
F_KOL = "کل کانتر.png"
F_DISC = "لامپ بزرگ.png"

# (file, ref-file-or-None, key, label, gain)
LAYERS = [
    (F_TUBES, None, "l1", "Tubes", 1.55),     # wall quartet graze (strong source)
    (F_STRIP, None, "l2", "Counter", 2.30),   # under-cabinet strip (soft source)
    (F_STRIP_PEND, F_STRIP, "l3", "Flutes", 2.85),  # pure pair pool = D - B
    (F_KOL, F_KAN_YEK, "l4", "Spots", 2.40),  # ceiling spots / floor pools = I - H
    (F_DISC, None, "l5", "Eclipse", 1.45),    # disc pool (strong source)
]
FLOOR = 4.0            # noise-floor cut (levels) after subtraction
DESKTOP = (1440, 1018)
MOBILE_BOX = (0.12, 0.88)
MOBILE = (900, 816)

os.makedirs(TMP, exist_ok=True)

def load(name, size, box=None):
    """Load PNG full-res, optionally crop x-range fractions, resize, premultiply on black."""
    im = Image.open(os.path.join(UP, name)).convert("RGBA")
    if box:
        w, h = im.size
        im = im.crop((int(w * box[0]), 0, int(w * box[1]), h))
    im = im.resize(size, Image.LANCZOS)
    a = np.asarray(im, dtype=np.float32)
    rgb = a[..., :3] * (a[..., 3:4] / 255.0)
    alpha = a[..., 3] / 255.0
    del a, im
    return rgb, alpha

def build(size, box, tag):
    print(f"--- building [{tag}] {size} box={box}")
    raw_rgb, raw_a = load(F_RAW, size, box)
    lights = []
    for f, ref, k, label, gain in LAYERS:
        rgb, a = load(f, size, box)
        src_pre = rgb * a[..., None]
        del rgb, a
        ref_pre = None
        if ref is not None:
            ref_rgb, ref_a = load(ref, size, box)
            ref_pre = ref_rgb * ref_a[..., None]
            del ref_rgb, ref_a
        lights.append((k, label, gain, src_pre, ref_pre))

    # domain: union of light renders' opaque area, holes filled, trimmed to خام's alpha
    union = np.zeros((size[1], size[0]), bool)
    for f, _, k, label, gain in LAYERS:
        _, a = load(f, size, box)
        union |= a >= 0.5
        del a
    domain = ndimage.binary_fill_holes(union)
    del union
    domain &= raw_a >= 0.5
    print(f"    domain={domain.mean()*100:.1f}% of frame")

    base = raw_rgb * raw_a[..., None]
    base = np.where(domain[..., None], base, 0.0)
    del raw_rgb

    pools, stats = {}, {}
    for k, label, gain, src_pre, ref_pre in lights:
        d = src_pre - (ref_pre if ref_pre is not None else base)
        del src_pre
        pool = np.clip(d, 0, 255)
        del d
        pool = np.where(pool > FLOOR, pool - FLOOR, 0.0) * gain
        pool = np.where(domain[..., None], pool, 0.0)
        lum = pool.mean(axis=2)
        stats[k] = (label, gain, float(lum.max()), float(np.percentile(lum, 99.9)), float((lum > 12).mean() * 100))
        pools[k] = pool
        del pool
    # free per-light arrays
    lights = None

    allon = np.clip(base + sum(pools.values()), 0, 255)
    print("    pool stats: key gain p_max p99.9 lit%>12")
    for k, (label, gain, mx, p999, lit) in stats.items():
        print(f"      {k} {label:<8} x{gain:<5} {mx:6.1f} {p999:6.1f} {lit:5.2f}")
    return base, pools, allon, domain

def save_jpg(arr, path, q=85):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(path, quality=q)

# ---------------------------------------------------------------- engine check
def engine_check(size, box):
    base, pools, allon, _ = build(size, box, "check")
    def recon(*keys):
        return np.clip(base + sum(pools[k] for k in keys), 0, 255)
    def actual(name):
        rgb, a = load(name, size, box)
        out = rgb * a[..., None]
        del rgb, a
        return out
    checks = [
        ("base+l2 vs سیلندر دو", recon("l2"), actual(F_STRIP)),
        ("base+l2+l3 vs سیلندر چهار", recon("l2", "l3"), actual(F_STRIP_PEND)),
        ("base+l1 vs همه سیلندرها", recon("l1"), actual(F_TUBES)),
        ("base+l2+l1+l4 vs کل کانتر", recon("l1", "l2", "l4"), actual(F_KOL)),
        ("base+l5 vs لامپ بزرگ", recon("l5"), actual(F_DISC)),
    ]
    print("--- engine faithfulness (mean abs diff, 0-255)")
    for label, rec, act in checks:
        print(f"    {label:<38} {np.abs(rec - act).mean():.2f}")

if PREVIEW:
    SZ = (1024, 724)
    base, pools, allon, _ = build(SZ, None, "preview")
    engine_check(SZ, None)
    tiles = [("base", base)] + [(k, pools[k]) for k in sorted(pools)] + [("ALL-ON", allon)]
    cols, tw, th = 4, 470, 332
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (tw + 10) + 10, rows * (th + 40) + 10), (14, 14, 14))
    d = ImageDraw.Draw(sheet)
    f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
    for i, (name, arr) in enumerate(tiles):
        im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).resize((tw, th))
        x, y = 10 + (i % cols) * (tw + 10), 10 + (i // cols) * (th + 40)
        d.text((x, y + th + 6), name, fill=(255, 255, 100), font=f)
        sheet.paste(im, (x, y))
    sheet.save(os.path.join(TMP, "v31_preview.jpg"), quality=86)
    print("preview -> .tmp/v31_preview.jpg")
    sys.exit(0)

# ---------------------------------------------------------------- final assets
engine_check(DESKTOP, None)
os.makedirs(OUT_DIR, exist_ok=True)
for tag, size, box in [("d", DESKTOP, None), ("m", MOBILE, MOBILE_BOX)]:
    base, pools, allon, _ = build(size, box, tag)
    save_jpg(base, os.path.join(OUT_DIR, f"{tag}-base.jpg"))
    for k in sorted(pools):
        save_jpg(pools[k], os.path.join(OUT_DIR, f"{tag}-{k}.jpg"), q=88)
    save_jpg(allon, os.path.join(OUT_DIR, f"{tag}-allon.jpg"), q=86)
    print(f"    wrote {tag}-base / {tag}-l1..l5 / {tag}-allon")

# final states check sheet (desktop compositions)
base, pools, allon, _ = build(DESKTOP, None, "check-sheet")
states = [
    ("ALL OFF", base),
    ("Tubes", np.clip(base + pools["l1"], 0, 255)),
    ("Counter", np.clip(base + pools["l2"], 0, 255)),
    ("Flutes", np.clip(base + pools["l3"], 0, 255)),
    ("Spots", np.clip(base + pools["l4"], 0, 255)),
    ("Eclipse", np.clip(base + pools["l5"], 0, 255)),
    ("Kitchen all", np.clip(base + pools["l1"] + pools["l2"] + pools["l3"] + pools["l4"], 0, 255)),
    ("ALL-ON", allon),
]
cols, tw, th = 2, 660, 466
rows = (len(states) + 1) // 2
sheet = Image.new("RGB", (cols * (tw + 12) + 12, rows * (th + 44) + 12), (14, 14, 14))
d = ImageDraw.Draw(sheet)
f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
for i, (name, arr) in enumerate(states):
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).resize((tw, th))
    x, y = 12 + (i % cols) * (tw + 12), 12 + (i // cols) * (th + 44)
    d.text((x, y + th + 8), name, fill=(255, 255, 100), font=f)
    sheet.paste(im, (x, y))
sheet.save(os.path.join(TMP, "v31_states_check.jpg"), quality=88)
print("check sheet -> .tmp/v31_states_check.jpg")
print("DONE")
