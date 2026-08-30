/* ═══════════════════════════════════════════════════════════════════════
   CURVA — oil engine
   ───────────────────────────────────────────────────────────────────────
   The oil is not a stroke. A stroke is a constant-width ribbon and can
   never bulge, neck or pinch. Instead we generate the silhouette:

     1  measure invisible .oil-a anchors → a route in page coordinates
     2  spline + resample that route at a fixed arc-length step
     3  bake a half-width for every sample (accumulation, curvature
        pooling, travelling beads, micro-texture)
     4  emit  p + n·h  down one side and  p − n·h  back up the other
        as one closed, fillable path
     5  reveal it by slicing that point list to the scroll position

   Because the width is baked at layout time, every settled point can be
   pre-stringified once and re-joined per frame — so the per-frame cost is
   a couple of array slices instead of thousands of number formats.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
'use strict';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp  = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const easeOut = t => 1 - Math.pow(1 - t, 2.2);

/* deterministic value noise — same page, same oil, every reload */
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function noise(x){
  const i = Math.floor(x), f = x - i;
  return lerp(hash(i), hash(i + 1), smooth(f)) * 2 - 1;   /* −1 … 1 */
}
function fbm(x){ return noise(x) * .6 + noise(x * 2.3 + 9.1) * .3 + noise(x * 4.7 + 21.3) * .1; }

/* ───────────────────────────── elements ───────────────────────────── */
const page     = $('#pageEl');
const tintLayer= $('#tintLayer');
const oilWrap  = $('#oilWrap');
const svg      = $('#oilSvg');
const pCast    = $('#oilCast');
const pBody    = $('#oilBody');
const pRim     = $('#oilRim');
const pSpec    = $('#oilSpec');
const pCaust   = $('#oilCaust');
const gBulb    = $('#oilBulb');
const pBulb    = $('#oilBulbShape');
const pBulbLit = $('#oilBulbLit');
const gBeads   = $('#oilBeads');
const grad     = $('#oilGrad');
const footer   = $('#footer');
if (!page || !svg) return;

/* ═══════════════════════════ 1 · MEASURE ═══════════════════════════ */
const STEP = 2.6;          /* arc-length between samples, px */
const CHUNK = 64;          /* samples per cached string chunk  */

let W = 0, H = 0;                 /* page box                     */
let pts = [];                     /* {x,y,nx,ny,h} per sample     */
let Lstr = [], Rstr = [];         /* chunked point strings        */
let total = 0;                    /* arc length                   */
let startY = 0, endY = 0, pageTop = 0;   /* scroll mapping window */
let gut = 70;

function route(){
  const box = page.getBoundingClientRect();
  const ox = -box.left - scrollX, oy = -box.top - scrollY;   /* → page space */
  const pt = el => {
    const r = el.getBoundingClientRect();
    return { x: r.left + scrollX + ox + r.width / 2, y: r.top + scrollY + oy + r.height / 2 };
  };

  /* Document order matters, and it is already correct: the four anchors
     inside the bottle SVG come first, then one per band down the page.
     Anchors placed inside the SVG scale exactly with the artwork, so the
     oil leaves the real lip at every viewport. */
  const out = [];
  $$('.oil-a,[data-oil-a]').forEach(a => {
    const p = pt(a);
    p.pool = +(a.dataset.pool || 0);
    out.push(p);
  });
  /* strictly monotonic in y, and de-duplicated, or the spline folds back */
  const clean = [];
  for (const p of out){
    if (!clean.length || p.y > clean[clean.length - 1].y + 4) clean.push(p);
  }
  return clean;
}

/* Catmull–Rom through the route, then resample by arc length */
function centreline(r){
  if (r.length < 2) return [];
  const dense = [];
  const P = i => r[clamp(i, 0, r.length - 1)];
  for (let i = 0; i < r.length - 1; i++){
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const seg = Math.max(12, Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 7));
    for (let j = 0; j < seg; j++){
      const t = j / seg, t2 = t * t, t3 = t2 * t;
      dense.push({
        x: .5 * ((2*p1.x) + (-p0.x + p2.x)*t + (2*p0.x - 5*p1.x + 4*p2.x - p3.x)*t2 + (-p0.x + 3*p1.x - 3*p2.x + p3.x)*t3),
        y: .5 * ((2*p1.y) + (-p0.y + p2.y)*t + (2*p0.y - 5*p1.y + 4*p2.y - p3.y)*t2 + (-p0.y + 3*p1.y - 3*p2.y + p3.y)*t3),
        pool: lerp(p1.pool || 0, p2.pool || 0, t)
      });
    }
  }
  dense.push({ ...r[r.length - 1] });

  /* lateral meander: very low frequency, small amplitude. Oil running down
     a surface wanders a few px — it does not zigzag across the page. */
  let acc = 0;
  for (let i = 1; i < dense.length; i++){
    acc += Math.hypot(dense[i].x - dense[i-1].x, dense[i].y - dense[i-1].y);
    dense[i].x += fbm(acc * .0055) * 11 + fbm(acc * .019 + 40) * 3.2;
  }

  /* resample at constant STEP so width + reveal are in real units */
  const out = [dense[0]];
  let carry = 0;
  for (let i = 1; i < dense.length; i++){
    const a = dense[i-1], b = dense[i];
    let d = Math.hypot(b.x - a.x, b.y - a.y);
    if (d < 1e-6) continue;
    let t = 0;
    while (carry + d - t * d >= STEP){
      const need = (STEP - carry) / d + t;
      if (need > 1) break;
      out.push({ x: lerp(a.x, b.x, need), y: lerp(a.y, b.y, need), pool: lerp(a.pool||0, b.pool||0, need) });
      t = need; carry = 0;
    }
    carry += (1 - t) * d;
  }
  return out;
}

/* ═══════════════════════ 2 · BAKE THE WIDTH ════════════════════════
   This is where it stops being a line and becomes liquid. Four terms:
     accumulation  the thread thickens as more oil runs into it
     pooling       it fattens where the path bends — oil piles up on the
                   inside of a turn, which is why real drips look beaded
     beads         discrete travelling lumps at irregular intervals
     texture       ±6% high-frequency so the edge is never glassy
   ═══════════════════════════════════════════════════════════════════ */
function bake(c){
  const n = c.length;
  const cap = gut * .44;                        /* never touch the type */

  /* tangents + normals */
  for (let i = 0; i < n; i++){
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y;
    const m = Math.hypot(tx, ty) || 1;
    tx /= m; ty /= m;
    c[i].tx = tx; c[i].ty = ty;
    c[i].nx = -ty; c[i].ny = tx;
  }

  /* bead centres — irregular spacing so it never looks periodic */
  const beads = [];
  for (let s = 140, k = 0; s < n * STEP - 60; k++){
    beads.push({ s, amp: .34 + hash(k * 3.7) * .82, wid: 26 + hash(k * 9.1) * 48 });
    s += 150 + hash(k * 5.3) * 320;
  }

  for (let i = 0; i < n; i++){
    const s = i * STEP, t = i / (n - 1);

    let h = lerp(3.2, 11.6, easeOut(t));                       /* accumulation */

    /* curvature → pooling */
    const a = c[Math.max(0, i - 6)], b = c[Math.min(n - 1, i + 6)];
    const curv = Math.abs(a.tx * b.ty - a.ty * b.tx);
    h *= 1 + Math.min(.42, curv * 2.1);

    /* explicit pool anchors (section joins) */
    h *= 1 + (c[i].pool || 0) * .55;

    /* travelling beads */
    let bump = 0;
    for (const bd of beads){
      const d = (s - bd.s) / bd.wid;
      if (d > -3 && d < 3) bump += bd.amp * Math.exp(-d * d);
    }
    h *= 1 + bump;

    /* texture */
    h *= 1 + fbm(s * .085) * .06;

    /* stretched thin as it is pulled out of the bottle */
    h *= .34 + .66 * smooth(clamp(s / 90, 0, 1));

    c[i].h = Math.min(h, cap);
  }
  return c;
}

/* ═══════════════════ 3 · PRE-STRINGIFY THE OUTLINE ════════════════ */
const f = v => (Math.round(v * 2) / 2);      /* half-pixel is plenty */

function stringify(){
  Lstr = []; Rstr = [];
  for (let c = 0; c * CHUNK < pts.length; c++){
    let l = '', r = '';
    const a = c * CHUNK, b = Math.min(pts.length, a + CHUNK);
    for (let i = a; i < b; i++){
      const p = pts[i];
      l += 'L' + f(p.x + p.nx * p.h) + ' ' + f(p.y + p.ny * p.h);
    }
    for (let i = b - 1; i >= a; i--){       /* reversed, for the return leg */
      const p = pts[i];
      r += 'L' + f(p.x - p.nx * p.h) + ' ' + f(p.y - p.ny * p.h);
    }
    Lstr.push(l); Rstr.push(r);
  }
}

/* ═══════════════════════════ 4 · BUILD ════════════════════════════ */
function build(){
  const box = page.getBoundingClientRect();
  W = page.offsetWidth;
  H = page.offsetHeight;
  gut = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gut')) || 70;

  oilWrap.style.height = H + 'px';
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);

  pts = bake(centreline(route()));
  total = Math.max(1, (pts.length - 1) * STEP);
  stringify();

  if (grad){                                  /* gradient spans the document */
    grad.setAttribute('x1', 0); grad.setAttribute('x2', 0);
    grad.setAttribute('y1', pts.length ? pts[0].y : 0);
    grad.setAttribute('y2', pts.length ? pts[pts.length - 1].y : H);
  }

  pageTop = box.top + scrollY;
  startY = pts.length ? pts[0].y : 0;
  const fr = footer ? footer.getBoundingClientRect() : null;
  endY = fr ? fr.top + scrollY - box.top - scrollY : H;

  paintTints();
  buildFooterOil();
}

/* flat colour swatches for tinted bands. They live UNDER the oil, so a
   section's own background can never hide the liquid. */
function paintTints(){
  if (!tintLayer) return;
  tintLayer.textContent = '';
  const base = page.getBoundingClientRect().top + scrollY;
  $$('[data-tint]').forEach(el => {
    const r = el.getBoundingClientRect();
    const d = document.createElement('div');
    d.className = 'tint';
    d.style.top = (r.top + scrollY - base) + 'px';
    d.style.height = r.height + 'px';
    d.style.background = el.dataset.tint;
    tintLayer.appendChild(d);
  });
}

/* ══════════════════════════ 5 · RENDER ════════════════════════════ */
let shown = 0, target = 0, speed = 0, mass = 0;
const beads = [];

function outline(len){
  const iTip = clamp(Math.floor(len / STEP), 1, pts.length - 1);
  const cN = Math.floor(iTip / CHUNK);

  let d = '';
  const p0 = pts[0];
  d += 'M' + f(p0.x + p0.nx * p0.h) + ' ' + f(p0.y + p0.ny * p0.h);

  /* settled chunks: pre-joined strings, no number formatting this frame */
  let left = Lstr.slice(0, cN).join('');
  let right = Rstr.slice(0, cN).reverse().join('');

  /* the live remainder, plus a neck that pinches into the head droplet */
  let tailL = '', tailR = '';
  const necks = [];
  for (let i = cN * CHUNK; i <= iTip; i++){
    const p = pts[i];
    const back = (len - i * STEP);
    const neck = back < 30 ? lerp(.38, 1, clamp(back / 30, 0, 1)) : 1;
    const h = p.h * neck;
    necks.push({ p, h });
    tailL += 'L' + f(p.x + p.nx * h) + ' ' + f(p.y + p.ny * h);
  }
  for (let k = necks.length - 1; k >= 0; k--){
    const { p, h } = necks[k];
    tailR += 'L' + f(p.x - p.nx * h) + ' ' + f(p.y - p.ny * h);
  }

  const tip = pts[iTip];
  const th = (necks.length ? necks[necks.length - 1].h : tip.h);
  /* rounded cap carried forward along the tangent */
  const cap = 'Q' + f(tip.x + tip.tx * th * 1.5) + ' ' + f(tip.y + tip.ty * th * 1.5) +
              ' ' + f(tip.x - tip.nx * th) + ' ' + f(tip.y - tip.ny * th);

  return { d: d + left + tailL + cap + tailR + right + 'Z', tip, th, iTip };
}

/* the specular streak and the caustic edge have their own geometry, offset
   from the centreline, so the light follows the liquid's real shape */
function sheen(len, side, inset, wid){
  const iTip = clamp(Math.floor(len / STEP), 1, pts.length - 1);
  const stride = Math.max(1, Math.floor(iTip / 420));
  let a = '', b = [];
  for (let i = 2; i <= iTip; i += stride){
    const p = pts[i];
    const off = p.h * inset * side, w = Math.max(.45, p.h * wid);
    a += (a ? 'L' : 'M') + f(p.x + p.nx * (off + w)) + ' ' + f(p.y + p.ny * (off + w));
    b.push('L' + f(p.x + p.nx * (off - w)) + ' ' + f(p.y + p.ny * (off - w)));
  }
  return a ? a + b.reverse().join('') + 'Z' : '';
}

function bulbPath(r, stretch){
  /* a teardrop: pointed where it is still attached, round where it hangs */
  const ry = r * (1 + stretch * .85), rx = r * (1 - stretch * .26);
  return `M0 ${f(-ry)}C${f(rx*.86)} ${f(-ry*.34)} ${f(rx)} ${f(ry*.2)} ${f(rx)} ${f(ry*.52)}`
       + `C${f(rx)} ${f(ry*.86)} ${f(rx*.6)} ${f(ry)} 0 ${f(ry)}`
       + `C${f(-rx*.6)} ${f(ry)} ${f(-rx)} ${f(ry*.86)} ${f(-rx)} ${f(ry*.52)}`
       + `C${f(-rx)} ${f(ry*.2)} ${f(-rx*.86)} ${f(-ry*.34)} 0 ${f(-ry)}Z`;
}

function render(){
  if (!pts.length) return;
  const o = outline(shown);
  pBody.setAttribute('d', o.d);
  pRim .setAttribute('d', o.d);
  pCast.setAttribute('d', o.d);
  pSpec .setAttribute('d', sheen(shown,  1, .40, .17));
  pCaust.setAttribute('d', sheen(shown, -1, .62, .07));

  /* head droplet — stretches with velocity, swells while it hangs */
  const sN = clamp(speed / 26, 0, 1);
  const r = o.th * (1.45 + mass * .5);
  const ang = Math.atan2(o.tip.ty, o.tip.tx) * 180 / Math.PI - 90;
  gBulb.setAttribute('transform',
    `translate(${f(o.tip.x + o.tip.tx * r * .34)} ${f(o.tip.y + o.tip.ty * r * .34)}) rotate(${ang.toFixed(1)})`);
  pBulb.setAttribute('d', bulbPath(r, sN));
  pBulbLit.setAttribute('transform', `translate(${f(-r*.34)} ${f(-r*.1)}) scale(${(r/9).toFixed(2)})`);

  /* free beads that have pinched off */
  gBeads.textContent = '';
  for (const b of beads){
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    c.setAttribute('d', bulbPath(b.r, clamp(b.vy / 900, 0, .7)));
    c.setAttribute('transform', `translate(${f(b.x)} ${f(b.y)})`);
    c.setAttribute('fill', 'url(#beadGrad)');
    c.setAttribute('opacity', clamp(b.life, 0, 1).toFixed(2));
    gBeads.appendChild(c);
  }
}

/* ══════════════════════ 6 · SCROLL → LENGTH ═══════════════════════ */
function measureTarget(){
  const lead = innerHeight * .74;                /* the oil leads the reader */
  const span = Math.max(1, endY - startY);
  const prog = clamp((scrollY + lead - (startY + pageTop)) / span, 0, 1);
  target = prog * total;
}

let last = performance.now(), idle = 0, running = false;
function frame(now){
  const dt = Math.min(.05, (now - last) / 1000); last = now;

  const prev = shown;
  shown += (target - shown) * (reduce ? 1 : .11);   /* liquid lag */
  speed = Math.abs(shown - prev) / Math.max(dt, .001) * .016;

  /* a resting tip accumulates mass until it lets go */
  if (!reduce){
    if (speed < 1.4){
      mass += dt * .55;
      if (mass > 1 && beads.length < 5 && shown > 120){
        const i = clamp(Math.floor(shown / STEP), 1, pts.length - 1);
        beads.push({ x: pts[i].x, y: pts[i].y + pts[i].h, vy: 12, r: pts[i].h * .92, life: 1 });
        mass = 0;
      }
    } else {
      mass = Math.max(0, mass - dt * 2.2);
    }
    for (let k = beads.length - 1; k >= 0; k--){
      const b = beads[k];
      b.vy += 1750 * dt;
      b.y  += b.vy * dt;
      b.life -= dt * .62;
      b.r *= (1 - dt * .12);
      if (b.life <= 0) beads.splice(k, 1);
    }
  }

  const moving = Math.abs(target - shown) > .4 || beads.length || mass > .02;
  if (moving) { idle = 0; render(); } else { idle += dt; }

  if (idle > 1.2){ running = false; return; }      /* park until next scroll */
  requestAnimationFrame(frame);
}
function kick(){
  if (running) return;
  running = true; last = performance.now(); idle = 0;
  requestAnimationFrame(frame);
}

/* ══════════════════════ 7 · THE FOOTER FLOOD ══════════════════════
   The oil arrives, spreads across the full width, and hangs pendant
   drips over the columns. Same shading language as the trail.
   ═══════════════════════════════════════════════════════════════════ */
const fSvg  = $('#footerOil');
const fPool = $('#fPool');
const fRim  = $('#fRim');
const fSpec = $('#fSpec');
const fDrips= $('#fDrips');
const fClip = $('#fClipRect');
let drips = [], fW = 0, fH = 0, arriveX = .5;

function buildFooterOil(){
  if (!fSvg || !footer) return;
  fW = footer.offsetWidth; fH = footer.offsetHeight;
  fSvg.setAttribute('width', fW); fSvg.setAttribute('height', fH);
  fSvg.setAttribute('viewBox', `0 0 ${fW} ${fH}`);

  /* where did the trail land? the pool spreads out from exactly there */
  if (pts.length){
    const t = pts[pts.length - 1];
    arriveX = clamp(t.x / Math.max(1, W), .06, .94);
  }

  const lip = Math.max(64, fH * .17);          /* resting depth of the pool */
  let top = `M0 0L${fW} 0L${fW} ${f(lip * .62)}`;
  let edge = '';
  const N = 46;
  for (let i = N; i >= 0; i--){
    const u = i / N, x = u * fW;
    /* deeper directly under the arrival point, shallower at the edges */
    const near = Math.exp(-Math.pow((u - arriveX) * 2.6, 2)) * lip * .5;
    const y = lip * .58 + near + fbm(u * 7.3) * lip * .17 + Math.sin(u * 11.4) * lip * .05;
    edge += `L${f(x)} ${f(y)}`;
  }
  const d = top + edge + 'L0 0Z';
  fPool.setAttribute('d', d);
  fRim .setAttribute('d', d);

  /* specular: a broken highlight riding the pool's lip */
  let sp = '';
  for (let i = 0; i <= N; i++){
    const u = i / N, x = u * fW;
    const near = Math.exp(-Math.pow((u - arriveX) * 2.6, 2)) * lip * .5;
    const y = lip * .58 + near + fbm(u * 7.3) * lip * .17 + Math.sin(u * 11.4) * lip * .05;
    sp += (i ? 'L' : 'M') + f(x) + ' ' + f(y - 5.5 - fbm(u * 5.1) * 2);
  }
  fSpec.setAttribute('d', sp);

  /* nine pendants at irregular x, longest nearest the arrival point */
  drips = [];
  fDrips.textContent = '';
  for (let i = 0; i < 9; i++){
    const u = (i + .5) / 9 + (hash(i * 4.4) - .5) * .055;
    const near = Math.exp(-Math.pow((u - arriveX) * 2.2, 2));
    const len = (46 + hash(i * 7.7) * 92) * (.55 + near * .95);
    const near2 = Math.exp(-Math.pow((u - arriveX) * 2.6, 2)) * lip * .5;
    const y0 = lip * .58 + near2 + fbm(u * 7.3) * lip * .17 + Math.sin(u * 11.4) * lip * .05;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('fill', 'url(#fGrad)');
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    s.setAttribute('fill', 'var(--oil-lit)'); s.setAttribute('opacity', '.3');
    g.appendChild(p); g.appendChild(s); fDrips.appendChild(g);
    drips.push({ x: u * fW, y0: y0 - 6, len, w: 4.4 + hash(i * 2.9) * 4.6, p, s, delay: hash(i * 6.1) * .32 });
  }
  drawDrips(reduce ? 1 : 0);
  if (fClip){ fClip.setAttribute('x', reduce ? 0 : arriveX * fW); fClip.setAttribute('width', reduce ? fW : 0); }
}

/* a pendant: a tapering column that swells into a bead at the bottom */
function drawDrips(prog){
  for (const dr of drips){
    const t = clamp((prog - dr.delay) / (1 - dr.delay || 1), 0, 1);
    const L = dr.len * easeOut(t);
    const w = dr.w, bead = w * (1.35 + .35 * t);
    const yb = dr.y0 + L;
    if (L < 2){ dr.p.setAttribute('d', ''); dr.s.setAttribute('d', ''); continue; }
    dr.p.setAttribute('d',
      `M${f(dr.x - w)} ${f(dr.y0)}`
    + `C${f(dr.x - w * .8)} ${f(dr.y0 + L * .55)} ${f(dr.x - bead)} ${f(yb - bead * 1.2)} ${f(dr.x - bead)} ${f(yb - bead * .35)}`
    + `C${f(dr.x - bead)} ${f(yb + bead * .5)} ${f(dr.x + bead)} ${f(yb + bead * .5)} ${f(dr.x + bead)} ${f(yb - bead * .35)}`
    + `C${f(dr.x + bead)} ${f(yb - bead * 1.2)} ${f(dr.x + w * .8)} ${f(dr.y0 + L * .55)} ${f(dr.x + w)} ${f(dr.y0)}Z`);
    dr.s.setAttribute('d',
      `M${f(dr.x - w * .34)} ${f(dr.y0 + 4)}L${f(dr.x - w * .2)} ${f(yb - bead * 1.1)}`
    + `L${f(dr.x + w * .05)} ${f(yb - bead * 1.1)}L${f(dr.x - w * .1)} ${f(dr.y0 + 4)}Z`);
  }
}

function footerProgress(){
  if (!footer || !fClip) return;
  const r = footer.getBoundingClientRect();
  const p = clamp((innerHeight - r.top) / Math.max(1, innerHeight * .62), 0, 1);
  const half = p * Math.max(arriveX, 1 - arriveX) * fW * 1.08;
  fClip.setAttribute('x', Math.max(0, arriveX * fW - half));
  fClip.setAttribute('width', Math.min(fW, half * 2));
  drawDrips(clamp((p - .32) / .68, 0, 1));
}

/* ══════════════════════════ 8 · WIRING ═══════════════════════════ */
function onScroll(){ measureTarget(); footerProgress(); kick(); }

let rt;
function onResize(){
  clearTimeout(rt);
  rt = setTimeout(() => { build(); measureTarget(); footerProgress(); shown = target; render(); kick(); }, 130);
}

addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onResize);
addEventListener('orientationchange', onResize);

/* nav glass */
const nav = $('#nav');
if (nav){
  const upd = () => nav.classList.toggle('is-stuck', scrollY > 40);
  addEventListener('scroll', upd, { passive: true }); upd();
}

/* reveals */
const revealEls = $$('.r-wipe,.r-rise,.step,.f-row');
function checkReveals(){
  if (reduce){
    revealEls.forEach(el => el.classList.add('is-in'));
    return;
  }
  const vh = window.innerHeight || 800;
  revealEls.forEach(el => {
    if (el.classList.contains('is-in')) return;
    const r = el.getBoundingClientRect();
    if (r.top < vh * 0.95 && r.bottom > 0) {
      el.classList.add('is-in');
    }
  });
  $$('.fig img').forEach(img => {
    if (img.complete && img.naturalWidth) {
      img.classList.add('is-loaded');
      img.closest('.fig')?.classList.add('has-image');
    }
  });
}

const io = new IntersectionObserver(es => {
  es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  });
}, { threshold: 0.05, rootMargin: '0px 0px -2% 0px' });
revealEls.forEach(el => io.observe(el));

/* images: fade in when they actually decode, and drop the fallback label */
$$('.fig img').forEach(img => {
  const done = () => { img.classList.add('is-loaded'); img.closest('.fig')?.classList.add('has-image'); };
  if (img.complete && img.naturalWidth) done();
  else { img.addEventListener('load', done); img.addEventListener('error', () => img.remove()); }
});

/* waitlist */
const form = $('#waitlistForm'), confirmEl = $('#waitlistConfirm');
form?.addEventListener('submit', e => {
  e.preventDefault();
  confirmEl?.classList.add('is-on');
  const input = form.querySelector('input');
  if (input) input.value = '';
});

/* boot — wait for webfonts, since metrics move the anchors */
function boot(){
  build(); measureTarget();
  shown = reduce ? target : 0;
  footerProgress(); render(); kick();
  checkReveals();
}
if (document.fonts?.ready) document.fonts.ready.then(boot); else addEventListener('load', boot);
boot();

/* the document grows as images decode and reveals fire — re-measure once
   things have settled, and whenever the page box actually changes size */
if (window.ResizeObserver){
  let h0 = 0;
  new ResizeObserver(() => {
    const h = page.offsetHeight;
    if (Math.abs(h - h0) > 24){ h0 = h; onResize(); }
  }).observe(page);
}
})();
