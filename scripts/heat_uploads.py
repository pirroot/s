import os, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont

UP = '/home/z/my-project/upload'
files = sorted(glob.glob(os.path.join(UP, '*.png')))
files = [f for f in files if os.path.basename(f) != 'سیلندر یک.png']  # drop stale old-quality file
letters = 'ABCDEFGHI'
print('mapping (new-quality set):')
for i, f in enumerate(files):
    print(f'  {letters[i]} = {os.path.basename(f)}')

CW = 700
def thumb(f):
    im = Image.open(f)
    w, h = im.size
    return np.asarray(im.convert('RGBA').resize((CW, int(round(CW * h / w))), Image.LANCZOS), dtype=np.float32)

base = thumb(files[0])  # A = خام
base_rgb = base[..., :3] * (base[..., 3:4] / 255.0)
H, W = base_rgb.shape[:2]

tiles = []
for i, f in enumerate(files):
    a = thumb(f)
    rgb = a[..., :3] * (a[..., 3:4] / 255.0)
    d = rgb - base_rgb
    lum = d.mean(axis=2)
    pos = np.clip(lum, 0, None)
    neg = np.clip(-lum, 0, None)
    tiles.append((os.path.basename(f), pos, neg))

# amplified heatmaps: pos -> warm, neg -> cool, over dimmed base
GAIN = 9.0
sheet_cols, tw = 3, 340
th = int(tw * H / W)
rows = (len(tiles) + 2) // 3
pad = 26
sheet = Image.new('RGB', (3 * tw + 4 * pad, rows * (th + 24) + pad), (18, 18, 20))
dr = ImageDraw.Draw(sheet)
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)

def heat_to_rgb(pos, neg, dim_base):
    p = np.clip(pos * GAIN / 255.0, 0, 1) ** 0.75
    n = np.clip(neg * GAIN / 255.0, 0, 1) ** 0.75
    r = dim_base[..., 0] * 0.35 + p * 255.0
    g = dim_base[..., 1] * 0.35 + (p * 0.82 + n * 0.25) * 255.0 * 0.9
    b = dim_base[..., 2] * 0.35 + n * 200.0
    return np.stack([np.clip(r, 0, 255), np.clip(g, 0, 255), np.clip(b, 0, 255)], axis=2).astype(np.uint8)

for i, (name, pos, neg) in enumerate(tiles):
    heat = heat_to_rgb(pos, neg, base_rgb)
    im = Image.fromarray(heat).resize((tw, th), Image.LANCZOS)
    r, c = divmod(i, 3)
    x = pad + c * (tw + pad)
    y = pad + r * (th + 24)
    sheet.paste(im, (x, y))
    # per-tile lit stats
    lit = (pos > 12).mean() * 100
    dr.text((x, y + th + 4), f'{letters[i]} lit={lit:.2f}%', fill=(255, 255, 120), font=font)

out = '/tmp/render/heat.jpg'
sheet.save(out, quality=85)
print('saved', out, sheet.size)

# also stats table: quadrant decomposition of positive diff per image
print('\n=== positive-diff mass by horizontal thirds (left/mid/right %) and vertical halves ===')
for name, pos, neg in tiles:
    total = pos.sum()
    if total <= 0:
        print(f'{name}: no positive diff'); continue
    lt = pos[:, : W // 3].sum() / total * 100
    md = pos[:, W // 3: 2 * W // 3].sum() / total * 100
    rt = pos[:, 2 * W // 3:].sum() / total * 100
    tp = pos[: H // 2].sum() / total * 100
    print(f'{name}: L={lt:.0f}% M={md:.0f}% R={rt:.0f}% | top={tp:.0f}% bot={100-tp:.0f}% | maxpos={pos.max():.0f}')
