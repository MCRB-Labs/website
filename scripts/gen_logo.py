"""Generate MCRB Labs logo PNGs from the brand's design tokens.
Run once locally to (re)produce the PNG assets; not used by the site at runtime.
"""
from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = "C:/Windows/Fonts/"

INK = (16, 16, 7, 255)
BRIGHT = (231, 255, 168, 255)
ACCENT = (185, 242, 61, 255)
MID = (127, 163, 28, 255)
DEEP = (60, 77, 12, 255)
LIGHT_TEXT = (244, 243, 233, 255)
GRAY = (110, 108, 91, 255)

bold = lambda sz: ImageFont.truetype(FONTS + "arialbd.ttf", sz)
black = lambda sz: ImageFont.truetype(FONTS + "ariblk.ttf", sz)


def draw_mark(draw, x0, y0, size, scale_ref=100):
    """Draw the 2x2 monogram mark into `draw`, top-left at (x0,y0), given size."""
    s = size / scale_ref
    draw.rounded_rectangle([x0, y0, x0 + size, y0 + size], radius=22 * s, fill=INK)
    tiles = [
        (9, 9, BRIGHT, "M", INK),
        (54, 9, ACCENT, "C", INK),
        (9, 54, MID, "R", INK),
        (54, 54, DEEP, "B", LIGHT_TEXT),
    ]
    for tx, ty, color, letter, tcolor in tiles:
        tx0, ty0 = x0 + tx * s, y0 + ty * s
        tw = 37 * s
        draw.rounded_rectangle([tx0, ty0, tx0 + tw, ty0 + tw], radius=8 * s, fill=color)
        f = bold(int(tw * 0.52))
        draw.text((tx0 + tw / 2, ty0 + tw / 2 + tw * 0.03), letter, font=f, fill=tcolor, anchor="mm")


# ---- 1) standalone icon mark, transparent outside the rounded square ----
SIZE = 1024
img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
draw_mark(d, 0, 0, SIZE)
img.save(os.path.join(ROOT, "mcrb-labs-icon.png"))

# ---- 2) full wordmark lockup: icon + "MCRB" / "LABS" ----
icon_h = 360
gap = 56
f_mcrb = black(200)
f_labs = bold(58)

tmp = Image.new("RGBA", (10, 10))
td = ImageDraw.Draw(tmp)
mcrb_bbox = td.textbbox((0, 0), "MCRB", font=f_mcrb)
labs_bbox = td.textbbox((0, 0), "L A B S", font=f_labs)
text_w = max(mcrb_bbox[2] - mcrb_bbox[0], labs_bbox[2] - labs_bbox[0])

pad = 40
W = pad * 2 + icon_h + gap + text_w
H = pad * 2 + icon_h

logo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ld = ImageDraw.Draw(logo)
draw_mark(ld, pad, pad, icon_h)

text_x = pad + icon_h + gap
mcrb_h = mcrb_bbox[3] - mcrb_bbox[1]
labs_h = labs_bbox[3] - labs_bbox[1]
block_h = mcrb_h + 22 + labs_h
top = pad + (icon_h - block_h) / 2

ld.text((text_x, top - mcrb_bbox[1]), "MCRB", font=f_mcrb, fill=INK)
ld.text((text_x, top + mcrb_h + 22 - labs_bbox[1]), "L A B S", font=f_labs, fill=GRAY)

logo.save(os.path.join(ROOT, "mcrb-labs-logo.png"))

print("Wrote mcrb-labs-icon.png", img.size)
print("Wrote mcrb-labs-logo.png", logo.size)
