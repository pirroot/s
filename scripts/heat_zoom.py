import os, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont

UP = '/home/z/my-project/upload'
names = ['خام.png', 'سیلندر دو.png', 'سیلندر سه.png', 'سیلندر چهار.png',
         'لامپ بزرگ.png', 'همه سیلندر ها.png', 'کانتر دو.png', 'کانتر یک.png', 'کل کانتر.png']
L = 'ABCDEFGHI'
CW = 900

def thumb(name):
    im = Image.open(os.path.join(UP, name))
    w, h = im.size
    return np.asarray(im.convert('RGBA').resize((CW, int(round(CW * h / w))), Image.LANCZOS), dtype=np.float32)

base = thumb(names[0])
base_rgb = base[..., :3] * (base[..., 3:4] / 255.0)
H, W = base_rgb.shape[:2]

imgs = {}
for n in names[1:]:
    a = thumb(n)
    imgs[n] = a[..., :3] * (a[..., 3:4] / 255.0)

def heat(rgb, gain=8.0):
    d = rgb - base_rgb
    pos = np.clip(d.mean(axis=2), 0, None)
    p = np.clip(pos * gain / 255.0, 0, 1) ** 0.7
    r = base_rgb[..., 0] * 0.3 + p * 255
    g = base_rgb[..., 1] * 0.3 + p * 215
    b = base_rgb[..., 2] * 0.3 + p * 60
    return np.stack([np.clip(r, 0, 255), np.clip(g, 0, 255), np.clip(b, 0, 255)], 2).astype(np.uint8)

# zoom: left 62% x full height (kitchen zone)
zx0, zx1 = 0, int(W * 0.62)
tiles = []
for i, n in enumerate(names[1:]):
    tiles.append((f'{L[i+1]} {n}', heat(imgs[n])[:, zx0:zx1]))
# differential diffs
def dif(names_pair, gain):
    a, b = names_pair
    d = imgs[b] - imgs[a]
    pos = np.clip(d.mean(axis=2), 0, None)
    p = np.clip(pos * gain / 255.0, 0, 1) ** 0.7
    r = base_rgb[..., 0] * 0.25 + p * 255
    g = base_rgb[..., 1] * 0.25 + p * 215
    bl = base_rgb[..., 2] * 0.25 + p * 60
    return np.stack([np.clip(r, 0, 255), np.clip(g, 0, 255), np.clip(bl, 0, 255)], 2).astype(np.uint8)[:, zx0:zx1]

tiles.append(('C minus B', dif(('سیلندر دو.png', 'سیلندر سه.png'), 14)))
tiles.append(('D minus B', dif(('سیلندر دو.png', 'سیلندر چهار.png'), 14)))
tiles.append(('I minus H', dif(('کانتر یک.png', 'کل کانتر.png'), 12)))
tiles.append(('H minus G', dif(('کانتر دو.png', 'کانتر یک.png'), 14)))
tiles.append(('G minus B', dif(('سیلندر دو.png', 'کانتر دو.png'), 12)))
tiles.append(('G minus F', dif(('همه سیلندر ها.png', 'کانتر دو.png'), 12)))

tw = 350
th = int(tw * H / W * (zx1 - zx0) / W * W / (zx1 - zx0))  # = tw * H/W scaled by crop fraction? keep simple:
th = int(tw * (H / W) * ((zx1 - zx0) / (W)) * (W / (zx1 - zx0)))
th = int(tw * H / W)  # crop keeps same aspect as full? no: crop width 0.62W, height H -> aspect = 0.62W/H
th = int(tw * H / (zx1 - zx0))
cols = 3
rows = (len(tiles) + cols - 1) // cols
pad = 22
sheet = Image.new('RGB', (cols * tw + (cols + 1) * pad, rows * (th + 22) + pad), (16, 16, 18))
dr = ImageDraw.Draw(sheet)
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 14)
for i, (label, arr) in enumerate(tiles):
    im = Image.fromarray(arr).resize((tw, th), Image.LANCZOS)
    r, c = divmod(i, cols)
    x = pad + c * (tw + pad)
    y = pad + r * (th + 22)
    sheet.paste(im, (x, y))
    dr.text((x, y + th + 3), label, fill=(255, 255, 120), font=font)
sheet.save('/tmp/render/heat_zoom.jpg', quality=85)
print('saved /tmp/render/heat_zoom.jpg', sheet.size, 'tiles:', len(tiles))
