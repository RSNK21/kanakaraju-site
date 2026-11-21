"""
Pick the good photos for the DhanaKanaka gallery.

Run from the site folder:
    python tools/build_gallery.py "J:\\dhanakanaka.in\\photos"

What it does
  * Skips photos that are too small (shorter side under 900 px) or blurry
    (low edge detail). Those stay in your folder for later.
  * Resizes the keepers to 1600 px on the long side, saves them as WebP in
    assets/gallery/, and writes assets/gallery/gallery.json.
  * Captions start as the file name. Edit gallery.json to add an English
    "caption" and a Kannada "caption_kn" for each photo.

Needs Pillow:  pip install pillow
"""
import json
import os
import sys
from PIL import Image, ImageFilter, ImageOps, ImageStat

MIN_SIDE = 900          # shorter side in pixels
MIN_SHARPNESS = 9.0     # edge detail score; raise it to be stricter
LONG_SIDE = 1600
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".tif", ".tiff"}

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "gallery")


def sharpness(img):
    g = ImageOps.grayscale(img)
    g.thumbnail((800, 800))
    edges = g.filter(ImageFilter.FIND_EDGES)
    return ImageStat.Stat(edges).stddev[0]


def main(src):
    os.makedirs(OUT, exist_ok=True)
    manifest_path = os.path.join(OUT, "gallery.json")
    old = {}
    if os.path.exists(manifest_path):
        try:
            old = {e["file"]: e for e in json.load(open(manifest_path, encoding="utf-8"))}
        except Exception:
            old = {}
    kept, skipped = [], []
    for name in sorted(os.listdir(src)):
        path = os.path.join(src, name)
        if os.path.splitext(name)[1].lower() not in EXTS or not os.path.isfile(path):
            continue
        try:
            img = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
        except Exception as e:
            skipped.append((name, "cannot open: %s" % e))
            continue
        w, h = img.size
        s = sharpness(img)
        if min(w, h) < MIN_SIDE:
            skipped.append((name, "too small %dx%d" % (w, h)))
            continue
        if s < MIN_SHARPNESS:
            skipped.append((name, "looks blurry (score %.1f)" % s))
            continue
        img.thumbnail((LONG_SIDE, LONG_SIDE), Image.LANCZOS)
        out_name = os.path.splitext(name)[0].replace(" ", "-").lower() + ".webp"
        img.save(os.path.join(OUT, out_name), "WEBP", quality=84)
        prev = old.get(out_name, {})
        kept.append({
            "file": out_name,
            "caption": prev.get("caption", ""),
            "caption_kn": prev.get("caption_kn", ""),
        })
        print("kept    %-40s %dx%d  sharp %.1f" % (name, w, h, s))
    for n, why in skipped:
        print("skipped %-40s %s" % (n, why))
    json.dump(kept, open(manifest_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("\n%d photos in the gallery, %d kept aside. Edit captions in %s" % (len(kept), len(skipped), manifest_path))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
