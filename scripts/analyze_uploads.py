import os, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont

UP = '/home/z/my-project/upload'
files = sorted(glob.glob(os.path.join(UP, '*.png')))
letters = 'ABCDEFGHIJ'
print('=== mapping ===')
for i, f in enumerate(files):
    print(f'  {letters[i]} = {os.path.basename(f)}')

# memory-safe: thumbnail first, keep only small arrays
CW = 760
arrs = {}
for i, f in enumerate(files):
    im = Image.open(f)
    size_full = im.size
    rgba = im.convert('RGBA').resize((CW, int(round(CW * size_full[1] / size_full[0]))), Image.LANCZOS)
    a = np.asarray(rgba, dtype=np.float32)
    arrs[letters[i]] = a
    rgb = a[..., :3]
    alpha = a[..., 3]
    opaque = rgb[alpha > 128] if (alpha > 128).any() else rgb.reshape(-1, 3)
    print(f"{letters[i]} full={size_full} mean_opaque={opaque.mean():.1f} "
          f"alpha_opaque%={(alpha > 128).mean() * 100:.0f} min={opaque.min():.0f} p5={np.percentile(opaque, 5):.0f}")

keys = list(arrs.keys())
H, W = arrs['A'].shape[:2]

# brightness grid 4x3 (opaque luminance)
print('\n=== luminance grid 4x3 (opaque only, 0-255) ===')
for k in keys:
    a = arrs[k]
    lum = a[..., :3].mean(axis=2)
    cells = []
    for r in range(3):
        for c in range(4):
            cell = lum[r * H // 3:(r + 1) * H // 3, c * W // 4:(c + 1) * W // 4]
            m = a[..., 3][r * H // 3:(r + 1) * H // 3, c * W // 4:(c + 1) * W // 4] > 128
            cells.append(cell[m].mean() if m.any() else float('nan'))
    print(k, ' '.join(f'{v:5.0f}' for v in cells))

# pairwise diff on opaque domain (RGB channels)
print('\n=== pairwise mean abs diff over shared-opaque area ===')
hdr = '     ' + ' '.join(f'{k:>5}' for k in keys)
print(hdr)
for i, ki in enumerate(keys):
    row = []
    for j, kj in enumerate(keys):
        ai, aj = arrs[ki], arrs[kj]
        m = (ai[..., 3] > 128) & (aj[..., 3] > 128)
        if m.any():
            d = np.abs(ai[..., :3] - aj[..., :3])[m].mean()
        else:
            d = float('nan')
        row.append(f'{d:5.1f}')
    print(f'  {ki} ' + ' '.join(row))

# for the darkest candidate (base): how much each other adds
print('\n=== pair lit analysis: frac of shared-opaque pixels j brighter >12, gain there ===')
for i, ki in enumerate(keys):
    for j, kj in enumerate(keys):
        if j <= i:
            continue
        ai, aj = arrs[ki], arrs[kj]
        m = (ai[..., 3] > 128) & (aj[..., 3] > 128)
        if not m.any():
            continue
        li = ai[..., :3][m].mean(axis=1)
        lj = aj[..., :3][m].mean(axis=1)
        d = lj - li
        frac = (d > 12).mean()
        if frac > 0.005:
            print(f'{ki}->{kj}: lit_frac={frac:.3f} gain={d[d > 12].mean():.0f}')

# contact sheet (opaque on dark checker to reveal alpha)
TH_W = 330
ar = W / H
th = int(TH_W / ar)
cols, rows = 3, (len(files) + 2) // 3
pad = 24
sheet = Image.new('RGB', (cols * TH_W + (cols + 1) * pad, rows * (th + 22) + (rows + 1) * pad), (30, 30, 34))
dr = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except Exception:
    font = ImageFont.load_default()
for i, f in enumerate(files):
    a = arrs[letters[i]]
    rgba = np.zeros((H, W, 4), np.uint8)
    rgba[..., :3] = np.clip(a[..., :3], 0, 255).astype(np.uint8)
    rgba[..., 3] = np.clip(a[..., 3], 0, 255).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA')
    bg = Image.new('RGBA', im.size, (52, 52, 60, 255))
    bg.alpha_composite(im)
    im = bg.convert('RGB').resize((TH_W, th), Image.LANCZOS)
    r, c = divmod(i, cols)
    x = pad + c * (TH_W + pad)
    y = pad + r * (th + 22 + pad)
    sheet.paste(im, (x, y))
    dr.text((x, y + th + 4), f'{letters[i]}', fill=(255, 255, 120), font=font)
os.makedirs('/tmp/render', exist_ok=True)
sheet.save('/tmp/render/contact.jpg', quality=82)
print('\ncontact sheet saved: /tmp/render/contact.jpg', sheet.size)
