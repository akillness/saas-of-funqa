#!/usr/bin/env python3

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
APP_DIR = ROOT / "apps" / "web" / "app"
PUBLIC_DIR = ROOT / "apps" / "web" / "public"
DEFAULT_SQUARE = ROOT / ".runtime" / "brand-assets" / "raw" / "funqa-square-raw.png"
DEFAULT_WIDE = ROOT / ".runtime" / "brand-assets" / "raw" / "funqa-wide-raw.png"


def load_font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Avenir Next.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNS.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            try:
                return ImageFont.truetype(str(path), size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def cover_resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    src_w, src_h = image.size
    dest_w, dest_h = size
    src_ratio = src_w / src_h
    dest_ratio = dest_w / dest_h

    if src_ratio > dest_ratio:
        scale = dest_h / src_h
    else:
        scale = dest_w / src_w

    resized = image.resize((int(src_w * scale), int(src_h * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - dest_w) // 2
    top = (resized.height - dest_h) // 2
    return resized.crop((left, top, left + dest_w, top + dest_h))


def add_gradient_overlay(image: Image.Image, *, top_alpha: int, bottom_alpha: int) -> Image.Image:
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    width, height = image.size
    for y in range(height):
        t = y / max(1, height - 1)
        alpha = int(top_alpha * (1 - t) + bottom_alpha * t)
        color = (
            int(30 + 8 * t),
            int(93 + 62 * (1 - t)),
            int(118 + 55 * (1 - t)),
            alpha,
        )
        draw.line((0, y, width, y), fill=color)
    return Image.alpha_composite(image.convert("RGBA"), overlay)


def draw_funqa_badge(image: Image.Image) -> None:
    draw = ImageDraw.Draw(image)
    width, height = image.size

    badge_bounds = (
        int(width * 0.13),
        int(height * 0.13),
        int(width * 0.87),
        int(height * 0.87),
    )
    shadow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(badge_bounds, radius=int(width * 0.24), fill=(18, 42, 54, 72))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=int(width * 0.03)))
    image.alpha_composite(shadow)

    draw.rounded_rectangle(
        badge_bounds,
        radius=int(width * 0.24),
        fill=(246, 252, 255, 220),
        outline=(89, 159, 178, 110),
        width=max(4, width // 80),
    )

    lens_center = (int(width * 0.46), int(height * 0.46))
    lens_radius = int(width * 0.17)
    stroke = max(10, width // 38)
    draw.ellipse(
        (
            lens_center[0] - lens_radius,
            lens_center[1] - lens_radius,
            lens_center[0] + lens_radius,
            lens_center[1] + lens_radius,
        ),
        outline=(42, 154, 68, 255),
        width=stroke,
    )
    draw.line(
        (
            lens_center[0] + int(lens_radius * 0.62),
            lens_center[1] + int(lens_radius * 0.62),
            int(width * 0.73),
            int(height * 0.73),
        ),
        fill=(0, 168, 199, 255),
        width=stroke,
    )

    line_x0 = int(width * 0.32)
    line_x1 = int(width * 0.67)
    for index, y in enumerate((0.36, 0.5, 0.64)):
        draw.rounded_rectangle(
            (
                line_x0,
                int(height * y),
                line_x1 - index * int(width * 0.06),
                int(height * y) + stroke,
            ),
            radius=stroke // 2,
            fill=(55, 100, 118, 235),
        )


def build_square_assets(square_source: Path) -> None:
    raw = Image.open(square_source).convert("RGBA")
    icon_base = cover_resize(raw, (1024, 1024))
    icon_base = add_gradient_overlay(icon_base, top_alpha=54, bottom_alpha=92)
    draw_funqa_badge(icon_base)

    APP_DIR.mkdir(parents=True, exist_ok=True)
    icon_base.save(APP_DIR / "icon.png")
    icon_base.resize((180, 180), Image.Resampling.LANCZOS).save(APP_DIR / "apple-icon.png")
    favicon = icon_base.resize((64, 64), Image.Resampling.LANCZOS)
    favicon.save(APP_DIR / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])


def build_social_assets(wide_source: Path) -> None:
    raw = Image.open(wide_source).convert("RGBA")
    hero = cover_resize(raw, (1600, 900))
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    hero.save(PUBLIC_DIR / "hero-image.png")

    canvas = cover_resize(raw, (1200, 630))
    canvas = add_gradient_overlay(canvas, top_alpha=32, bottom_alpha=118)

    draw = ImageDraw.Draw(canvas)
    panel_bounds = (56, 58, 700, 574)
    draw.rounded_rectangle(
        panel_bounds,
        radius=34,
        fill=(247, 252, 255, 214),
        outline=(90, 156, 173, 84),
        width=2,
    )

    badge_bounds = (84, 92, 184, 192)
    draw.rounded_rectangle(
        badge_bounds,
        radius=28,
        fill=(255, 255, 255, 244),
        outline=(89, 159, 178, 78),
        width=2,
    )
    badge = canvas.crop((64, 72, 204, 212)).resize((140, 140), Image.Resampling.LANCZOS)
    draw_funqa_badge(badge)
    canvas.alpha_composite(badge, (64, 72))

    title_font = load_font(66, bold=True)
    subtitle_font = load_font(24, bold=False)
    pill_font = load_font(22, bold=True)

    draw.text((214, 96), "funqa", fill=(28, 42, 50, 255), font=title_font)
    draw.text(
        (86, 226),
        "All-knowledge AI search\nwith visible evidence",
        fill=(63, 93, 103, 255),
        font=subtitle_font,
        spacing=10,
    )
    draw.text(
        (86, 318),
        "Docs, media, citations,\nand graph signals in one engine.",
        fill=(72, 110, 118, 255),
        font=subtitle_font,
        spacing=8,
    )

    pill_specs = [
        ("all knowledge", (86, 394), (47, 154, 68, 255)),
        ("evidence graph", (268, 394), (0, 168, 199, 255)),
        ("rag lab", (478, 394), (71, 116, 138, 255)),
    ]
    for label, (x, y), color in pill_specs:
        text_box = draw.textbbox((0, 0), label, font=pill_font)
        pill_width = (text_box[2] - text_box[0]) + 34
        draw.rounded_rectangle((x, y, x + pill_width, y + 42), radius=21, fill=color)
        draw.text((x + 17, y + 9), label, fill=(247, 252, 255, 255), font=pill_font)

    canvas.save(APP_DIR / "opengraph-image.png")
    canvas.save(APP_DIR / "twitter-image.png")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--square", default=str(DEFAULT_SQUARE))
    parser.add_argument("--wide", default=str(DEFAULT_WIDE))
    args = parser.parse_args()

    square = Path(args.square)
    wide = Path(args.wide)
    if not square.exists():
        raise SystemExit(f"Missing square source image: {square}")
    if not wide.exists():
        raise SystemExit(f"Missing wide source image: {wide}")

    build_square_assets(square)
    build_social_assets(wide)


if __name__ == "__main__":
    main()
