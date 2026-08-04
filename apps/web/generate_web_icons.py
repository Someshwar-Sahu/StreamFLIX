from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

def create_sf_icon(size):
    canvas = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    draw.rounded_rectangle([12, 12, 500, 500], radius=110, fill=(23, 27, 36, 255))

    try:
        font = ImageFont.truetype("arialbd.ttf", 210)
    except IOError:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), "SF", font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    text_x = (512 - text_w) / 2
    text_y = (470 - text_h) / 2

    draw.text((text_x, text_y), "SF", fill=(242, 169, 59, 255), font=font)
    draw.line([(150, 365), (362, 365)], fill=(242, 169, 59, 255), width=12)

    return canvas.resize((size, size), Image.Resampling.LANCZOS)

public_dir = Path("public")
public_dir.mkdir(parents=True, exist_ok=True)

# Generate favicon.png and apple-touch-icon.png
icon_180 = create_sf_icon(180)
icon_180.save(public_dir / "apple-touch-icon.png")

icon_64 = create_sf_icon(64)
icon_64.save(public_dir / "favicon.png")

print("Generated web favicon.png and apple-touch-icon.png successfully!")
