#!/usr/bin/env python3
"""Two review sheets: (1) new product photos, (2) IMG_0299 hero video frames."""
from PIL import Image, ImageDraw, ImageFont
import os

FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)

def sheet(paths_labels, out, tw, cols, bg=(24,24,24)):
    thumbs = []
    for p, label in paths_labels:
        im = Image.open(p).convert("RGB")
        th = im.resize((tw, int(tw * im.size[1] / im.size[0])), Image.LANCZOS)
        thumbs.append((th, label))
    rows = (len(thumbs) + cols - 1) // cols
    ch = max(t.size[1] for t, _ in thumbs) + 34
    S = Image.new("RGB", (cols * (tw + 8) + 8, rows * (ch + 8) + 8), bg)
    d = ImageDraw.Draw(S)
    for i, (t, label) in enumerate(thumbs):
        x = 8 + (i % cols) * (tw + 8)
        y = 8 + (i // cols) * (ch + 8)
        S.paste(t, (x, y + 30))
        d.text((x, y + 4), label, font=FONT, fill=(255, 210, 80))
    S.save(out, quality=80)
    print(out, S.size)

photos = [
    ("upload/photo_2026-11-06_12-27-04.jpg", "P04 white cyl"),
    ("upload/photo_2026-11-06_12-27-08.jpg", "P08 black DL"),
    ("upload/photo_2026-11-06_12-27-15.jpg", "P15 concrete pend"),
    ("upload/photo_2026-11-06_12-27-21.jpg", "P21 ornament pend"),
    ("upload/photo_2026-11-06_12-27-25.jpg", "P25 disc pend"),
]
sheet(photos, ".tmp/products_sheet.jpg", 300, 3)

fr = sorted(os.listdir(".tmp/frames2"))
frames = [(f".tmp/frames2/{f}", f.replace(".jpg", "")) for f in fr]
sheet(frames, ".tmp/frames_sheet.jpg", 160, 7)
