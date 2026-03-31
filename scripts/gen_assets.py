"""
Generate Tomato Quest app assets using Pillow.
Produces: icon.png, splash.png, adaptive-icon.png, favicon.png
"""

from PIL import Image, ImageDraw, ImageFont
import math, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')
os.makedirs(OUT, exist_ok=True)

# ── Palette ────────────────────────────────────────────────────────────────
BG        = (13,  17,  23)    # #0d1117
BG2       = (22,  27,  34)    # #161b22
TOMATO    = (220,  60,  50)   # deep tomato red
TOMATO_HI = (255,  90,  70)   # highlight
TOMATO_SH = (140,  30,  20)   # shadow
LEAF      = ( 40, 160,  60)   # green leaf
LEAF_HI   = ( 80, 200,  90)
STEM      = ( 60, 120,  40)
GREEN     = (  0, 210,  50)   # UI green
AMBER     = (255, 179,  71)   # #ffb347
WHITE     = (230, 237, 243)
DIM       = (100, 110, 120)
BORDER    = ( 48,  54,  61)   # #30363d
RED_GLOW  = (180,  30,  20)

# ── Helpers ────────────────────────────────────────────────────────────────

def aa_circle(draw, cx, cy, r, fill, steps=4):
    """Draw a filled circle with a hint of anti-aliasing via overdraw."""
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)

def gradient_circle(img, cx, cy, r, color_center, color_edge):
    """Radial gradient circle drawn pixel-by-pixel (used for glow effects)."""
    px = img.load()
    w, h = img.size
    r2 = r * r
    cr, cg, cb = color_center
    er, eg, eb = color_edge
    for y in range(max(0, cy - r), min(h, cy + r + 1)):
        for x in range(max(0, cx - r), min(w, cx + r + 1)):
            dx, dy = x - cx, y - cy
            d2 = dx * dx + dy * dy
            if d2 <= r2:
                t = math.sqrt(d2) / r          # 0 = center, 1 = edge
                t = min(1.0, t)
                nr = int(cr + (er - cr) * t)
                ng = int(cg + (eg - cg) * t)
                nb = int(cb + (eb - cb) * t)
                # blend over existing pixel
                existing = px[x, y]
                if len(existing) == 4:
                    alpha = 1.0
                    px[x, y] = (nr, ng, nb, 255)
                else:
                    px[x, y] = (nr, ng, nb)

def draw_tomato(draw, img, cx, cy, r):
    """
    Draw a stylised tomato:
      - main body (red sphere with highlight)
      - stem + leaves on top
    """
    # ── shadow / depth ──────────────────────────────────────────
    shadow_r = int(r * 0.96)
    draw.ellipse([cx - shadow_r, cy - shadow_r + int(r * 0.08),
                  cx + shadow_r, cy + shadow_r + int(r * 0.08)],
                 fill=TOMATO_SH)

    # ── main body ───────────────────────────────────────────────
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=TOMATO)

    # ── specular highlight (top-left bright spot) ───────────────
    hl_r = int(r * 0.28)
    hl_cx = cx - int(r * 0.28)
    hl_cy = cy - int(r * 0.28)
    # soft white oval
    draw.ellipse([hl_cx - hl_r, hl_cy - int(hl_r * 0.7),
                  hl_cx + hl_r, hl_cy + int(hl_r * 0.7)],
                 fill=(255, 200, 190))

    # ── bottom slight shadow crescent ───────────────────────────
    crescent_r = int(r * 0.82)
    draw.ellipse([cx - crescent_r, cy + int(r * 0.18),
                  cx + crescent_r, cy + r + int(r * 0.12)],
                 fill=TOMATO_SH)
    # re-draw center to restore tomato colour
    inner_r = int(r * 0.72)
    draw.ellipse([cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r],
                 fill=TOMATO)

    # ── stem ─────────────────────────────────────────────────────
    stem_w   = max(2, int(r * 0.08))
    stem_h   = int(r * 0.30)
    stem_x   = cx - stem_w // 2
    stem_top = cy - r - stem_h + int(r * 0.08)
    draw.rectangle([stem_x, stem_top, stem_x + stem_w, cy - r + int(r * 0.08)],
                   fill=STEM)

    # ── leaves (3 pointed ovals fanning out) ─────────────────────
    leaf_base_y = cy - r + int(r * 0.06)
    leaf_w = int(r * 0.40)
    leaf_h = int(r * 0.20)

    # centre leaf (up)
    draw.ellipse([cx - leaf_w // 2, leaf_base_y - leaf_h * 2,
                  cx + leaf_w // 2, leaf_base_y], fill=LEAF)
    # left leaf
    lx = cx - int(r * 0.28)
    draw.ellipse([lx - leaf_w // 2, leaf_base_y - int(leaf_h * 1.4),
                  lx + leaf_w // 2, leaf_base_y + int(leaf_h * 0.2)], fill=LEAF)
    # right leaf
    rx = cx + int(r * 0.28)
    draw.ellipse([rx - leaf_w // 2, leaf_base_y - int(leaf_h * 1.4),
                  rx + leaf_w // 2, leaf_base_y + int(leaf_h * 0.2)], fill=LEAF)

    # leaf highlights
    lh_r = max(2, int(leaf_h * 0.3))
    draw.ellipse([cx - lh_r, leaf_base_y - leaf_h * 2,
                  cx + lh_r, leaf_base_y - leaf_h * 2 + lh_r * 2],
                 fill=LEAF_HI)


def add_text_shadow(draw, pos, text, font, shadow_color, offset=(3, 3)):
    sx, sy = pos[0] + offset[0], pos[1] + offset[1]
    draw.text((sx, sy), text, font=font, fill=shadow_color)


def try_font(size):
    """Try to load a bold font, fall back to default."""
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf",
        "/usr/share/fonts/truetype/ubuntu/UbuntuMono-B.ttf",
        "/usr/share/fonts/truetype/freefont/FreeMono.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


# ══════════════════════════════════════════════════════════════════════════════
# 1.  APP ICON  1024 × 1024
# ══════════════════════════════════════════════════════════════════════════════

def make_icon(size=1024):
    img  = Image.new('RGB', (size, size), BG)
    draw = ImageDraw.Draw(img)

    # Subtle grid pattern in background
    for i in range(0, size, 48):
        draw.line([(0, i), (size, i)], fill=(18, 24, 32), width=1)
        draw.line([(i, 0), (i, size)], fill=(18, 24, 32), width=1)

    # Rounded-rect card background
    pad = int(size * 0.06)
    r_corner = int(size * 0.14)
    draw.rounded_rectangle([pad, pad, size - pad, size - pad],
                            radius=r_corner, fill=BG2,
                            outline=BORDER, width=max(2, size // 120))

    # Glowing halo behind tomato
    halo_cx, halo_cy = size // 2, int(size * 0.44)
    for i in range(5):
        alpha_r = int(size * 0.36) - i * int(size * 0.025)
        opacity = 40 - i * 7
        if opacity > 0:
            overlay = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            od = ImageDraw.Draw(overlay)
            od.ellipse([halo_cx - alpha_r, halo_cy - alpha_r,
                        halo_cx + alpha_r, halo_cy + alpha_r],
                       fill=(*TOMATO, opacity))
            img.paste(Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB'))
            draw = ImageDraw.Draw(img)

    # Tomato
    tomato_r = int(size * 0.295)
    draw_tomato(draw, img, halo_cx, halo_cy, tomato_r)

    # Title text "TOMATO QUEST"
    font_title = try_font(int(size * 0.082))
    font_sub   = try_font(int(size * 0.038))

    title = "TOMATO QUEST"
    bbox  = draw.textbbox((0, 0), title, font=font_title)
    tw    = bbox[2] - bbox[0]
    tx    = (size - tw) // 2
    ty    = int(size * 0.745)

    add_text_shadow(draw, (tx, ty), title, font_title, (80, 10, 5), (int(size*0.005), int(size*0.005)))
    draw.text((tx, ty), title, font=font_title, fill=TOMATO_HI)

    # Subtitle
    sub  = "DUNGEON CRAWLER"
    bbox2 = draw.textbbox((0, 0), sub, font=font_sub)
    sw    = bbox2[2] - bbox2[0]
    sx2   = (size - sw) // 2
    draw.text((sx2, ty + int(size * 0.095)), sub, font=font_sub, fill=DIM)

    # Green accent bar at bottom
    bar_h = max(4, size // 80)
    bar_y = size - pad - bar_h - int(size * 0.015)
    bar_x0 = int(size * 0.25)
    bar_x1 = int(size * 0.75)
    draw.rectangle([bar_x0, bar_y, bar_x1, bar_y + bar_h], fill=GREEN)

    path = os.path.join(OUT, 'icon.png')
    img.save(path, 'PNG')
    print(f'  ✓ icon.png  ({size}×{size})')
    return img


# ══════════════════════════════════════════════════════════════════════════════
# 2.  ADAPTIVE ICON  1024 × 1024  (Android — foreground only, no bg rounding)
# ══════════════════════════════════════════════════════════════════════════════

def make_adaptive_icon(size=1024):
    img  = Image.new('RGB', (size, size), BG)
    draw = ImageDraw.Draw(img)

    # Glow
    halo_cx, halo_cy = size // 2, int(size * 0.47)
    for i in range(4):
        r = int(size * 0.32) - i * int(size * 0.03)
        overlay = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.ellipse([halo_cx - r, halo_cy - r, halo_cx + r, halo_cy + r],
                   fill=(*TOMATO, 35 - i * 8))
        img.paste(Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB'))
        draw = ImageDraw.Draw(img)

    tomato_r = int(size * 0.32)
    draw_tomato(draw, img, halo_cx, halo_cy, tomato_r)

    font_title = try_font(int(size * 0.075))
    title = "TOMATO QUEST"
    bbox  = draw.textbbox((0, 0), title, font=font_title)
    tw = bbox[2] - bbox[0]
    tx = (size - tw) // 2
    ty = int(size * 0.78)
    add_text_shadow(draw, (tx, ty), title, font_title, (80, 10, 5))
    draw.text((tx, ty), title, font=font_title, fill=TOMATO_HI)

    path = os.path.join(OUT, 'adaptive-icon.png')
    img.save(path, 'PNG')
    print(f'  ✓ adaptive-icon.png  ({size}×{size})')


# ══════════════════════════════════════════════════════════════════════════════
# 3.  SPLASH  1284 × 2778  (iPhone 14 Pro Max — standard Expo splash size)
# ══════════════════════════════════════════════════════════════════════════════

def make_splash(w=1284, h=2778):
    img  = Image.new('RGB', (w, h), BG)
    draw = ImageDraw.Draw(img)

    # Subtle dot-grid background
    dot_gap = 60
    for gy in range(0, h, dot_gap):
        for gx in range(0, w, dot_gap):
            draw.ellipse([gx - 1, gy - 1, gx + 1, gy + 1], fill=(20, 28, 38))

    # Top decorative lines (terminal scanline feel)
    for i in range(12):
        y = int(h * 0.05) + i * int(h * 0.004)
        alpha = max(0, 60 - i * 5)
        draw.line([(0, y), (w, y)], fill=(30, 40, 50), width=1)

    # Big tomato in upper-centre area
    cx, cy = w // 2, int(h * 0.35)
    tomato_r = int(w * 0.30)

    # Outer glow rings
    for i in range(6):
        gr = tomato_r + int(w * 0.06) - i * int(w * 0.009)
        overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.ellipse([cx - gr, cy - gr, cx + gr, cy + gr],
                   fill=(*RED_GLOW, max(0, 22 - i * 3)))
        img.paste(Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB'))
        draw = ImageDraw.Draw(img)

    draw_tomato(draw, img, cx, cy, tomato_r)

    # Main title
    font_h1  = try_font(int(w * 0.115))
    font_h2  = try_font(int(w * 0.052))
    font_tag = try_font(int(w * 0.036))
    font_sm  = try_font(int(w * 0.028))

    title = "TOMATO"
    quest = "QUEST"
    b1 = draw.textbbox((0, 0), title, font=font_h1)
    b2 = draw.textbbox((0, 0), quest, font=font_h1)
    ty1 = cy + tomato_r + int(h * 0.038)
    tx1 = (w - (b1[2] - b1[0])) // 2
    tx2 = (w - (b2[2] - b2[0])) // 2
    ty2 = ty1 + int(h * 0.075)

    add_text_shadow(draw, (tx1, ty1), title, font_h1, (70, 10, 5), (4, 4))
    draw.text((tx1, ty1), title, font=font_h1, fill=TOMATO_HI)
    add_text_shadow(draw, (tx2, ty2), quest, font_h1, (70, 10, 5), (4, 4))
    draw.text((tx2, ty2), quest, font=font_h1, fill=TOMATO_HI)

    # Tagline
    tag = "A POMODORO DUNGEON CRAWLER"
    bt  = draw.textbbox((0, 0), tag, font=font_tag)
    draw.text(((w - (bt[2] - bt[0])) // 2, ty2 + int(h * 0.074)),
              tag, font=font_tag, fill=DIM)

    # Divider
    div_y = ty2 + int(h * 0.115)
    draw.line([(int(w * 0.2), div_y), (int(w * 0.8), div_y)],
              fill=BORDER, width=2)

    # Feature bullets
    features = [
        ("⚔", "Build a deck, fight enemies"),
        ("🍅", "Beat the boss before time runs out"),
        ("☕", "Rest & upgrade between floors"),
        ("💀", "Face the Procrastination Demon"),
    ]
    fy = div_y + int(h * 0.028)
    for icon_ch, text in features:
        line = f"{icon_ch}  {text}"
        fb = draw.textbbox((0, 0), line, font=font_sm)
        fx = (w - (fb[2] - fb[0])) // 2
        draw.text((fx, fy), line, font=font_sm, fill=(160, 180, 160))
        fy += int(h * 0.033)

    # Bottom green accent bar
    bar_h = max(6, w // 60)
    bar_y = h - int(h * 0.04)
    draw.rectangle([int(w * 0.1), bar_y, int(w * 0.9), bar_y + bar_h], fill=GREEN)

    # Version
    ver = "v1.0"
    vb  = draw.textbbox((0, 0), ver, font=font_sm)
    draw.text(((w - (vb[2] - vb[0])) // 2, h - int(h * 0.025)),
              ver, font=font_sm, fill=(40, 50, 60))

    path = os.path.join(OUT, 'splash.png')
    img.save(path, 'PNG')
    print(f'  ✓ splash.png  ({w}×{h})')


# ══════════════════════════════════════════════════════════════════════════════
# 4.  FAVICON  64 × 64
# ══════════════════════════════════════════════════════════════════════════════

def make_favicon(size=64):
    img  = Image.new('RGB', (size, size), BG)
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([2, 2, size - 3, size - 3],
                            radius=12, fill=BG2, outline=BORDER, width=1)
    draw_tomato(draw, img, size // 2, int(size * 0.48), int(size * 0.32))
    path = os.path.join(OUT, 'favicon.png')
    img.save(path, 'PNG')
    print(f'  ✓ favicon.png  ({size}×{size})')


# ══════════════════════════════════════════════════════════════════════════════
# Run
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    print('Generating Tomato Quest assets...')
    make_icon()
    make_adaptive_icon()
    make_splash()
    make_favicon()
    print('Done!')
