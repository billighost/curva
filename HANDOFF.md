# CURVA — handoff brief for the next AI

You are picking up a nearly-finished single-page site. **Read sections 0–4 before
touching a file.** Section 5 is your task list. Section 6 is how to test.

---

## 0. State of play — read this first

**What is built and verified working (by measurement, in a real browser):**

- Complete rewrite of `index.html`, `styles.css`, `oil.js`. The old pink-tinted
  site is preserved at `index.old.backup.html` for reference only.
- The oil engine runs. Measured in Chromium at 1440×900: it generates a ~9,300-char
  filled outline, bbox 362×5,465px, spanning the full 6,658px document.
- The oil's route is measured from real layout anchors and stays inside a 60px-wide
  vertical band (x 1267→1327) for the whole page. No sideways wandering.
- The footer flood draws: pool path present, 9 pendant drips created, reveal clip
  opens to full width (1430px) when the footer is in view.
- All favicons/PNGs/`.ico`/OG card regenerated from a new brand mark via
  `build/make-assets.py`. Nothing pink survives in `assets/`.
- `node --check oil.js` passes. Only console errors are expected 404s for the
  four photo files that do not exist yet (by design — see task 2).

**⚠️ THE BIG GAP — nobody has ever LOOKED at this page.**

Every validation so far has been numeric (`getBBox`, `getBoundingClientRect`,
path string lengths). **No screenshot of the rendered page has ever been taken.**
It is entirely possible that the oil's *shading* reads as a flat brown snake, that
an icon is malformed, that the type is too large, or that a section's spacing is
broken — and none of the checks done so far would have caught any of it.

**Your first task is therefore visual QA (task 1), not new features.** Do not
add anything until you have looked at all six bands at three widths.

---

## 1. What the project is

A **single-page site for Curva**, a Lagos-based body-oil brand (hip & butt
enlargement oil, plus a small counter of related products). Static: three files,
zero dependencies, zero build step for the page itself.

The client's brief, verbatim in intent:

1. Very clean, minimal, **lots of white — and specifically NOT the pink-infused
   white** the old site had. The old palette (`--white:#FBF9F6`,
   `--smoke:#6B4C56`, `--blush:#E4D2CD`) is what they rejected.
2. A **super-realistic oil drip** that runs down the page as you scroll, ideally
   starting from the bottle's mouth, with real liquid blobbiness.
3. When it reaches the footer, the oil should **drip all over the footer** as a
   designed element.
4. Copy that is genuinely good and compelling.
5. **Better icons** — closer to the brand, more visible, clearer than the old ones.
6. Clean images that fit the brand, **plus a markdown file of detailed image
   generation prompts** (art style, lighting, etc.).

Items 1, 2, 3, 5 are built. Item 4 is written but unreviewed. Item 6 is **not
done** — see task 2.

---

## 2. File inventory

```
index.html                 the page: head, icon <symbol> library, 6 bands, footer
styles.css                 all styling. tokens at the top, .rail block near the end
oil.js                     the oil engine (~340 lines, IIFE, no deps)
build/make-assets.py       regenerates every icon + the OG card. run after mark edits
build/og.svg               generated, do not hand-edit
build/maskable.svg         generated, do not hand-edit
assets/favicon.svg         the brand mark, source of truth for all raster icons
assets/favicon.ico         hand-packed (see gotcha 7.3)
assets/{16,32,48,180,192,512 px PNGs}
assets/og-image.png        1200×630, generated
assets/safari-pinned-tab.svg
assets/site.webmanifest
index.old.backup.html      the REJECTED old site. reference only. delete when happy
```

Files referenced by the page but **deliberately absent** (fallback wells show
instead — this is by design, not a bug):
`assets/img-bottle.jpg`, `img-texture.jpg`, and any you add for tasks below.

---

## 3. Locked design decisions — do NOT undo these

These were deliberate and each solves a specific stated problem. If you think one
is wrong, say so in your reply rather than silently reverting it.

| Decision | Why |
|---|---|
| Background is pure `#FFFFFF`. The only tinted band is `--paper-2:#F8F7F5`. | The client explicitly rejected pink-infused white. Warm cream is also the single most common AI-default background — avoid it. |
| **The oil is the only coloured object on the page.** All chroma lives in `--oil-1…5` (`#2B1607`→`#D89A3E`). | Makes the signature element carry 100% of the colour budget. Do not introduce a second accent hue anywhere. |
| Display face is **lowercase Schibsted Grotesk** with `-0.045em` tracking. Not a serif. | A high-contrast serif display is the default move for every oil/beauty brand and reads as templated. |
| **Newsreader italic appears on ~6 words total** (`the new you`, `shaped`, `glam up`). | It is an accent marking the emotional beat, not a second body face. Do not spread it. |
| Icons: 24px box, **1.7 stroke**, full-contrast ink, subjects drawn from this brand. | The old set was 1.4px stock symbols at 60% opacity — that is precisely why they were invisible. Do not thin or fade them. |
| The oil is a **filled closed outline**, never a `stroke`. | A stroke is constant-width and can never bulge, neck or pinch. See section 4. |
| **One oil corridor for the whole page** (a reserved right-hand rail), with every band laid out around it. | See section 4's warning — this replaced an earlier per-section-corridor design that made the oil run sideways at 60°. |
| Content is `z-index:2`, oil is `z1`, tints are `z0`. | Lets the oil be fully opaque and heavily shaded without ever hurting text legibility. |
| Product names and prices are the client's real ones (₦8,000 / ₦10,000 / ₦5,000 / ₦15,000 / ₦13,000). | Do not invent or "improve" prices or product names. |
| The footer carries `A cosmetic body oil — it is not a medicine and makes no medical claims.` | Keep it. Copy must not promise medical or guaranteed physical results. Firmer-*feeling*, fuller-*looking*, nightly ritual — never clinical claims. |

---

## 4. How the oil engine works

Read `oil.js`'s header comment first. The pipeline:

1. **`route()`** — collects every `.oil-a` and `[data-oil-a]` element in document
   order and reads its `getBoundingClientRect()`. Four anchors live *inside the
   hero bottle's `<svg>`* (so they scale exactly with the artwork and the oil
   leaves the real lip at any viewport); after that there is one `.rail` per band
   holding a top and bottom anchor.
2. **`centreline()`** — Catmull-Rom through those anchors, adds a low-frequency
   lateral meander (±11px, deterministic `fbm`), then resamples at a constant
   `STEP = 2.6px` of arc length.
3. **`bake()`** — computes a half-width `h` for every sample. Four terms:
   *accumulation* (3.2px → 11.6px as it descends), *curvature pooling* (oil piles
   up on the inside of a bend), *travelling beads* (irregularly spaced Gaussian
   bumps), *micro-texture* (±6%). Capped at `--gut × 0.44` so it can never reach
   the type. `data-pool` on an anchor forces a fat spot there.
4. **`stringify()`** — pre-formats every point as `L x y` into 64-sample chunks.
   Because the width is baked at layout time and never animates, the settled trail
   is immutable and each frame is just `chunks.slice(0,c).join('')`.
5. **`outline(len)`** — emits `p + n·h` down one side and `p − n·h` back up the
   other as one closed path, plus a `Q` cap and a 30px neck that pinches into the
   head droplet.
6. Shading is six stacked paths sharing that geometry: warm cast shadow (offset +
   blurred), gradient body, dark meniscus rim, caustic edge, specular streak (its
   own offset geometry so the light follows the liquid), then the head bulb.
7. **Head physics**: the tip accumulates `mass` while at rest; over threshold it
   emits a free bead that falls under gravity (`beads[]`, max 5). The bulb
   stretches with velocity.
8. **rAF parks itself** after 1.2s idle and re-`kick()`s on scroll.

### ⚠️ The layout trap you must not re-introduce

The first version gave **each section its own corridor in a different column**
(hero right, product centre, collection left…). That looks fine on paper and is
catastrophic in practice: if each band's corridor is vertical, every horizontal
move is forced into the short padding gap *between* bands — measured at 454px of
horizontal travel across 317px of vertical, a ~55° slope. Oil does not run
sideways.

The fix was **one rail for the whole page**, with `--shift` per band giving only
a few tens of px of serpentine. If you ever move a corridor, re-run the slope
check in section 6.4 and keep the max under ~25°.

---

## 5. Remaining work — in priority order

### Task 1 — Visual QA pass (**do this first, before anything else**)

Screenshot and actually inspect at **1440×900, 834×1112, 390×844**. For each,
check every band: hero, statement, product, collection, ritual, closing, footer.

Specifically confirm:

- [ ] **The oil reads as liquid, not a brown snake.** You should be able to see:
      distinct bulges and pinched necks along its length; a bright specular streak
      running down one side; a dark rim at the edges; a warm shadow on the paper;
      a rounded droplet at the leading tip.
- [ ] The oil visibly **emerges from the bottle's lip**, runs down the outside of
      the neck (half-clipped behind the glass, which is intentional), gathers at
      the widest point of the shoulder, and lets go there.
- [ ] The oil **never overlaps any text** at any width.
- [ ] The **footer is genuinely flooded** — a pool across the full width, deeper
      under the point where the trail arrives, with pendant drips hanging over the
      columns. Footer text must stay legible.
- [ ] All **17 icon symbols** render correctly and are clearly visible: `i-mark`,
      `i-palm`, `i-lift`, `i-night`, `i-scoop`, `i-bottle`, `i-sachet`, `i-lift2`,
      `i-combo`, `i-face`, `i-arrow`, `i-arrow-down`, `i-check`, `i-wa`, `i-ig`,
      `i-mail`, `i-pin`. (`i-arrow-down` is defined but currently unreferenced —
      either use it or drop it in task 5.) The `i-face` (face profile + crescent)
      and `i-combo` are the two most likely to be malformed — check them closely.
- [ ] The **two image fallback wells** look like intentional design (amber wash +
      watermarked mark + a small uppercase label), not broken images.
- [ ] Type scale, spacing and line lengths look right. The hero `.display` is
      `clamp(2.85rem, 8.6vw, 7.6rem)` — check it does not overflow at 390px.
- [ ] Right-hand rail padding (`--rail-w`) does not leave the layout looking
      lopsided or the content cramped at tablet width.

Fix whatever you find. Prefer adjusting `bake()`'s width terms and the shading
opacities in `index.html`'s `<defs>` over restructuring anything.

### Task 2 — Write `IMAGES.md` (a client deliverable, currently missing)

The page wires **four** image slots with `data-label` fallbacks. Find them by
searching `index.html` for `class="fig`:

| # | Where | Ratio | `src` | Subject |
|---|---|---|---|---|
| 1 | product band | 4/5 | `assets/img-bottle.jpg` | The bottle, hero product shot |
| 2 | statement band | 3/2 | `assets/img-texture.jpg` | Macro: a bead of oil on skin |
| 3 | *not yet added* | 16/9 | `assets/img-counter.jpg` | Flat-lay of the full counter |
| 4 | *not yet added* | 16/9 | `assets/img-ritual.jpg` | Hands, warm oil, the massage |

Slots 3 and 4 need to be **added to the markup** (collection head and ritual head
respectively) following the exact pattern of slots 1 and 2 — copy the `<figure
class="fig r-169" data-label="…">` block including the `.fig-mark` watermark svg.

Then write `IMAGES.md` containing, for **each** of the four slots plus the OG card:

- The slot's filename, aspect ratio and rendered size.
- A **long, specific generation prompt** covering: subject and composition; camera
  (focal length, aperture, distance, angle); **lighting** (direction, quality,
  single-source vs fill, colour temperature); background and surface; colour
  palette **locked to the brand tokens** (`#FFFFFF` ground, amber `#8A4F16`→
  `#D89A3E`, warm-neutral ink `#14100E`); mood; post-processing/grade.
- An explicit **negative prompt** (no pink, no rose, no dusty mauve, no cream
  background, no text, no watermark, no plastic CGI sheen, no over-smoothed skin).
- Notes on **skin-tone representation**: the brand is Nigerian; deep and rich
  skin tones should be the default across the imagery, not an afterthought.
- A one-line note on what the shot must communicate.

Match the art direction that already exists: pure white ground, one warm
directional light, generous negative space, amber as the only saturated colour,
nothing styled to look like stock photography.

### Task 3 — Accessibility and motion checks

- [ ] Tab through the whole page. Every link/button/input must show a visible
      `2px solid var(--oil-3)` focus ring. The skip link must appear on first Tab.
- [ ] Emulate `prefers-reduced-motion: reduce`. The oil must render **fully
      drawn and static** (`shown = target`, no beads, no rAF churn), reveals must
      be visible with no transform, and the footer flood must show its final state.
- [ ] Check text contrast on the dark closing/footer (`--dark-ink:#F2ECE4` on
      `--dark:#0F0A06`) and that `--ink-3:#938C85` is only ever used on small
      uppercase labels, never body copy.
- [ ] Confirm the waitlist form: submitting shows the `#waitlistConfirm` status
      line and clears the input. It has `role="status"` — verify it announces.

### Task 4 — Performance sanity

- [ ] Scroll the full page and confirm the oil holds ~60fps. If it does not, the
      first lever is raising `STEP` from 2.6 to 3.5 in `oil.js` (fewer samples),
      the second is increasing `CHUNK`.
- [ ] Confirm the rAF loop actually parks: after 2s of no scrolling, no frames
      should be running. Check with the Performance panel or by logging in `frame()`.

### Task 5 — Cleanup

- [ ] Delete `index.old.backup.html` once the new page is signed off.
- [ ] Consider whether `--dark-2`, `--oil-1`, `.icon-well` `::after`, `.oil-a.m`
      and `#i-arrow-down` are still used; remove genuinely dead tokens.

---

## 6. How to run and test

### 6.1 Serve it

```bash
cd /c/Users/bb201/Documents/curva
python -m http.server 8899 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8899/index.html`. **You must use a server** — the
page uses `<use href="#…">` and `fetch`-free JS, but `file://` will still skew
font loading and the 404 behaviour. Run the server in the background; note that
a background shell here does not survive between tool calls in some harnesses, so
re-start it if navigation fails.

### 6.2 Syntax gate

```bash
node --check oil.js
python -c "import io;io.open('index.html',encoding='utf-8').read()"
```

### 6.3 Regenerate icons / OG card (only if you change the mark or bottle)

```bash
python build/make-assets.py
```

Needs `rsvg-convert` on PATH. **Do not use `convert`** — see gotcha 7.3.

### 6.4 The oil route slope check (run after ANY layout change)

Paste into the browser console, or run via Playwright `evaluate`:

```js
(() => {
  const A = [...document.querySelectorAll('.oil-a,[data-oil-a]')]
    .map(a => { const r = a.getBoundingClientRect();
                return [Math.round(r.left+scrollX), Math.round(r.top+scrollY)]; });
  // mirror oil.js's own filter: anchors closer than 4px in y are dropped
  const K = []; for (const p of A) if (!K.length || p[1] > K.at(-1)[1] + 4) K.push(p);
  let worst = 0, pair = null;
  for (let i = 1; i < K.length; i++) {
    const d = Math.atan2(Math.abs(K[i][0]-K[i-1][0]), Math.max(K[i][1]-K[i-1][1],1)) * 180/Math.PI;
    if (d > worst) { worst = d; pair = [K[i-1], K[i]]; }
  }
  const bb = document.getElementById('oilBody').getBBox();
  return { effectiveAnchors: K, maxSlopeDeg: +worst.toFixed(1), worstPair: pair,
           bbox: [bb.x|0, bb.y|0, bb.width|0, bb.height|0] };
})()
```

**Pass criteria:** `maxSlopeDeg` under ~25. Above that the oil is visibly running
sideways and you have re-introduced the trap in section 4.

### 6.5 Footer flood check

Scroll to the bottom, wait ~2s, then:

```js
({ pool: (document.getElementById('fPool').getAttribute('d')||'').length,
   drips: document.getElementById('fDrips').children.length,
   clipW: document.getElementById('fClipRect').getAttribute('width') })
```

Expect `pool` > 400 chars, `drips` === 9, `clipW` ≈ the footer's full width.

---

## 7. Known risks and gotchas

**7.1 — `route()` silently drops abutting anchors.** The filter
`p.y > prev.y + 4` exists so the spline cannot fold back on itself. But adjacent
bands share an edge, so a band's bottom anchor and the next band's top anchor sit
at the *same* document y — the second is always discarded, along with its
`data-pool` value. This is currently harmless (the serpentine still alternates)
but it means **half your `data-pool` hints are being ignored**. If you want a fat
pool at a specific section join, put it on the band's *bottom* anchor, not the
next band's top.

**7.2 — Everything is validated numerically, nothing visually.** See section 0.

**7.3 — `convert` on Windows is NOT ImageMagick.** It is the FAT→NTFS volume
converter and will fail with `Invalid Parameter`. `build/make-assets.py` therefore
packs the `.ico` by hand (6-byte ICONDIR + a 16-byte entry per image + the PNGs
verbatim). `rsvg-convert` *is* real and is what does the rasterising.

**7.4 — Python stdout here is cp1252.** Printing `→`, `✓` or any non-ASCII from a
Python heredoc raises `UnicodeEncodeError` **after** side effects have already
been written to disk. Set `PYTHONIOENCODING=utf-8` or keep prints ASCII-only.

**7.5 — `/tmp` does not persist between tool calls.** Write intermediates into
`build/`.

**7.6 — Icon fills are presentation attributes, on purpose.** The drop shapes use
`fill="currentColor" stroke="none"` inline rather than a `.drop-fill` class,
because those paths live in `<symbol>` and arrive via `<use>`, and document CSS
class selectors are not reliably matched inside a use-shadow tree. Inherited
properties (`fill`/`stroke` from `.icon`) do cross the boundary; class selectors
may not. **Do not "tidy" these back into CSS classes.**

**7.7 — Tinted sections must stay transparent.** `.product`, `.ritual` and
`.closing` carry `data-tint` and their colour is painted by `#tintLayer` at `z0`.
If you give one of them a real `background`, it will paint at `z2` and hide the
oil. There is a rule at the end of `styles.css` enforcing this.

**7.8 — Fonts come from Google Fonts.** Offline, the page falls back to system
sans + Georgia italic and the layout shifts. `oil.js` waits on
`document.fonts.ready` before measuring, and re-measures via `ResizeObserver`
when the page height changes by >24px.

**7.9 — The oil rail widens the right padding of every band** via `--rail-w`.
If a band ever looks oddly narrow on the right, that is why — it is intentional.

---

## 8. Definition of done

1. All of task 1's checkboxes tick, with screenshots at three widths.
2. `IMAGES.md` exists with five fully specified prompts, and slots 3 and 4 are
   wired into the markup.
3. Task 3's accessibility and reduced-motion checks pass.
4. `maxSlopeDeg` < 25 and the footer flood check passes.
5. No console errors other than 404s for image files the client has not supplied.
6. `index.old.backup.html` deleted.

Report honestly: if the oil still does not look convincing after your QA pass,
say so plainly and describe what it actually looks like, rather than declaring
success. The whole point of this build is that the liquid is believable.
