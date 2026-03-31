"""
Generate card art sprites for Tomato Quest.
Produces: assets/cards/<id>.png  (120×160 each)
"""

from PIL import Image, ImageDraw, ImageFont
import os, math

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'cards')
os.makedirs(OUT, exist_ok=True)

BG        = (13,  17,  23)
BG2       = (22,  27,  34)
BORDER    = (48,  54,  61)
GREEN     = ( 0, 210,  50)
RED       = (220,  50,  40)
RED_HI    = (255,  90,  70)
AMBER     = (255, 179,  71)
BLUE      = ( 58, 130, 246)
PURPLE    = (139,  92, 246)
DIM       = ( 90, 100, 110)
WHITE     = (220, 230, 240)
TOMATO    = (220,  60,  50)

CW, CH = 120, 160   # card width, height
CORNER = 10

def try_font(size):
    for path in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf",
        "/usr/share/fonts/truetype/ubuntu/UbuntuMono-B.ttf",
    ]:
        if os.path.exists(path):
            try: return ImageFont.truetype(path, size)
            except: pass
    return ImageFont.load_default()

def try_font_reg(size):
    for path in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
    ]:
        if os.path.exists(path):
            try: return ImageFont.truetype(path, size)
            except: pass
    return ImageFont.load_default()

def make_card(card_id, name, cost, card_type, art_fn, color, desc_short):
    """
    card_type: 'attack' | 'skill' | 'power' | 'status'
    art_fn: function(draw, cx, cy, r) drawing the card art
    color: dominant accent color tuple
    """
    img  = Image.new('RGB', (CW, CH), BG)
    draw = ImageDraw.Draw(img)

    type_colors = {
        'attack': (180, 40, 40),
        'skill':  ( 40, 100, 180),
        'power':  (120, 50, 200),
        'status': ( 80, 80, 80),
    }
    accent = type_colors.get(card_type, BORDER)

    # Card border
    draw.rounded_rectangle([1, 1, CW - 2, CH - 2],
                            radius=CORNER, fill=BG2,
                            outline=accent, width=2)

    # Art area background
    art_y0, art_y1 = 20, 95
    draw.rounded_rectangle([6, art_y0, CW - 7, art_y1],
                            radius=6, fill=(*BG, 255))

    # Gradient-ish tint in art area
    for row in range(art_y0, art_y1):
        t = (row - art_y0) / (art_y1 - art_y0)
        r = int(accent[0] * (1 - t) * 0.18)
        g = int(accent[1] * (1 - t) * 0.18)
        b = int(accent[2] * (1 - t) * 0.18)
        draw.line([(6, row), (CW - 7, row)], fill=(r, g, b))

    # Draw art
    art_cx = CW // 2
    art_cy = (art_y0 + art_y1) // 2
    art_r  = (art_y1 - art_y0) // 2 - 6
    art_fn(draw, art_cx, art_cy, art_r)

    # Cost badge (top-left)
    badge_r = 11
    draw.ellipse([4, 4, 4 + badge_r * 2, 4 + badge_r * 2],
                 fill=accent, outline=WHITE)
    f_badge = try_font(11)
    cost_str = str(cost)
    b = draw.textbbox((0, 0), cost_str, font=f_badge)
    bw, bh = b[2]-b[0], b[3]-b[1]
    draw.text((4 + badge_r - bw // 2, 4 + badge_r - bh // 2 - 1),
              cost_str, font=f_badge, fill=WHITE)

    # Type pip (top-right)
    type_labels = {'attack':'ATK','skill':'SKL','power':'PWR','status':'STS'}
    tlabel = type_labels.get(card_type, '?')
    f_type = try_font_reg(7)
    draw.rounded_rectangle([CW - 28, 5, CW - 5, 16],
                            radius=3, fill=accent)
    b = draw.textbbox((0, 0), tlabel, font=f_type)
    draw.text((CW - 28 + (23 - (b[2]-b[0])) // 2, 7),
              tlabel, font=f_type, fill=WHITE)

    # Name
    f_name = try_font(9)
    b = draw.textbbox((0, 0), name, font=f_name)
    nw = b[2] - b[0]
    draw.text(((CW - nw) // 2, 97), name, font=f_name, fill=WHITE)

    # Separator
    draw.line([(8, 110), (CW - 9, 110)], fill=accent, width=1)

    # Description (word-wrapped into ~2 lines)
    f_desc = try_font_reg(7)
    words = desc_short.split()
    lines, cur = [], ''
    for w in words:
        test = (cur + ' ' + w).strip()
        b = draw.textbbox((0, 0), test, font=f_desc)
        if b[2] - b[0] > CW - 16 and cur:
            lines.append(cur)
            cur = w
        else:
            cur = test
    if cur: lines.append(cur)

    dy = 114
    for line in lines[:3]:
        b = draw.textbbox((0, 0), line, font=f_desc)
        draw.text(((CW - (b[2]-b[0])) // 2, dy), line, font=f_desc, fill=(160, 170, 175))
        dy += 11

    # Bottom accent strip
    strip_h = 4
    draw.rounded_rectangle([2, CH - strip_h - 2, CW - 3, CH - 3],
                            radius=2, fill=accent)

    path = os.path.join(OUT, f'{card_id}.png')
    img.save(path, 'PNG')
    return img

# ── Art functions ──────────────────────────────────────────────────────────

def art_sword(draw, cx, cy, r):
    """Crossed swords / focus beam"""
    s = int(r * 0.65)
    # blade
    draw.polygon([(cx, cy - r), (cx + 5, cy), (cx, cy + r * 0.3),
                  (cx - 5, cy)], fill=(180, 200, 255))
    # guard
    draw.rectangle([cx - int(r * 0.6), cy - 4, cx + int(r * 0.6), cy + 4],
                   fill=AMBER)
    # handle
    draw.rectangle([cx - 4, cy, cx + 4, cy + int(r * 0.5)], fill=(120, 80, 40))
    # glow
    draw.ellipse([cx - 8, cy - r - 4, cx + 8, cy - r + 4], fill=(*WHITE, 180))

def art_block_shield(draw, cx, cy, r):
    """Shield shape"""
    pts = [
        (cx, cy - r),
        (cx + int(r * 0.8), cy - int(r * 0.3)),
        (cx + int(r * 0.8), cy + int(r * 0.3)),
        (cx, cy + r),
        (cx - int(r * 0.8), cy + int(r * 0.3)),
        (cx - int(r * 0.8), cy - int(r * 0.3)),
    ]
    draw.polygon(pts, fill=BLUE, outline=(100, 160, 255))
    # inner shield detail
    inner = [(cx + (x-cx)*0.6, cy + (y-cy)*0.6) for x,y in pts]
    draw.polygon([(int(x), int(y)) for x,y in inner], fill=(40, 90, 170))
    # cross
    draw.line([(cx, cy - int(r*0.4)), (cx, cy + int(r*0.4))], fill=WHITE, width=2)
    draw.line([(cx - int(r*0.35), cy), (cx + int(r*0.35), cy)], fill=WHITE, width=2)

def art_lightning(draw, cx, cy, r):
    """Lightning bolt = deep work power"""
    pts = [(cx + 8, cy - r),
           (cx - 4, cy - 4),
           (cx + 8, cy - 4),
           (cx - 8, cy + r),
           (cx + 4, cy + 4),
           (cx - 8, cy + 4)]
    draw.polygon(pts, fill=AMBER, outline=(255, 220, 80))

def art_brain(draw, cx, cy, r):
    """Brain / brainstorm — two lobes"""
    draw.ellipse([cx - r, cy - int(r*0.6), cx, cy + int(r*0.6)],
                 fill=(200, 100, 200))
    draw.ellipse([cx, cy - int(r*0.6), cx + r, cy + int(r*0.6)],
                 fill=(220, 80, 180))
    draw.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=WHITE)
    # squiggle lines
    for i, yoff in enumerate([-8, 0, 8]):
        draw.arc([cx - r + 4, cy + yoff - 4, cx + r - 4, cy + yoff + 4],
                 start=0, end=180, fill=(255, 200, 255), width=1)

def art_tomato(draw, cx, cy, r):
    """Mini tomato for pomodoro technique card"""
    draw.ellipse([cx - r, cy - int(r*0.85), cx + r, cy + r], fill=TOMATO)
    # leaf
    draw.ellipse([cx - int(r*0.4), cy - r - int(r*0.3),
                  cx + int(r*0.4), cy - int(r*0.6)], fill=(40, 160, 60))
    draw.ellipse([cx - int(r*0.6), cy - r,
                  cx + int(r*0.6), cy - int(r*0.5)], fill=(40, 160, 60))
    # highlight
    draw.ellipse([cx - int(r*0.4), cy - int(r*0.7),
                  cx, cy - int(r*0.2)], fill=(255, 180, 160))

def art_wind(draw, cx, cy, r):
    """Wind curls = second wind"""
    for i in range(3):
        yoff = (i - 1) * int(r * 0.5)
        x0 = cx - int(r * 0.6)
        x1 = cx + int(r * 0.6)
        y = cy + yoff
        draw.arc([x0, y - 8, x0 + 14, y + 8], start=90, end=270,
                 fill=(*BLUE, 255), width=2)
        draw.line([(x0 + 7, y), (x1, y)], fill=BLUE, width=2)
        draw.arc([x1 - 14, y - 8, x1, y + 8], start=270, end=90,
                 fill=(*BLUE, 255), width=2)

def art_zone(draw, cx, cy, r):
    """The Zone — concentric glowing rings"""
    for i in range(4):
        ri = r - i * int(r * 0.22)
        alpha = 255 - i * 50
        c = (int(PURPLE[0] + i*20), int(PURPLE[1]), int(PURPLE[2]))
        draw.ellipse([cx - ri, cy - ri, cx + ri, cy + ri],
                     outline=c, width=2)
    draw.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=WHITE)

def art_context_switch(draw, cx, cy, r):
    """Two arrows rotating = context switch"""
    # Arrow 1 (clockwise, top-right arc)
    draw.arc([cx - r, cy - r, cx + r, cy + r], start=-30, end=120,
             fill=GREEN, width=3)
    # Arrow head
    draw.polygon([(cx + r - 2, cy - 5), (cx + r + 5, cy), (cx + r - 2, cy + 5)],
                 fill=GREEN)
    # Arrow 2 (counter, bottom-left)
    draw.arc([cx - r, cy - r, cx + r, cy + r], start=150, end=300,
             fill=RED_HI, width=3)
    draw.polygon([(cx - r + 2, cy - 5), (cx - r - 5, cy), (cx - r + 2, cy + 5)],
                 fill=RED_HI)

def art_deadline(draw, cx, cy, r):
    """Countdown clock / deadline rush"""
    draw.ellipse([cx - r, cy - r, cx + r, cy + r],
                 outline=RED_HI, width=3)
    # Clock hands at 11:55 (almost midnight)
    angle_h = math.radians(-90 + 330)  # hour at 11
    angle_m = math.radians(-90 + 300)  # minute at 10
    draw.line([(cx, cy),
               (cx + int(r * 0.5 * math.cos(angle_h)),
                cy + int(r * 0.5 * math.sin(angle_h)))],
              fill=WHITE, width=2)
    draw.line([(cx, cy),
               (cx + int(r * 0.75 * math.cos(angle_m)),
                cy + int(r * 0.75 * math.sin(angle_m)))],
              fill=RED_HI, width=2)
    draw.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=WHITE)
    # tick marks
    for i in range(12):
        a = math.radians(i * 30)
        x0 = cx + int((r - 4) * math.cos(a))
        y0 = cy + int((r - 4) * math.sin(a))
        x1 = cx + int(r * math.cos(a))
        y1 = cy + int(r * math.sin(a))
        draw.line([(x0, y0), (x1, y1)], fill=DIM, width=1)

def art_deep_flow(draw, cx, cy, r):
    """Deep flow — wave + sword"""
    # Wave
    for x in range(cx - r, cx + r):
        t = (x - (cx - r)) / (2 * r)
        y = cy + int(r * 0.5 * math.sin(t * math.pi * 3))
        draw.ellipse([x - 1, y - 1, x + 1, y + 1], fill=(*BLUE, 200))
    # Sword
    draw.polygon([(cx, cy - r), (cx + 3, cy - 4), (cx - 3, cy - 4)],
                 fill=(200, 220, 255))
    draw.rectangle([cx - 2, cy - 4, cx + 2, cy + 6], fill=(160, 180, 220))

def art_distraction(draw, cx, cy, r):
    """Phone / distraction — skull-ish red"""
    # Phone shape
    pr = int(r * 0.55)
    draw.rounded_rectangle([cx - pr, cy - r, cx + pr, cy + r],
                            radius=5, fill=(60, 20, 20), outline=RED)
    # Screen glare
    draw.rounded_rectangle([cx - pr + 4, cy - r + 8, cx + pr - 4, cy + int(r * 0.4)],
                            radius=3, fill=(40, 0, 0))
    draw.line([(cx - pr + 6, cy - r + 14), (cx + pr - 6, cy - r + 14)],
              fill=RED, width=1)
    draw.line([(cx - pr + 6, cy - r + 20), (cx + pr - 6, cy - r + 20)],
              fill=RED, width=1)
    # Warning X
    draw.line([(cx - 8, cy + int(r*0.5)), (cx + 8, cy + r - 4)], fill=RED_HI, width=2)
    draw.line([(cx + 8, cy + int(r*0.5)), (cx - 8, cy + r - 4)], fill=RED_HI, width=2)

# ── Card definitions ───────────────────────────────────────────────────────

CARDS = [
    ('focus',               'Focus',            1, 'attack', art_sword,         RED,    'Deal 6 damage.'),
    ('focus_plus',          'Focus+',           1, 'attack', art_sword,         RED,    'Deal 9 damage.'),
    ('block',               'Block',            1, 'skill',  art_block_shield,  BLUE,   'Gain 5 armor.'),
    ('block_plus',          'Block+',           1, 'skill',  art_block_shield,  BLUE,   'Gain 8 armor.'),
    ('deep_work',           'Deep Work',        2, 'attack', art_lightning,     AMBER,  'Deal 15 damage.'),
    ('deep_work_plus',      'Deep Work+',       2, 'attack', art_lightning,     AMBER,  'Deal 22 damage.'),
    ('brainstorm',          'Brainstorm',       1, 'skill',  art_brain,         PURPLE, 'Draw 2 cards.'),
    ('brainstorm_plus',     'Brainstorm+',      0, 'skill',  art_brain,         PURPLE, 'Draw 2 cards. Free.'),
    ('flow_state',          'Flow State',       2, 'attack', art_deep_flow,     BLUE,   'Deal 20 dmg. Draw 1.'),
    ('hyperfocus',          'Hyperfocus',       3, 'attack', art_lightning,     RED,    'Deal 30 dmg. Vulnerable.'),
    ('time_block',          'Time Block',       2, 'skill',  art_block_shield,  BLUE,   'Gain 15 armor.'),
    ('pomodoro_technique',  'Pomo Technique',   0, 'skill',  art_tomato,        TOMATO, 'Add Focus+ to hand.'),
    ('second_wind',         'Second Wind',      1, 'skill',  art_wind,          BLUE,   '4 armor per exhaust.'),
    ('the_zone',            'The Zone',         3, 'power',  art_zone,          PURPLE, 'Focus costs 0 this turn.'),
    ('context_switch',      'Context Switch',   1, 'skill',  art_context_switch,GREEN,  'Remove statuses. +2 energy.'),
    ('deadline_rush',       'Deadline Rush',    0, 'attack', art_deadline,      RED,    'Damage = missing HP. Exhaust.'),
    ('deep_flow',           'Deep Flow',        2, 'attack', art_deep_flow,     BLUE,   'Deal 25 dmg. Next Focus free.'),
    ('distraction',         'Distraction',      0, 'status', art_distraction,   (80,20,20), 'Drawn: lose 1 energy. Exhaust.'),
]

if __name__ == '__main__':
    print(f'Generating {len(CARDS)} card art sprites...')
    for card_id, name, cost, ctype, art_fn, color, desc in CARDS:
        make_card(card_id, name, cost, ctype, art_fn, color, desc)
        print(f'  ✓ {card_id}.png')
    print('Done!')
