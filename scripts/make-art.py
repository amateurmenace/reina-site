"""Generate abstract SVG placeholder artwork for programs, posts, the community feed, and the About page."""
import math, random, os
root = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "img", "art")
os.makedirs(root, exist_ok=True)
PALETTES = [
    ("#14121f", "#ff5a1f", "#ffc53d", "#7a5af8"),
    ("#1b2a2a", "#0fa3a3", "#ffc53d", "#ff5a1f"),
    ("#241b3d", "#7a5af8", "#ff5a1f", "#ffc53d"),
    ("#0f2b2b", "#0fa3a3", "#ffc53d", "#ffffff"),
    ("#2a1408", "#ff5a1f", "#ffc53d", "#0fa3a3"),
    ("#14121f", "#0fa3a3", "#7a5af8", "#ffc53d"),
]
def art(path, w, h, bg, c1, c2, c3, seed):
    random.seed(seed)
    shapes = []
    for _ in range(9):
        kind = random.choice(["circle", "rect", "star", "arc"])
        x, y = random.randint(0, w), random.randint(0, h)
        s = random.randint(int(min(w, h) * .15), int(min(w, h) * .55))
        c = random.choice([c1, c2, c3]); o = round(random.uniform(.55, .95), 2); rot = random.randint(-30, 30)
        if kind == "circle": shapes.append(f'<circle cx="{x}" cy="{y}" r="{s//2}" fill="{c}" opacity="{o}"/>')
        elif kind == "rect": shapes.append(f'<rect x="{x-s//2}" y="{y-s//2}" width="{s}" height="{s}" rx="{s//5}" fill="{c}" opacity="{o}" transform="rotate({rot} {x} {y})"/>')
        elif kind == "arc": shapes.append(f'<path d="M{x-s//2} {y} a{s//2} {s//2} 0 0 1 {s} 0" fill="{c}" opacity="{o}" transform="rotate({rot} {x} {y})"/>')
        else:
            r = s // 2; pts = []
            for k in range(8):
                a = math.pi / 4 * k; rr = r if k % 2 == 0 else r * .42
                pts.append(f"{x+rr*math.cos(a):.0f},{y+rr*math.sin(a):.0f}")
            shapes.append(f'<polygon points="{" ".join(pts)}" fill="{c}" opacity="{o}" transform="rotate({rot} {x} {y})"/>')
    dots = "".join(f'<circle cx="{random.randint(0,w)}" cy="{random.randint(0,h)}" r="{random.randint(2,5)}" fill="#fff" opacity=".6"/>' for _ in range(14))
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="Abstract artwork">
<defs><filter id="b"><feGaussianBlur stdDeviation="{int(min(w,h)*.02)}"/></filter><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{bg}"/><stop offset="1" stop-color="{c3}" stop-opacity=".35"/></linearGradient></defs>
<rect width="{w}" height="{h}" fill="{bg}"/><rect width="{w}" height="{h}" fill="url(#g)"/>
<g filter="url(#b)" opacity=".55">{"".join(shapes[:4])}</g>
<g>{"".join(shapes[4:])}</g>
{dots}
</svg>'''
    with open(path, "w") as f: f.write(svg)
for i, (bg, c1, c2, c3) in enumerate(PALETTES, 1):
    art(os.path.join(root, f"program-{i}.svg"), 800, 500, bg, c1, c2, c3, i * 7)
    art(os.path.join(root, f"post-{i}.svg"), 1200, 640, bg, c1, c2, c3, i * 13)
    art(os.path.join(root, f"feed-{i}.svg"), 400, 400, bg, c1, c2, c3, i * 31)
art(os.path.join(root, "about-story.svg"), 800, 600, "#14121f", "#ff5a1f", "#ffc53d", "#7a5af8", 99)
print("art written:", len(os.listdir(root)), "files")
