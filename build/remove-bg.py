import os
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage

def remove_background():
    src_path = r"C:\Users\bb201\.gemini\antigravity-ide\brain\1dc32da8-3508-4bcf-b9ac-7fb1ed51836a\curva_open_bottle_transparent_1788095105787.jpg"
    dst_png = r"c:\Users\bb201\Documents\curva\assets\img-bottle.png"
    
    img = Image.open(src_path).convert("RGB")
    w, h = img.size
    
    arr = np.array(img, dtype=np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    whiteness = (r + g + b) / 3.0
    color_diff = np.sqrt((r - 255)**2 + (g - 255)**2 + (b - 255)**2)
    
    # Exterior background mask
    bg_seed = (whiteness > 225) & (color_diff < 48)
    
    # Floodfill / label connected components touching the image borders
    lbl, num = ndimage.label(bg_seed)
    
    border_labels = set()
    border_labels.update(lbl[0, :])
    border_labels.update(lbl[-1, :])
    border_labels.update(lbl[:, 0])
    border_labels.update(lbl[:, -1])
    border_labels.discard(0)
    
    ext_bg = np.isin(lbl, list(border_labels))
    fg_mask = (~ext_bg).astype(np.uint8) * 255
    
    # Cylinder bounds
    label_y = int(h * 0.5)
    row = fg_mask[label_y, :]
    fg_cols = np.where(row > 128)[0]
    left_col = fg_cols[0] - 2
    right_col = fg_cols[-1] + 2
    
    # Strictly zero out anything outside the cylinder width
    fg_mask[:, :left_col] = 0
    fg_mask[:, right_col + 1:] = 0
    
    # Find bottle bottom base curve
    center_col = (left_col + right_col) // 2
    bot_rows = np.where(fg_mask[:, center_col] > 128)[0]
    bot_y = bot_rows[-1]
    fg_mask[bot_y + 2:, :] = 0
    
    # Smooth edges
    mask_img = Image.fromarray(fg_mask, mode="L")
    mask_img = mask_img.filter(ImageFilter.GaussianBlur(radius=0.9))
    
    mask_arr = np.array(mask_img, dtype=np.float32) / 255.0
    mask_arr = np.clip((mask_arr - 0.42) / (0.62 - 0.42), 0.0, 1.0)
    
    alpha = (mask_arr * 255).astype(np.uint8)
    
    rgba_img = img.convert("RGBA")
    rgba_img.putalpha(Image.fromarray(alpha, mode="L"))
    
    bbox = rgba_img.getbbox()
    if bbox:
        pad = 8
        crop_box = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad)
        )
        rgba_img = rgba_img.crop(crop_box)
    
    rgba_img.save(dst_png, "PNG", optimize=True)
    print(f"PERFECT TRANSPARENT PNG SAVED: {dst_png}, size: {rgba_img.size}")

if __name__ == "__main__":
    remove_background()
