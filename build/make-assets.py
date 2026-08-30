#!/usr/bin/env python
"""
Curva — asset generator.

Builds every icon and the OG card from one source of truth, so the mark,
the bottle and the oil can never drift between the page and its metadata.

    python build/make-assets.py

Needs rsvg-convert on PATH (the .ico is packed by hand — Windows' `convert`
is the FAT-to-NTFS volume tool, not ImageMagick).
"""
import io, math, os, struct, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets')
BUILD = os.path.join(ROOT, 'build')

INK, AMBER, AMBER_DEEP = '#14100E', '#D89A3E', '#8A4F16'

# ── the mark: a C whose gap is wide enough for the drop to sit in ──────────
MARK_C = 'M71.86 23.95A34 34 0 1 0 71.86 76.05'
MARK_DROP = 'M64 34s10.5 10.6 10.5 16.9a10.5 10.5 0 0 1-21 0C53.5 44.6 64 34 64 34Z'

# ── the bottle: rounded shoulder, straight body, 100 ml apothecary ────────
BOTTLE = ('M104 54 L136 54 L136 96 C150 102 162 111 171 123 C186 142 192 166 192 192 '
          'L192 344 C192 374 174 392 146 392 L94 392 C66 392 48 374 48 344 L48 192 '
          'C48 166 54 142 69 123 C78 111 90 102 104 96 Z')


# ═══════════════════ the oil, by the same maths oil.js uses ═══════════════
def catmull(pts, seg=24):
    P = lambda i: pts[max(0, min(len(pts) - 1, i))]
    out = []
    for i in range(len(pts) - 1):
        p0, p1, p2, p3 = P(i - 1), P(i), P(i + 1), P(i + 2)
        for j in range(seg):
            t = j / seg; t2 = t * t; t3 = t2 * t
            out.append((
                .5 * ((2*p1[0]) + (-p0[0]+p2[0])*t + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
                .5 * ((2*p1[1]) + (-p0[1]+p2[1])*t + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)))
    out.append(pts[-1])
    return out


def resample(d, step=3.0):
    out = [d[0]]; carry = 0.0
    for i in range(1, len(d)):
        ax, ay = d[i-1]; bx, by = d[i]
        L = math.hypot(bx - ax, by - ay)
        if L < 1e-9: continue
        t = 0.0
        while carry + (1 - t) * L >= step:
            need = (step - carry) / L + t
            if need > 1: break
            out.append((ax + (bx-ax)*need, ay + (by-ay)*need)); t = need; carry = 0.0
        carry += (1 - t) * L
    return out


def ribbon(way, beads, w0, w1, step=3.0):
    """Walk the centreline; emit p+n*h down one side and p-n*h back up the
    other as one closed fillable outline. Returns (body, specular)."""
    c = resample(catmull(way), step)
    n = len(c)
    N = []
    for i in range(n):
        ax, ay = c[max(0, i-1)]; bx, by = c[min(n-1, i+1)]
        tx, ty = bx - ax, by - ay
        m = math.hypot(tx, ty) or 1
        N.append((-ty / m, tx / m))
    H = []
    for i in range(n):
        s = i * step; t = i / (n - 1)
        h = w0 + (w1 - w0) * (1 - (1 - t) ** 2.2)          # accumulation
        for bs, ba, bw in beads:                            # travelling beads
            dd = (s - bs) / bw
            if -3 < dd < 3: h *= 1 + ba * math.exp(-dd * dd)
        u = min(1.0, s / 60.0)                              # stretched at the lip
        h *= .34 + .66 * (u * u * (3 - 2 * u))
        H.append(h)

    f = lambda v: round(v * 2) / 2
    L = [f'M{f(c[0][0] + N[0][0]*H[0])} {f(c[0][1] + N[0][1]*H[0])}']
    for i in range(1, n):
        L.append(f'L{f(c[i][0] + N[i][0]*H[i])} {f(c[i][1] + N[i][1]*H[i])}')
    tx, ty = c[-1]; px, py = c[-2]; th = H[-1]
    dx, dy = (tx - px), (ty - py)
    m = math.hypot(dx, dy) or 1
    L.append(f'Q{f(tx + dx/m*th*1.6)} {f(ty + dy/m*th*1.6)} {f(tx - N[-1][0]*th)} {f(ty - N[-1][1]*th)}')
    for i in range(n - 1, -1, -1):
        L.append(f'L{f(c[i][0] - N[i][0]*H[i])} {f(c[i][1] - N[i][1]*H[i])}')

    S, B = [], []
    for i in range(2, n, 3):
        off = H[i] * .40; w = max(.5, H[i] * .18)
        S.append(('M' if not S else 'L') + f'{f(c[i][0] + N[i][0]*(off+w))} {f(c[i][1] + N[i][1]*(off+w))}')
    for i in range(n - 1, 1, -3):
        off = H[i] * .40; w = max(.5, H[i] * .18)
        B.append(f'L{f(c[i][0] + N[i][0]*(off-w))} {f(c[i][1] + N[i][1]*(off-w))}')
    return ''.join(L) + 'Z', (''.join(S) + ''.join(B) + 'Z') if S else ''


# ═══════════════════════════════ icons ═══════════════════════════════════
def mark_svg(bg=None, scale=1.0, colour=AMBER):
    inner = (f'  <path d="{MARK_C}" fill="none" stroke="{colour}" stroke-width="9" stroke-linecap="round"/>\n'
             f'  <path d="{MARK_DROP}" fill="{colour}"/>')
    if scale != 1.0:
        inner = f'  <g transform="translate(50 50) scale({scale}) translate(-50 -50)">\n{inner}\n  </g>'
    rect = f'  <rect width="100" height="100" rx="21" fill="{bg}"/>\n' if bg == INK else (
           f'  <rect width="100" height="100" fill="{bg}"/>\n' if bg else '')
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">\n'
            + rect + inner + '\n</svg>\n')


def pinned_svg():
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n'
            f'  <path d="{MARK_C}" fill="none" stroke="#000" stroke-width="10" stroke-linecap="round"/>\n'
            f'  <path d="{MARK_DROP}"/>\n</svg>\n')


# ═════════════════════════════ the OG card ═══════════════════════════════
def og_svg():
    # The oil leaves the lip, runs down the neck, spills over the shoulder and
    # then rides the body's RIGHT SILHOUETTE — half on the glass, half on the
    # white — before falling clear below the base. Keeping it on the edge is
    # what makes it read as liquid on a bottle rather than paint on a label.
    way = [(983, 128), (985, 158), (992, 186), (1010, 205), (1032, 236), (1042, 278),
           (1045, 336), (1047, 400), (1046, 452), (1050, 500), (1052, 545)]
    # The last bump sits AT the tip, so the thread ends in a hanging bead
    # rather than a blunt cut. Any bump past the route's arc length is a no-op.
    body, spec = ribbon(way, [(110, .4, 30), (230, .6, 36), (330, .45, 26), (424, 1.0, 30)], 2.6, 8.2)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8A4F16"/><stop offset=".16" stop-color="#C1802A"/>
      <stop offset=".42" stop-color="#9A5A1C"/><stop offset=".78" stop-color="#6E3A10"/>
      <stop offset="1" stop-color="#4A2409"/>
    </linearGradient>
    <linearGradient id="inner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#D89A3E" stop-opacity=".55"/>
      <stop offset="1" stop-color="#2B1607" stop-opacity=".9"/>
    </linearGradient>
    <linearGradient id="thread" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7A4413"/><stop offset=".5" stop-color="#A96420"/>
      <stop offset="1" stop-color="#D89A3E"/>
    </linearGradient>
    <clipPath id="bodyClip"><path d="{BOTTLE}"/></clipPath>
  </defs>

  <rect width="1200" height="630" fill="#FFFFFF"/>

  <g transform="translate(838 74) scale(1.07)">
    <path d="{BOTTLE}" fill="url(#glass)"/>
    <g clip-path="url(#bodyClip)">
      <rect x="40" y="212" width="160" height="200" fill="url(#inner)"/>
      <ellipse cx="120" cy="212" rx="76" ry="8.5" fill="#E7AE55" opacity=".5"/>
    </g>
    <path d="M99 41h42v15H99z" fill="#4A2409"/><path d="M101 38h38v6h-38z" fill="#6E3A10"/>
    <ellipse cx="120" cy="39" rx="19" ry="5.4" fill="#1C0F04"/>
    <ellipse cx="120" cy="38.4" rx="14" ry="3.6" fill="#8A4F16"/>
    <path d="M70 140c-12 38-13 150-3 206" stroke="#FFF3DC" stroke-opacity=".34" stroke-width="5" fill="none" stroke-linecap="round"/>
    <rect x="64" y="250" width="112" height="68" rx="1.5" fill="#FCFBF9"/>
    <text x="120" y="282" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="700" letter-spacing="-1.4" fill="#14100E">curva</text>
    <text x="120" y="298" text-anchor="middle" font-family="sans-serif" font-size="6.2" letter-spacing="2.2" fill="#605A54">HIP &amp; BUTT OIL</text>
  </g>

  <!-- the oil goes ON TOP of the glass: a rivulet down the outside is in front of it -->
  <path d="{body}" fill="url(#thread)"/>
  <path d="{body}" fill="none" stroke="#331906" stroke-opacity=".42" stroke-width="1.8"/>
  <path d="{spec}" fill="#F6DFAC" opacity=".5"/>

  <g transform="translate(96 150)">
    <g transform="scale(.4)">
      <path d="{MARK_C}" fill="none" stroke="{AMBER_DEEP}" stroke-width="9" stroke-linecap="round"/>
      <path d="{MARK_DROP}" fill="{AMBER_DEEP}"/>
    </g>
    <text x="50" y="31" font-family="sans-serif" font-size="34" font-weight="700" letter-spacing="-1.6" fill="#14100E">curva</text>
    <text x="2" y="128" font-family="sans-serif" font-size="72" font-weight="500" letter-spacing="-3.6" fill="#14100E">ready to unlock</text>
    <text x="2" y="206" font-family="serif" font-style="italic" font-size="72" letter-spacing="-2.6" fill="#8A4F16">the new you</text>
    <text x="4" y="272" font-family="sans-serif" font-size="20" fill="#605A54">Ten minutes a night. Warm oil, slow circles.</text>
    <text x="4" y="332" font-family="sans-serif" font-size="14" letter-spacing="3.4" fill="#938C85">SMALL BATCHES · LAGOS</text>
  </g>
</svg>
'''


# ══════════════════════════════ packaging ════════════════════════════════
def write(path, text):
    io.open(path, 'w', encoding='utf-8', newline='\n').write(text)
    print('  write', os.path.relpath(path, ROOT))


def png(src, dst, size):
    subprocess.run(['rsvg-convert', '-w', str(size), '-h', str(size), src, '-o', dst], check=True)
    print(f'  png   {os.path.relpath(dst, ROOT)}  {size}x{size}')


def ico(dst, srcs):
    """ICO = 6-byte ICONDIR + one 16-byte entry per image + the PNGs verbatim."""
    blobs = [(s, open(p, 'rb').read()) for s, p in srcs]
    out = io.BytesIO()
    out.write(struct.pack('<HHH', 0, 1, len(blobs)))
    off = 6 + 16 * len(blobs)
    for s, b in blobs:
        out.write(struct.pack('<BBBBHHII', s, s, 0, 0, 1, 32, len(b), off)); off += len(b)
    for _, b in blobs: out.write(b)
    open(dst, 'wb').write(out.getvalue())
    print(f'  ico   {os.path.relpath(dst, ROOT)}  {len(blobs)} sizes, {out.tell()} bytes')


def main():
    os.makedirs(BUILD, exist_ok=True)
    print('icons')
    write(os.path.join(ASSETS, 'favicon.svg'), mark_svg(bg=INK))
    write(os.path.join(ASSETS, 'safari-pinned-tab.svg'), pinned_svg())
    maskable = os.path.join(BUILD, 'maskable.svg')
    write(maskable, mark_svg(bg=INK, scale=.72))

    fav = os.path.join(ASSETS, 'favicon.svg')
    for s in (16, 32, 48):
        png(fav, os.path.join(ASSETS, f'favicon-{s}x{s}.png'), s)
    png(fav, os.path.join(ASSETS, 'apple-touch-icon.png'), 180)
    for s in (192, 512):
        png(maskable, os.path.join(ASSETS, f'android-chrome-{s}x{s}.png'), s)
    ico(os.path.join(ASSETS, 'favicon.ico'),
        [(s, os.path.join(ASSETS, f'favicon-{s}x{s}.png')) for s in (16, 32, 48)])

    print('og card')
    ogsvg = os.path.join(BUILD, 'og.svg')
    write(ogsvg, og_svg())
    subprocess.run(['rsvg-convert', '-w', '1200', '-h', '630', ogsvg,
                    '-o', os.path.join(ASSETS, 'og-image.png')], check=True)
    print('  png   assets/og-image.png  1200x630')
    print('done')


if __name__ == '__main__':
    sys.exit(main())
