"""Generate relic icon sprites. 80×80 each."""

from PIL import Image, ImageDraw, ImageFont
import math, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'relics')
os.makedirs(OUT, exist_ok=True)

BG     = (13, 17, 23)
AMBER  = (255, 179, 71)
GREEN  = (0, 210, 50)
BLUE   = (58, 130, 246)
RED    = (220, 50, 40)
PURPLE = (139, 92, 246)
WHITE  = (220, 230, 240)
TOMATO = (220, 60, 50)
DIM    = (90, 100, 110)
GOLD   = (255, 200, 60)

S = 80

def try_font(size):
    for path in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf",
    ]:
        if os.path.exists(path):
            try: return ImageFont.truetype(path, size)
            except: pass
    return ImageFont.load_default()

def make_relic(relic_id, draw_fn, border_color):
    img  = Image.new('RGB', (S, S), BG)
    draw = ImageDraw.Draw(img)
    # Octagonal border (relic frame)
    o = 8
    m = 4
    pts = [(o+m, m), (S-o-m, m), (S-m, o+m), (S-m, S-o-m),
           (S-o-m, S-m), (o+m, S-m), (m, S-o-m), (m, o+m)]
    draw.polygon(pts, fill=(22, 27, 34), outline=border_color)
    draw.polygon(pts, outline=(*border_color, 80))  # outer glow approximation
    # Draw icon
    draw_fn(draw, S // 2, S // 2, S // 2 - 14)
    path = os.path.join(OUT, f'{relic_id}.png')
    img.save(path)
    print(f'  ✓ {relic_id}.png')

# ── Icon draw functions ────────────────────────────────────────────────────

def icon_coffee_mug(draw, cx, cy, r):
    # Mug body
    draw.rounded_rectangle([cx - r + 4, cy - r + 8, cx + r - 4, cy + r],
                            radius=6, fill=AMBER, outline=GOLD, width=2)
    # Handle
    draw.arc([cx + r - 10, cy - 5, cx + r + 8, cy + 20],
             start=270, end=90, fill=GOLD, width=3)
    # Steam lines
    for i, ox in enumerate([-8, 0, 8]):
        draw.arc([cx + ox - 4, cy - r - 4 + i * 3, cx + ox + 4, cy - r + 4 + i * 3],
                 start=180, end=0, fill=(*WHITE, 150), width=2)

def icon_standing_desk(draw, cx, cy, r):
    # Desk top
    draw.rectangle([cx - r + 2, cy - 6, cx + r - 2, cy + 4], fill=BLUE,
                   outline=(100, 160, 255), width=2)
    # Legs
    for lx in [cx - r + 8, cx + r - 8]:
        draw.rectangle([lx - 4, cy + 4, lx + 4, cy + r], fill=BLUE)
    # Monitor
    draw.rounded_rectangle([cx - 10, cy - r + 2, cx + 10, cy - 10],
                            radius=3, fill=(30, 40, 60), outline=(80, 120, 180), width=1)
    draw.rectangle([cx - 2, cy - 10, cx + 2, cy - 6], fill=BLUE)

def icon_headphones(draw, cx, cy, r):
    # Headband arc
    draw.arc([cx - r + 2, cy - r + 2, cx + r - 2, cy + 4],
             start=180, end=0, fill=GREEN, width=5)
    # Ear cups
    for ex in [cx - r + 2, cx + r - 14]:
        draw.rounded_rectangle([ex, cy - 6, ex + 12, cy + r - 4],
                                radius=5, fill=GREEN, outline=(0, 160, 40), width=2)

def icon_clock(draw, cx, cy, r):
    # Tomato-shaped clock
    draw.ellipse([cx - r, cy - r + 4, cx + r, cy + r + 4], fill=TOMATO,
                 outline=(255, 100, 80), width=2)
    # Leaf
    draw.ellipse([cx - 8, cy - r - 4, cx + 8, cy - r + 6], fill=(40, 160, 60))
    # Clock face
    draw.ellipse([cx - r + 6, cy - r + 10, cx + r - 6, cy + r - 2], fill=(220, 60, 50))
    # Hands
    draw.line([(cx, cy + 4), (cx, cy - r + 18)], fill=WHITE, width=2)
    draw.line([(cx, cy + 4), (cx + r - 14, cy + 8)], fill=WHITE, width=2)
    draw.ellipse([cx - 3, cy + 1, cx + 3, cy + 7], fill=WHITE)

def icon_playlist(draw, cx, cy, r):
    # Headphone + music notes
    draw.arc([cx - r + 4, cy - r + 4, cx + r - 4, cy + 2],
             start=180, end=0, fill=PURPLE, width=4)
    for ex in [cx - r + 4, cx + r - 16]:
        draw.ellipse([ex, cy - 2, ex + 12, cy + 14], fill=PURPLE)
    # Notes
    for i, (nx, ny) in enumerate([(cx + 4, cy - r + 6), (cx + 14, cy - r + 14)]):
        draw.ellipse([nx - 5, ny + 6, nx + 1, ny + 12], fill=AMBER)
        draw.line([(nx + 1, ny + 6), (nx + 1, ny)], fill=AMBER, width=2)
        if i == 0:
            draw.line([(nx + 1, ny), (nx + 14, ny - 4)], fill=AMBER, width=2)

def icon_lucky_tomato(draw, cx, cy, r):
    # Tomato with sparkles
    draw.ellipse([cx - r + 4, cy - r + 6, cx + r - 4, cy + r], fill=TOMATO)
    draw.ellipse([cx - 6, cy - r + 8, cx + 6, cy - r + 18], fill=(40, 160, 60))
    # Star/sparkle
    for angle in [45, 135, 225, 315]:
        a = math.radians(angle)
        x1 = cx + int((r - 6) * math.cos(a))
        y1 = cy + int((r - 6) * math.sin(a))
        draw.line([(cx, cy), (x1, y1)], fill=GOLD, width=1)
    for angle in [0, 90, 180, 270]:
        a = math.radians(angle)
        x1 = cx + int((r - 2) * math.cos(a))
        y1 = cy + int((r - 2) * math.sin(a))
        draw.ellipse([x1 - 3, y1 - 3, x1 + 3, y1 + 3], fill=GOLD)

def icon_journal(draw, cx, cy, r):
    # Open notebook
    draw.rounded_rectangle([cx - r + 2, cy - r + 4, cx + r - 2, cy + r - 2],
                            radius=4, fill=(200, 190, 170), outline=AMBER, width=2)
    # Pages
    draw.rectangle([cx - r + 6, cy - r + 8, cx - 2, cy + r - 6],
                   fill=(230, 220, 200))
    draw.rectangle([cx + 2, cy - r + 8, cx + r - 6, cy + r - 6],
                   fill=(240, 230, 210))
    # Spine
    draw.line([(cx, cy - r + 4), (cx, cy + r - 2)], fill=AMBER, width=3)
    # Lines on right page
    for ly in range(cy - r + 16, cy + r - 8, 8):
        draw.line([(cx + 4, ly), (cx + r - 8, ly)], fill=(180, 170, 150), width=1)
    # Gold star on left page
    draw.polygon([(cx - r//2, cy - 8), (cx - r//2 + 5, cy), (cx - r//2 - 5, cy)],
                 fill=GOLD)
    draw.polygon([(cx - r//2, cy + 2), (cx - r//2 + 5, cy - 6), (cx - r//2 - 5, cy - 6)],
                 fill=GOLD)

RELICS = [
    ('coffee_mug',                icon_coffee_mug,    AMBER),
    ('standing_desk',             icon_standing_desk, BLUE),
    ('noise_canceling_headphones',icon_headphones,    GREEN),
    ('pomodoro_clock',            icon_clock,         TOMATO),
    ('focus_playlist',            icon_playlist,      PURPLE),
    ('lucky_tomato',              icon_lucky_tomato,  TOMATO),
    ('productivity_journal',      icon_journal,       AMBER),
]

if __name__ == '__main__':
    print('Generating relic icons...')
    for relic_id, fn, color in RELICS:
        make_relic(relic_id, fn, color)
    print('Done!')
