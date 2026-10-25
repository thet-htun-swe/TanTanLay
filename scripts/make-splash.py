"""Makes the "KHA" gradient pictures (transparent background). Needs Pillow.
- assets/images/splash-icon.png: pastel, for the native splash screen and
  components/LoadingScreen.tsx (the same picture, so there is no jump).
- assets/images/kha-logo-dark.png / kha-logo-light.png: cropped, for
  components/BrandName.tsx (pastel on dark screens, deeper colours on light)."""
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 600
FONT = os.path.join(os.path.dirname(__file__), "fonts", "MarckScript-Regular.ttf")  # OFL, Google Fonts
SPACING = -6
BOLD = 8  # Marck Script has one weight; this thickens the strokes (rounded)
font = ImageFont.truetype(FONT, 355)

mask = Image.new("L", (W, H), 0)
d = ImageDraw.Draw(mask)
letters = "KHA"
widths = [d.textlength(c, font=font) for c in letters]
total = sum(widths) + SPACING * (len(letters) - 1)
x = (W - total) / 2
bbox = d.textbbox((0, 0), "KHA", font=font)
y = (H - (bbox[3] - bbox[1])) / 2 - bbox[1]
for c, w in zip(letters, widths):
    d.text((x, y), c, font=font, fill=255, stroke_width=BOLD, stroke_fill=255)
    x += w + SPACING

# Colours taken from the app icon: peach shirt, mint dress, lavender shirt
PASTEL = [(0.0, (255, 201, 174)), (0.5, (189, 235, 211)), (1.0, (217, 196, 245))]
# Same hues, deep enough to read on the light background
DEEP = [(0.0, (224, 113, 74)), (0.5, (46, 158, 120)), (1.0, (122, 85, 200))]
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "images")

def render(stops, name, crop):
    def color(t):
        for (a, ca), (b, cb) in zip(stops, stops[1:]):
            if t <= b:
                f = (t - a) / (b - a)
                return tuple(round(ca[i] + (cb[i] - ca[i]) * f) for i in range(3))
        return stops[-1][1]

    x0, y0, x1, y1 = mask.getbbox()
    grad = Image.new("RGB", (W, H))
    px = grad.load()
    for gx in range(W):
        c = color(min(1, max(0, (gx - x0) / (x1 - x0))))
        for gy in range(H):
            px[gx, gy] = c
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    if crop:
        out = out.crop((x0, y0, x1, y1))
    out.save(os.path.join(OUT, name))

render(PASTEL, "splash-icon.png", crop=False)
render(PASTEL, "kha-logo-dark.png", crop=True)
render(DEEP, "kha-logo-light.png", crop=True)
