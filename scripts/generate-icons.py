#!/usr/bin/env python3
"""Generates simple placeholder app icons for the Thunder Trainer PWA.

Creates a dark gradient square with the app's orange thunderbolt and saves
192px / 512px PNGs (plus a maskable variant) into public/icons/.

Usage: python3 scripts/generate-icons.py
"""
import os
import shutil
from PIL import Image, ImageDraw

OUT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "public", "icons")
)

BG_TOP = (15, 25, 35)   # #0f1923
BG_BOT = (32, 52, 78)   # #20344e
BOLT = (249, 115, 22)   # #f97316 (app thunder orange)

# Lightning bolt, normalized to a 100x100 box.
BOLT_PTS = [
    (68, 8),
    (30, 58),
    (56, 58),
    (46, 96),
    (74, 36),
    (56, 36),
]


def make(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size))
    px = img.load()
    # Vertical gradient background.
    for y in range(size):
        t = y / (size - 1)
        r = int(BG_TOP[0] + (BG_BOT[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOT[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOT[2] - BG_TOP[2]) * t)
        for x in range(size):
            px[x, y] = (r, g, b)
    # Lightning bolt on top (scaled into a 70% centered box).
    m = 0.15 * size
    box = size - 2 * m
    scaled = [(m + nx / 100 * box, m + ny / 100 * box) for nx, ny in BOLT_PTS]
    ImageDraw.Draw(img).polygon(scaled, fill=BOLT)
    return img


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    print("Generating placeholder icons...\n")
    for size in (192, 512):
        make(size).save(os.path.join(OUT_DIR, f"icon-{size}.png"))
        print(f"  ✓ icons/icon-{size}.png")
    shutil.copyfile(
        os.path.join(OUT_DIR, "icon-512.png"),
        os.path.join(OUT_DIR, "icon-512-maskable.png"),
    )
    print("  ✓ icons/icon-512-maskable.png")
    print("\n✅ Done! 3 icon files in public/icons/")


if __name__ == "__main__":
    main()
