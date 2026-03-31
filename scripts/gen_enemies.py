"""Generate enemy sprites for Tomato Quest. 200×200 each."""

from PIL import Image, ImageDraw, ImageFont
import math, os, random

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'enemies')
os.makedirs(OUT, exist_ok=True)

BG     = (13, 17, 23)
RED    = (220, 50, 40)
RED_HI = (255, 90, 70)
AMBER  = (255, 179, 71)
GREEN  = (0, 210, 50)
PURPLE = (139, 92, 246)
BLUE   = (58, 130, 246)
WHITE  = (220, 230, 240)
DIM    = (90, 100, 110)
DARK   = (22, 27, 34)

W = H = 200

def try_font(size):
    for path in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf",
    ]:
        if os.path.exists(path):
            try: return ImageFont.truetype(path, size)
            except: pass
    return ImageFont.load_default()

def new_img():
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)

def add_glow(img, cx, cy, r, color, intensity=60):
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(5):
        ri = r + (4 - i) * 8
        alpha = intensity - i * 10
        if alpha > 0:
            gd.ellipse([cx - ri, cy - ri, cx + ri, cy + ri],
                       fill=(*color, alpha))
    img.alpha_composite(glow)

def save(img, name):
    # Composite on dark BG for preview, save RGBA
    bg = Image.new('RGBA', (W, H), (*BG, 255))
    bg.alpha_composite(img)
    path = os.path.join(OUT, f'{name}.png')
    bg.convert('RGB').save(path)
    print(f'  ✓ {name}.png')


# ── Procrastination Blob ──────────────────────────────────────────────────
def make_blob():
    img, draw = new_img()
    cx, cy = W // 2, H // 2 + 10
    # Blobby body — distorted ellipse + bumps
    body_color = (120, 180, 80)
    shadow_color = (60, 110, 40)

    # Shadow
    draw.ellipse([cx - 62, cy - 38 + 12, cx + 62, cy + 48 + 12],
                 fill=(*shadow_color, 100))

    # Main blob body
    pts = []
    n_pts = 16
    for i in range(n_pts):
        angle = 2 * math.pi * i / n_pts
        base_r = 58
        wobble = 12 * math.sin(i * 2.3 + 0.7) + 8 * math.cos(i * 3.7)
        r = base_r + wobble
        pts.append((cx + r * math.cos(angle), cy + int(r * 0.65) * math.sin(angle)))
    draw.polygon([(int(x), int(y)) for x, y in pts], fill=(*body_color, 240))

    # Belly highlight
    draw.ellipse([cx - 30, cy - 15, cx + 30, cy + 25], fill=(160, 220, 110, 80))

    # Eyes (two uneven circles)
    draw.ellipse([cx - 22, cy - 22, cx - 6, cy - 6], fill=WHITE)
    draw.ellipse([cx + 6, cy - 26, cx + 24, cy - 8], fill=WHITE)
    draw.ellipse([cx - 18, cy - 20, cx - 10, cy - 12], fill=(30, 30, 50))
    draw.ellipse([cx + 9, cy - 24, cx + 20, cy - 13], fill=(30, 30, 50))

    # Lazy grin
    draw.arc([cx - 20, cy - 2, cx + 20, cy + 16], start=10, end=170,
             fill=(40, 60, 30), width=3)

    # Ooze drops
    for ox, oy_base in [(-40, 30), (35, 28), (-10, 38)]:
        oy = cy + oy_base
        draw.ellipse([cx + ox - 4, oy, cx + ox + 4, oy + 10],
                     fill=(*body_color, 180))

    # Name tag
    f = try_font(11)
    label = "Procrastination Blob"
    b = draw.textbbox((0, 0), label, font=f)
    draw.text(((W - (b[2]-b[0])) // 2, H - 22), label, font=f, fill=(160, 220, 110))

    save(img, 'procrastination_blob')


# ── Social Media Hydra ────────────────────────────────────────────────────
def make_hydra():
    img, draw = new_img()
    cx, cy = W // 2, H // 2 + 10
    neck_color = (50, 80, 180)
    head_color = (70, 110, 220)
    shadow = (30, 50, 120)

    # Body base
    draw.ellipse([cx - 35, cy + 10, cx + 35, cy + 55], fill=(*neck_color, 220))

    # Three heads on necks
    heads = [
        (cx - 45, cy - 45, -25),  # left head
        (cx,      cy - 60,   0),  # centre head
        (cx + 45, cy - 45,  25),  # right head
    ]
    neck_pts = [
        [(cx - 20, cy + 15), (cx - 50, cy - 25), (cx - 35, cy - 25), (cx - 5, cy + 15)],
        [(cx - 12, cy + 10), (cx - 12, cy - 40), (cx + 12, cy - 40), (cx + 12, cy + 10)],
        [(cx + 5, cy + 15),  (cx + 35, cy - 25), (cx + 50, cy - 25), (cx + 20, cy + 15)],
    ]
    for pts in neck_pts:
        draw.polygon(pts, fill=(*neck_color, 200))

    for hx, hy, _ in heads:
        hr = 24
        draw.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=(*head_color, 230))
        # eyes
        draw.ellipse([hx - 10, hy - 8, hx - 2, hy + 2], fill=WHITE)
        draw.ellipse([hx + 2, hy - 8, hx + 10, hy + 2], fill=WHITE)
        draw.ellipse([hx - 8, hy - 6, hx - 4, hy - 2], fill=(20, 20, 40))
        draw.ellipse([hx + 4, hy - 6, hx + 8, hy - 2], fill=(20, 20, 40))
        # fangs
        draw.polygon([(hx - 6, hy + 4), (hx - 2, hy + 12), (hx + 2, hy + 4)],
                     fill=WHITE)
        draw.polygon([(hx + 2, hy + 4), (hx + 6, hy + 12), (hx + 10, hy + 4)],
                     fill=WHITE)

    # Social media icons (notification dots)
    for i, (ox, oy, col) in enumerate([(-55, -20, (255, 60, 60)),
                                         (55, -35, (30, 150, 255)),
                                         (-50, 5, (255, 80, 200))]):
        draw.ellipse([cx+ox-7, cy+oy-7, cx+ox+7, cy+oy+7], fill=col)
        f_s = try_font(8)
        draw.text((cx + ox - 3, cy + oy - 5), str(i * 3 + 1), font=f_s, fill=WHITE)

    add_glow(img, cx, cy - 20, 70, BLUE, 40)

    f = try_font(11)
    label = "Social Media Hydra"
    b = draw.textbbox((0, 0), label, font=f)
    draw.text(((W - (b[2]-b[0])) // 2, H - 22), label, font=f, fill=(100, 140, 255))
    save(img, 'social_media_hydra')


# ── Meeting Minotaur ───────────────────────────────────────────────────────
def make_minotaur():
    img, draw = new_img()
    cx, cy = W // 2, H // 2

    body = (90, 70, 55)
    suit = (40, 44, 52)
    horn = (200, 170, 90)

    # Body (suit)
    draw.rounded_rectangle([cx - 32, cy - 10, cx + 32, cy + 58],
                            radius=10, fill=(*suit, 230))

    # Tie
    draw.polygon([(cx - 4, cy - 8), (cx + 4, cy - 8),
                  (cx + 6, cy + 20), (cx, cy + 28), (cx - 6, cy + 20)],
                 fill=(180, 30, 30))

    # Head (bull)
    hr = 36
    draw.ellipse([cx - hr, cy - hr - 28, cx + hr, cy + 8], fill=(*body, 230))

    # Horns
    draw.polygon([(cx - hr + 8, cy - hr - 18),
                  (cx - hr - 18, cy - hr - 55),
                  (cx - hr + 18, cy - hr - 45)], fill=horn)
    draw.polygon([(cx + hr - 8, cy - hr - 18),
                  (cx + hr + 18, cy - hr - 55),
                  (cx + hr - 18, cy - hr - 45)], fill=horn)

    # Ears
    draw.ellipse([cx - hr - 14, cy - hr - 10, cx - hr + 4, cy - hr + 10],
                 fill=(*body, 220))
    draw.ellipse([cx + hr - 4, cy - hr - 10, cx + hr + 14, cy - hr + 10],
                 fill=(*body, 220))

    # Eyes (office drone stare)
    for ex in [cx - 14, cx + 6]:
        draw.ellipse([ex, cy - hr + 8, ex + 16, cy - hr + 24], fill=WHITE)
        draw.ellipse([ex + 3, cy - hr + 11, ex + 13, cy - hr + 21], fill=(20, 20, 60))

    # Snout + nostrils
    draw.ellipse([cx - 14, cy - hr + 26, cx + 14, cy - hr + 44],
                 fill=(110, 85, 70))
    draw.ellipse([cx - 8, cy - hr + 30, cx - 2, cy - hr + 38], fill=(60, 40, 30))
    draw.ellipse([cx + 2, cy - hr + 30, cx + 8, cy - hr + 38], fill=(60, 40, 30))

    # Clipboard
    draw.rounded_rectangle([cx + 28, cy - 5, cx + 52, cy + 40],
                            radius=3, fill=(220, 210, 190))
    for ly in range(cy + 5, cy + 38, 8):
        draw.line([(cx + 32, ly), (cx + 48, ly)], fill=(150, 140, 130), width=1)
    draw.rectangle([cx + 36, cy - 8, cx + 44, cy - 2], fill=(160, 100, 80))

    add_glow(img, cx, cy - 10, 65, (100, 80, 200), 30)

    f = try_font(11)
    label = "Meeting Minotaur"
    b = draw.textbbox((0, 0), label, font=f)
    draw.text(((W - (b[2]-b[0])) // 2, H - 22), label, font=f, fill=(180, 160, 100))
    save(img, 'meeting_minotaur')


# ── Deadline Demon (floor boss) ───────────────────────────────────────────
def make_deadline_demon():
    img, draw = new_img()
    cx, cy = W // 2, H // 2

    body  = (80, 20, 20)
    skin  = (150, 30, 30)
    flame = (255, 100, 0)

    add_glow(img, cx, cy, 75, RED, 70)

    # Wings
    for side in [-1, 1]:
        pts = [
            (cx, cy - 10),
            (cx + side * 90, cy - 50),
            (cx + side * 80, cy + 10),
            (cx + side * 50, cy + 40),
            (cx + side * 20, cy + 20),
        ]
        draw.polygon(pts, fill=(60, 10, 10, 200))
        # wing veins
        for i in range(1, 4):
            t = i / 4
            wx = cx + int(side * (20 + t * 70))
            wy = cy - 10 + int(t * 50)
            draw.line([(cx + side * 15, cy + 15), (wx, wy)],
                      fill=(100, 20, 20), width=1)

    # Body
    draw.ellipse([cx - 30, cy - 15, cx + 30, cy + 50], fill=(*skin, 230))

    # Head
    draw.ellipse([cx - 32, cy - 68, cx + 32, cy - 4], fill=(*skin, 240))

    # Horns (stylised)
    draw.polygon([(cx - 22, cy - 60),
                  (cx - 38, cy - 90),
                  (cx - 10, cy - 72)], fill=(40, 10, 10))
    draw.polygon([(cx + 22, cy - 60),
                  (cx + 38, cy - 90),
                  (cx + 10, cy - 72)], fill=(40, 10, 10))

    # Glowing eyes
    for ex in [cx - 14, cx + 6]:
        draw.ellipse([ex, cy - 52, ex + 16, cy - 36], fill=(255, 50, 0))
        draw.ellipse([ex + 4, cy - 48, ex + 12, cy - 40], fill=(255, 200, 0))

    # Fanged mouth
    draw.arc([cx - 16, cy - 34, cx + 16, cy - 18],
             start=0, end=180, fill=(30, 0, 0), width=2)
    for i in range(3):
        fx = cx - 10 + i * 10
        draw.polygon([(fx, cy - 30), (fx + 4, cy - 22), (fx + 8, cy - 30)],
                     fill=WHITE)

    # Flame tail
    tail_pts = [(cx - 8, cy + 50), (cx + 8, cy + 50),
                (cx + 4, cy + 75), (cx, cy + 85), (cx - 4, cy + 75)]
    draw.polygon(tail_pts, fill=(*flame, 220))
    inner_pts = [(cx - 4, cy + 52), (cx + 4, cy + 52),
                 (cx + 2, cy + 72), (cx, cy + 78), (cx - 2, cy + 72)]
    draw.polygon(inner_pts, fill=(255, 220, 0, 200))

    # Clock countdown (deadline motif) on chest
    draw.ellipse([cx - 12, cy + 5, cx + 12, cy + 29], fill=(30, 10, 10),
                 outline=(200, 50, 50), width=2)
    draw.line([(cx, cy + 17), (cx, cy + 10)], fill=WHITE, width=2)
    draw.line([(cx, cy + 17), (cx + 7, cy + 20)], fill=RED_HI, width=2)

    f = try_font(11)
    label = "Deadline Demon"
    b = draw.textbbox((0, 0), label, font=f)
    draw.text(((W - (b[2]-b[0])) // 2, H - 22), label, font=f, fill=RED_HI)
    save(img, 'deadline_demon')


# ── Procrastination Demon (timer boss) ───────────────────────────────────
def make_proc_demon():
    img, draw = new_img()
    cx, cy = W // 2, H // 2

    # Even more ominous — dark purple with glowing hourglass motif
    body = (60, 20, 80)
    skin = (100, 30, 130)
    glow_c = (180, 60, 255)

    add_glow(img, cx, cy, 80, (120, 0, 200), 90)

    # Tattered robe/cloak
    for i in range(5):
        ox = (i - 2) * 15
        draw.polygon([(cx + ox - 10, cy + 10),
                      (cx + ox + 10, cy + 10),
                      (cx + ox + 18, cy + 70),
                      (cx + ox, cy + 85),
                      (cx + ox - 18, cy + 70)],
                     fill=(40, 10, 60, 180))

    # Body
    draw.ellipse([cx - 28, cy - 15, cx + 28, cy + 55], fill=(*skin, 230))

    # Head (larger, more menacing)
    draw.ellipse([cx - 36, cy - 75, cx + 36, cy - 5], fill=(*skin, 240))

    # Crown of hourglasses
    for i, hx in enumerate([cx - 28, cx, cx + 28]):
        hy = cy - 80 - (10 if i == 1 else 0)
        draw.rectangle([hx - 5, hy - 12, hx + 5, hy + 12], fill=(200, 180, 80))
        draw.polygon([(hx - 5, hy - 12), (hx + 5, hy - 12), (hx, hy)], fill=AMBER)
        draw.polygon([(hx - 5, hy + 12), (hx + 5, hy + 12), (hx, hy)], fill=AMBER)

    # Swirling vortex eyes
    for ex, ey in [(cx - 16, cy - 50), (cx + 4, cy - 50)]:
        draw.ellipse([ex, ey, ex + 18, ey + 18], fill=(200, 50, 255))
        draw.arc([ex + 2, ey + 2, ex + 14, ey + 14], start=0, end=270,
                 fill=WHITE, width=2)
        draw.ellipse([ex + 5, ey + 5, ex + 11, ey + 11], fill=(255, 200, 255))

    # Mouth (sneer revealing timer)
    draw.arc([cx - 18, cy - 32, cx + 18, cy - 14],
             start=10, end=170, fill=(20, 0, 30), width=3)
    # teeth countdown
    for i in range(4):
        tx = cx - 12 + i * 8
        draw.rectangle([tx, cy - 30, tx + 5, cy - 22], fill=WHITE)

    # Floating clock (hourglass) in hand
    hx, hy = cx + 46, cy + 15
    draw.rectangle([hx - 8, hy - 14, hx + 8, hy + 14], fill=(180, 160, 70),
                   outline=AMBER, width=2)
    draw.polygon([(hx - 7, hy - 13), (hx + 7, hy - 13), (hx, hy)], fill=(255, 200, 80))
    draw.polygon([(hx - 7, hy + 13), (hx + 7, hy + 13), (hx, hy)], fill=(255, 220, 100, 100))

    # Particle effects
    random.seed(42)
    for _ in range(12):
        px = cx + random.randint(-70, 70)
        py = cy + random.randint(-70, 70)
        pr = random.randint(1, 4)
        alpha = random.randint(80, 200)
        draw.ellipse([px - pr, py - pr, px + pr, py + pr],
                     fill=(180, 60, 255, alpha))

    f = try_font(10)
    label = "Procrastination Demon"
    b = draw.textbbox((0, 0), label, font=f)
    draw.text(((W - (b[2]-b[0])) // 2, H - 22), label, font=f, fill=(200, 100, 255))
    save(img, 'procrastination_demon')


# ── Burnout Specter (elite) ────────────────────────────────────────────────
def make_burnout():
    img, draw = new_img()
    cx, cy = W // 2, H // 2

    ghost_color = (60, 100, 130)
    glow_c = (80, 160, 200)

    add_glow(img, cx, cy, 70, glow_c, 50)

    # Ghostly tattered body
    pts = [(cx, cy - 65),
           (cx + 38, cy - 30),
           (cx + 42, cy + 10),
           (cx + 30, cy + 40),
           (cx + 10, cy + 58),
           (cx, cy + 65),
           (cx - 10, cy + 58),
           (cx - 30, cy + 40),
           (cx - 42, cy + 10),
           (cx - 38, cy - 30)]
    draw.polygon(pts, fill=(*ghost_color, 180))

    # Wispy bottom (tattered hem)
    for i in range(5):
        wx = cx - 35 + i * 17
        draw.polygon([(wx, cy + 50), (wx + 8, cy + 50),
                      (wx + 5, cy + 72), (wx + 4, cy + 80), (wx + 3, cy + 72)],
                     fill=(*ghost_color, 120))

    # Hollow eyes (exhausted)
    for ex in [cx - 16, cx + 4]:
        draw.ellipse([ex, cy - 38, ex + 20, cy - 18], fill=(10, 15, 20))
        # dim glow in eyes
        draw.ellipse([ex + 4, cy - 34, ex + 14, cy - 24], fill=(*glow_c, 80))

    # Burning candle on head (burnout metaphor)
    candle_x, candle_y = cx, cy - 70
    draw.rectangle([candle_x - 5, candle_y - 8, candle_x + 5, candle_y + 8],
                   fill=(220, 210, 200))
    # flame
    draw.polygon([(candle_x, candle_y - 18),
                  (candle_x - 5, candle_y - 10),
                  (candle_x + 5, candle_y - 10)],
                 fill=(255, 150, 0))
    draw.polygon([(candle_x, candle_y - 22),
                  (candle_x - 2, candle_y - 14),
                  (candle_x + 2, candle_y - 14)],
                 fill=(255, 220, 100))

    # Drained expression
    draw.arc([cx - 14, cy - 10, cx + 14, cy + 6],
             start=190, end=350, fill=(40, 70, 100), width=2)

    # Drain particles
    random.seed(7)
    for _ in range(8):
        px = cx + random.randint(-50, 50)
        py = cy + random.randint(-40, 40)
        draw.ellipse([px - 2, py - 2, px + 2, py + 2],
                     fill=(*glow_c, random.randint(60, 160)))

    f = try_font(11)
    label = "Burnout Specter"
    b = draw.textbbox((0, 0), label, font=f)
    draw.text(((W - (b[2]-b[0])) // 2, H - 22), label, font=f, fill=(100, 180, 220))
    save(img, 'burnout_boss')


if __name__ == '__main__':
    print('Generating enemy sprites...')
    make_blob()
    make_hydra()
    make_minotaur()
    make_deadline_demon()
    make_proc_demon()
    make_burnout()
    print('Done!')
