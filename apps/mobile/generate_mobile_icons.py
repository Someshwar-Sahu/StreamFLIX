import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

def create_sf_icon(size):
    # High resolution master 512x512
    canvas = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    # Background squircle
    draw.rounded_rectangle([12, 12, 500, 500], radius=110, fill=(23, 27, 36, 255))

    # Text SF
    try:
        font = ImageFont.truetype("arialbd.ttf", 210)
    except IOError:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), "SF", font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    text_x = (512 - text_w) / 2
    text_y = (470 - text_h) / 2

    # Draw gold text
    draw.text((text_x, text_y), "SF", fill=(242, 169, 59, 255), font=font)

    # Gold underline accent
    draw.line([(150, 365), (362, 365)], fill=(242, 169, 59, 255), width=12)

    return canvas.resize((size, size), Image.Resampling.LANCZOS)

def create_round_sf_icon(size):
    master = create_sf_icon(512)
    mask = Image.new('L', (512, 512), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse((12, 12, 500, 500), fill=255)

    output = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    output.paste(master, (0, 0), mask=mask)
    return output.resize((size, size), Image.Resampling.LANCZOS)

res_dir = Path("android/app/src/main/res")
sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

for folder, s in sizes.items():
    target_dir = res_dir / folder
    target_dir.mkdir(parents=True, exist_ok=True)

    square_img = create_sf_icon(s)
    square_img.save(target_dir / "ic_launcher.png")

    round_img = create_round_sf_icon(s)
    round_img.save(target_dir / "ic_launcher_round.png")

print("Generated all Android mipmap app icons successfully!")
