# Curva — Scroll Feel Work Order

**Audience:** an AI coding agent (any capability level) or an engineer.
**Mode:** execute steps in order. Verify after each. Do not improvise.
**Scope:** refinement of what exists. No redesign, no new sections, no new copy, no new dependencies, no new files except tests.

---

## HOW TO USE THIS DOCUMENT

This is a work order, not an inspiration board. It is written so that following it
literally produces a good result.

**Rules of engagement — read all six:**

1. **Do the steps in numbered order.** Step 1 → 2 → 3. Later steps assume earlier ones landed.
2. **After every step, run its VERIFY block and compare against EXPECT.** If it doesn't
   match, fix that step before moving on. Do not batch steps and verify at the end.
3. **Every `FIND` string below is copied verbatim from the current source.** Search for it
   exactly. If a `FIND` string is not present, **stop and report** — the file has drifted
   from this brief and guessing will break the oil.
4. **All numbers in this document are final.** They are derived from constants already in
   the codebase. Do not "improve" them. Where taste is genuinely required, the step says
   so explicitly and gives a range.
5. **Do not add anything not in this document.** If you have an idea, write it at the
   bottom under "Proposed" and leave it unimplemented.
6. **If you are a small or fast model** (Flash-class, Haiku-class): do **Steps 1–6 only**,
   run the full verification in §7, and stop. Steps 7+ require visual judgement. Shipping
   Steps 1–6 correctly is a complete, successful job. Say clearly that you stopped there.

**Rollback:** all edits are confined to `oil.js` and `styles.css`. `git diff` before you
start; `git checkout -- oil.js styles.css` reverts everything.

---

## 1. GROUND TRUTH — the code as it actually is

Do not trust your memory of this codebase. These are the real facts. Several are
counterintuitive and are the reason this document exists.

### 1.1 Files

| File | ~Lines | Owns |
|---|---|---|
| `index.html` | 521 | 7 bands, an SVG `<symbol>` sprite, the grain filter |
| `styles.css` | 795 | palette law, z-layer stack, rails, the 2 reveal languages |
| `oil.js` | 611 | the oil: routing, baking, spring, beads, tints, footer flood |
| `hero-layout.spec.js` | — | Playwright layout assertions. Extend; never weaken. |

**Bands in order:** `hero` → `statement` → `product` (`#oil`, tinted, `data-rail="left"`)
→ `collection` (`#counter`) → `ritual` → `closing` (dark) → `footer` (dark).

### 1.2 The palette law — absolute

From the top of `styles.css`: the page is paper-white and **the oil is the only coloured
object.** All saturation belongs to the amber ramp `--oil-1 … --oil-lit`. Ink is
warm-neutral (`--ink`, `--ink-2`, `--ink-3`); lines are `--line`, `--line-2`.
**You may not introduce a new hue. Not one. No exceptions.**

### 1.3 Type

Schibsted Grotesk 400/500/600 for everything. Newsreader **italic only**, loaded
*variable* (`ital, opsz 6..72, wght 200..400`), used as an accent on ~6 words in the whole
page. Display is lowercase with `-.045em` tracking. **Do not add a font.**

### 1.4 The z-layer stack

`z0` tints → `z1` photography (oil runs *over* it) → `z2` the oil → `z3` text (the oil is
never allowed to cover text). Text wrappers get `z-index:3` individually and by hand;
`.inner` is deliberately `z-index:auto`. **New text block ⇒ give it `z3` manually.**

### 1.5 Two reveal languages, and only two

`styles.css` says so in a comment. Honour it.

- `.r-wipe` — `clip-path` brushed left→right. **Hero only.**
- `.r-rise` — 26px translate + fade. **Everything else.**
- Stagger is `[data-d="1..4"]`. **There is no fifth delay.**

### 1.6 The motion model — the part most people get wrong

There is **exactly one** `requestAnimationFrame` loop: `frame()` in `oil.js`, started by
`kick()`. Single scroll entry point:

```js
function onScroll(){ measureTarget(); footerProgress(); kick(); }
```

Inside `frame()`:

```js
const prev = shown;
shown += (target - shown) * (reduce ? 1 : .11);   /* liquid lag */
speed = Math.abs(shown - prev) / Math.max(dt, .001) * .016;
```

**Three facts that change how you must write code here:**

**(a) `speed` is already normalized and always positive.** It is *not* px/frame. The
`* .016` scaling means `speed ≈ 29` for a brisk 30px/frame scroll. The codebase's own
"this is fast" reference is **26** (`render()` does `clamp(speed / 26, 0, 1)`), and its
"this is at rest" threshold is **1.4**. Use those numbers. Never write `Math.abs(speed)` —
it is already absolute.

**(b) The loop PARKS.** `render()` is only called when `moving` is true, and the loop
returns entirely after 1.2s of idle:

```js
const moving = Math.abs(target - shown) > .4 || beads.length || mass > .02;
if (moving) { idle = 0; render(); } else { idle += dt; }
if (idle > 1.2){ running = false; return; }      /* park until next scroll */
```

> **This is the #1 bug you will introduce.** Any new state that continues to change
> *after* scrolling stops must be added to the `moving` condition, or it will freeze
> mid-animation and the page will look broken. Step 4 handles this. Do not skip it.

**(c) `mass` is the "hanging at rest" signal.** It accumulates at `dt * .55` while
`speed < 1.4`, and burns off at `dt * 2.2` while moving. `render()` already uses it to
swell the head droplet: `const r = o.th * (1.45 + mass * .5);`.

### 1.7 What ALREADY EXISTS — do not rebuild these

A previous pass built more than you'd guess. Re-adding any of these creates double
behaviour that looks like a glitch.

| Already built | Where | Consequence for you |
|---|---|---|
| Head droplet **already stretches with velocity** | `render()`: `const sN = clamp(speed / 26, 0, 1); … bulbPath(r, sN)` | Don't add head stretch. Step 2 extends this to the ribbon *body*. |
| Head droplet **already swells at rest** | `render()`: `o.th * (1.45 + mass * .5)` | Don't add a swell timer. Reuse `mass`. |
| **Bead shedding already exists** | `frame()`: `mass > 1 && beads.length < 5` → `beads.push(...)` | It is a *resting drip*, not a deceleration shed. **Do not add jerk-based bead spawning** — you'd get double emission. Leave beads alone entirely. |
| Bead **gravity, fade, shrink** | `frame()`: `b.vy += 1750*dt` etc. | Complete. Don't touch. |
| Tip **neck into the head droplet** | `outline()`: `back < 30 ? lerp(.38, 1, …)` | Local to the last 30px. Step 2's neck is global and multiplies with it. Fine. |
| Ritual steps **already warm on reveal** | `styles.css`: `.step.is-in .icon-well{ border-color:var(--oil-4); color:var(--oil-2); }` | Binary on/off. Step 9 makes it progressive. Don't duplicate the rule. |
| Ritual `01 / 02 / 03` numbering | `.step-n num` | The content genuinely *is* a 3-step nightly sequence, so the numbering encodes real information. **It is justified — leave it.** |
| Hero forced visible on load | `oil.js`, after `revealEls.forEach(el => io.observe(el))` | Deliberate: the hero is the entrance, not a scroll reward. **Keep it.** |
| Footer flood + drips | `buildFooterOil()`, `footerProgress()`, `drawDrips()` | Complete. Don't touch. |
| Image fade on decode | `.fig img.is-loaded` | Step 10 converts it to a wipe. Don't add a second fade. |

### 1.8 The idea, in one sentence

One continuous physical substance — warm amber oil — leaves a bottle in the hero and does
not stop until it floods the footer.

**THE ONE RULE:** every addition must be justifiable either as **the physics of that oil**
or as **typographic craft**. If it is neither, it does not go in. When unsure, ask: *would
a real bead of oil do this?* If no, cut it.

---

## 2. THE GOAL OF THIS PASS

The oil currently follows the scrollbar faithfully but *indifferently*. After this pass it
should feel like **a substance that notices your hand**: it thins when you rush it and
relaxes when you stop.

The head droplet already does this. The **ribbon body does not** — it is a constant width
regardless of how fast the oil is moving, which is why the page reads as a well-drawn
animation rather than a liquid.

**Steps 1–6 fix exactly that.** That is the signature. Everything after Step 6 is quiet
supporting craft and is optional.

Physics being modelled: continuity. In a real falling stream, faster flow means a thinner
stream — water from a tap necks down as it accelerates. Surface tension resists, so the
change is not instant, and volume is conserved (thinner ⇒ longer).

---

## 3. STEPS 1–6 — THE SIGNATURE (do these; they are the job)

### STEP 1 — Add the `flow` state variable

**File:** `oil.js`

**FIND** (verbatim, appears once, in the `5 · RENDER` section):

```js
let shown = 0, target = 0, speed = 0, mass = 0;
const beads = [];
```

**REPLACE WITH:**

```js
let shown = 0, target = 0, speed = 0, mass = 0;
const beads = [];

/* flow: 0 = at rest, 1 = moving fast enough to neck the ribbon.
   Continuity says a faster stream is a thinner one, so the body of the oil
   narrows as it accelerates and recovers lazily when it stops. The head
   droplet already does this via `sN` in render(); this is the same idea
   applied to the whole ribbon so the two agree.
   FLOW_REF is 26 to match render()'s own `speed / 26` reference — the head
   and the body must share one definition of "fast" or they will disagree
   visibly at the tip. */
let flow = 0;
const FLOW_REF = 26;
const FLOW_ATTACK = .22;   /* necks quickly  */
const FLOW_RELEASE = .055; /* recovers slowly */
```

**Why:** one shared definition of "fast", expressed in the file's existing units.

**VERIFY:** `grep -n "FLOW_REF" oil.js`
**EXPECT:** one line, in the `5 · RENDER` section.

---

### STEP 2 — Drive `flow` from `speed` inside the existing loop

**File:** `oil.js`

**FIND** (verbatim, in `frame()`):

```js
  speed = Math.abs(shown - prev) / Math.max(dt, .001) * .016;
```

**REPLACE WITH:**

```js
  speed = Math.abs(shown - prev) / Math.max(dt, .001) * .016;

  /* asymmetric smoothing: attack fast, release slow. A single jittery wheel
     event must not be able to flicker the ribbon's width. `speed` is already
     absolute, so no Math.abs here. */
  const wantFlow = reduce ? 0 : clamp(speed / FLOW_REF, 0, 1);
  flow = lerp(flow, wantFlow, wantFlow > flow ? FLOW_ATTACK : FLOW_RELEASE);
```

**Why:** hooks the existing loop instead of adding a listener. `reduce` gates it to 0
permanently, satisfying reduced-motion at the source.

**VERIFY:** `grep -c "requestAnimationFrame" oil.js`
**EXPECT:** `3` — and confirm by eye they are only: two inside `frame`/`kick`, and the one
in the hero reveal block. **If this number went up, you added a loop. Undo it.**

---

### STEP 3 — Neck the ribbon body

**File:** `oil.js`

This is the actual visible change. Two edits, both required, or the highlight will
detach from the body.

**3a — FIND** (verbatim, in `outline()`):

```js
    const back = (len - i * STEP);
    const neck = back < 30 ? lerp(.38, 1, clamp(back / 30, 0, 1)) : 1;
    const h = p.h * neck;
```

**REPLACE WITH:**

```js
    const back = (len - i * STEP);
    const neck = back < 30 ? lerp(.38, 1, clamp(back / 30, 0, 1)) : 1;
    /* flowNeck thins the whole ribbon with velocity; `mass` lets it swell a
       few percent while it hangs at rest, reusing the signal render() already
       uses for the head droplet rather than inventing a second timer. */
    const h = p.h * neck * flowNeck;
```

**3b — FIND** (verbatim, in `sheen()`):

```js
    const off = p.h * inset * side, w = Math.max(.45, p.h * wid);
```

**REPLACE WITH:**

```js
    const hh = p.h * flowNeck;
    const off = hh * inset * side, w = Math.max(.45, hh * wid);
```

**3c — Define `flowNeck` once, at module scope.** FIND:

```js
let flow = 0;
const FLOW_REF = 26;
```

**REPLACE WITH:**

```js
let flow = 0;
let flowNeck = 1;          /* the width multiplier outline() and sheen() read */
const FLOW_REF = 26;
```

**3d — Compute it once per frame.** FIND (verbatim, first line of `render()`):

```js
function render(){
  if (!pts.length) return;
  const o = outline(shown);
```

**REPLACE WITH:**

```js
function render(){
  if (!pts.length) return;
  /* NECK_MAX 0.30 = at most 30% thinner at full speed. Above ~0.35 the ribbon
     visibly breaks into a thread and reads as a bug, not as liquid.
     SWELL 0.045 = under 5% fatter while hanging. Deliberately near-subliminal. */
  const NECK_MAX = .30, SWELL = .045;
  flowNeck = 1 - NECK_MAX * flow + SWELL * clamp(mass, 0, 1);
  const o = outline(shown);
```

**Why 3b exists:** `pSpec` and `pCaust` are offset from the centreline by `p.h`. If only
`outline()` necks, the specular streak floats outside the thinner body. Both must scale.

**VERIFY:** `grep -c "flowNeck" oil.js`
**EXPECT:** `5` (declaration, assignment in `render`, one in `outline`, two in `sheen`).

---

### STEP 4 — Keep the loop alive while `flow` decays ← DO NOT SKIP

**File:** `oil.js`

Without this, you stop scrolling, the loop parks after 1.2s, and the ribbon **freezes
half-necked**. The page will look broken and it will look like *your* bug.

**FIND** (verbatim, in `frame()`):

```js
  const moving = Math.abs(target - shown) > .4 || beads.length || mass > .02;
```

**REPLACE WITH:**

```js
  /* `flow` keeps changing after the scroll stops — it releases slowly on
     purpose. It must therefore count as motion, or the loop parks and the
     ribbon freezes mid-neck. */
  const moving = Math.abs(target - shown) > .4 || beads.length || mass > .02 || flow > .01;
```

**VERIFY:** `grep -n "flow > .01" oil.js`
**EXPECT:** exactly one line, inside `frame()`.

---

### STEP 5 — Confirm reduced motion is inert

No edit if Step 2 was done correctly — `wantFlow` is already gated by `reduce`. Confirm:

**VERIFY:** `grep -n "reduce ? 0 : clamp(speed / FLOW_REF" oil.js`
**EXPECT:** one line. With reduced motion on, `wantFlow` is always 0, `flow` decays to 0,
`flowNeck` → `1 + .045*mass`, and the ribbon is effectively static. Correct.

---

### STEP 6 — Prove it works (automated, not by eye)

Create `flow-probe.js` in the project root. This drives real scrolling and asserts the
ribbon width actually responds — a claim you cannot make by reading code.

```js
const { chromium } = require('C:/Users/bb201/AppData/Roaming/npm/node_modules/playwright/index.js');
// Measures the oil body's bounding width at rest vs. mid-fast-scroll.
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('file:///C:/Users/bb201/Documents/curva/index.html');
  await p.waitForTimeout(1200);

  const widthOf = () => p.evaluate(() => {
    const bb = document.querySelector('#oilBody').getBBox();
    return +bb.width.toFixed(2);
  });

  // settle at a mid-page position so the ribbon is long and measurable
  await p.evaluate(() => window.scrollTo(0, 2200));
  await p.waitForTimeout(1500);
  const atRest = await widthOf();

  // fast continuous scroll, sampling while still in motion
  let narrowest = Infinity;
  for (let i = 0; i < 26; i++) {
    await p.evaluate(y => window.scrollTo(0, y), 2200 + i * 190);
    await p.waitForTimeout(16);
    narrowest = Math.min(narrowest, await widthOf());
  }
  await p.waitForTimeout(2500);            // let it park, then confirm recovery
  await p.evaluate(() => window.scrollTo(0, 2200));
  await p.waitForTimeout(1800);
  const recovered = await widthOf();

  const necked = (1 - narrowest / atRest) * 100;
  console.log(`rest=${atRest}  fastest=${narrowest}  recovered=${recovered}`);
  console.log(`necked by ${necked.toFixed(1)}%`);

  let fail = 0;
  const ck = (n, ok, d) => { console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}  ${d}`); if (!ok) fail++; };
  ck('ribbon necks under fast scroll', necked > 4, `${necked.toFixed(1)}% (want >4%)`);
  ck('neck stays subtle',              necked < 34, `${necked.toFixed(1)}% (want <34%)`);
  ck('ribbon recovers after stopping', Math.abs(recovered - atRest) / atRest < 0.06,
     `rest=${atRest} recovered=${recovered}`);   // catches the frozen-neck bug from Step 4
  await b.close();
  console.log(fail ? `\n${fail} FAILING` : '\n*** FLOW OK ***');
  process.exit(fail ? 1 : 0);
})();
```

**RUN:** `node flow-probe.js`
**EXPECT:** `*** FLOW OK ***`

**Interpreting failures:**

| Symptom | Cause | Fix |
|---|---|---|
| `necked by 0.0%` | `flowNeck` not reaching `outline()` | Re-check Step 3a/3c/3d |
| ribbon does **not** recover | loop parked mid-neck | **Step 4 was skipped** |
| necked > 34% | `NECK_MAX` edited | set it back to `.30` |
| specular streak floats outside the body | Step 3b skipped | do 3b |

**Then run the existing layout suite — it must still pass unchanged:**

**RUN:** `node hero-layout.spec.js`
**EXPECT:** `*** ALL PASS ***` (9 assertions × 5 viewports)

> ### ✋ IF YOU ARE A FAST / SMALL MODEL, STOP HERE.
> Report: the diff, both verification outputs, and that you stopped at Step 6 by
> instruction. This is a complete and successful job. Do not attempt Steps 7+.

---

## 4. STEPS 7–12 — QUIET CRAFT (optional; require visual judgement)

Each is small. Each states its risk. Do them one at a time, in order, and re-run both
verifications after each. **Skipping all of these is an acceptable outcome.**

### STEP 7 — The logo mark becomes the progress indicator

`#i-mark` is described in the source as "a C that opens to let a drop fall out of it", and
its inner drop path already uses `fill="currentColor"`. Fill that drop in proportion to
page scroll progress.

**Why:** a page whose entire subject is a filling, flowing substance must not wear a
generic 3px progress bar across its forehead. The mark filling with oil *is* the progress
indicator, and it cannot be mistaken for any other site's.

**How:** compute page progress inside the existing `onScroll()` — do **not** add a
listener. `footerProgress()` is footer-local and is the wrong scalar.

```js
// inside onScroll(), alongside the existing calls:
const prog = clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight), 0, 1);
document.documentElement.style.setProperty('--read', prog.toFixed(3));
```

Then in CSS, interpolate the nav mark's drop between `--ink` and `--oil-4` using
`--read`, or drive a `clipPath` height.

**Risk:** `#i-mark` is reused via `<use>` elsewhere. A `clipPath` with a fixed `id` will
apply to **every** instance. Scope it to `.nav .brand-mark` only. Prefer the `color`
approach — it cannot leak.

### STEP 8 — The serif accent settles its optical size

Newsreader is loaded variable with real `opsz 6..72` and `wght 200..400` axes. On reveal,
animate the accent words from `font-variation-settings:'opsz' 20,'wght' 240` to
`'opsz' 60,'wght' 300`. The letterforms *ripen* instead of fading.

**Why:** craft only this type pairing affords. Templates never touch variable axes.

**Risk:** `font-variation-settings` is **not additive** — restate *every* axis in both
states or the omitted one snaps to its default. Verify in Safari; fall back to plain
opacity if the axis doesn't animate.

### STEP 9 — Make the ritual's warming progressive

`.step.is-in .icon-well` already warms binary on reveal. Make it *cumulative* so the
section is visibly warmer at step 03 than at step 01 — interpolate the marker from
`--ink-3` toward `--oil-3` by index.

**Why:** structure encoding content. The section is about warming up, so it warms up.

**Risk:** stay inside the amber ramp. Do not add a hue. Do not duplicate the existing
`.is-in` rule — extend it.

### STEP 10 — Give images the page's existing gesture

`.fig img.is-loaded` fades. Convert it to the same left→right `clip-path` wipe as
`.r-wipe`, in the oil's direction of travel, so the page has **one** gesture applied
consistently rather than two unrelated ones.

**This is a consolidation, not an addition.** Do not create a third reveal language.

### STEP 11 — Retire the scroll cue once obeyed

`.hero-cue .rule::after` loops `@keyframes cue` forever. It is an instruction; once
followed it is noise burning compositor time below the fold. Fade the cue out permanently
past ~40vh and stop the animation.

### STEP 12 — Keyboard parity for reveals

Tabbing into a not-yet-revealed band focuses a control at `opacity:0`. On `focusin`, add
`is-in` to the target's reveal ancestors. This is a real accessibility bug, not polish.

---

## 5. FORBIDDEN — every one of these is a known tell

If you find yourself rationalising one, re-read §1.8.

- **Any new hue.** No teal, sage, or vermilion "pop". The amber ramp is the palette.
- **A second smooth-scroll layer** (Lenis, Locomotive, `scroll-behavior` hacks). The oil
  runs its own spring against real scroll position; a smoothing library fights it and the
  ribbon visibly lags and rubber-bands. **This is the single worst thing you could do here.**
- **New `scroll` listeners or new `rAF` loops.** There is one loop and one `onScroll`. Hook them.
- **Jerk-based bead spawning.** Beads already exist (§1.7). You would get double emission.
- **Head-droplet velocity stretch.** Already exists as `sN` (§1.7).
- **Animating `letter-spacing`.** It is a layout property: reflows every frame, causes CLS,
  can re-wrap the headline mid-animation. Animate per-word `transform: translateX()` instead,
  or leave tracking alone — defensible, since `.r-wipe` already carries the hero.
- **Animating `feTurbulence baseFrequency`** on `.grain`. It re-rasterises a full-viewport
  filter every frame and tanks mid-range phones. If the paper must breathe, animate the
  `<rect>`'s **opacity** between `.018` and `.024` over ~18s. Never the frequency.
- **Glassmorphism / `backdrop-filter` cards.**
- **Gradient text**, text shadows, glows on type.
- **Count-up numbers**, odometers, stat tiles.
- **A top progress bar.** See Step 7 for the version that belongs here.
- **3D tilt, magnetic buttons, cursor-follower rings or trails.**
- **Marquees**, infinite logo belts.
- **`border-radius` creep.** This page is square on purpose.
- **Bounce / overshoot easings** (`cubic-bezier` outside 0–1, spring libraries). The
  vocabulary is `--ease: cubic-bezier(.22,.8,.2,1)` and `--ease-soft: cubic-bezier(.4,0,.2,1)`.
- **A fifth `data-d` delay**, or `.r-rise` sprinkled onto elements that lack it. More
  staggered fade-ups is the most common way a good page becomes a generic one.
- **Emoji.** Anywhere.
- **New dependencies.** Zero.

---

## 6. GOTCHAS

### 6.1 Parallax silently breaks the oil

`route()` records every `.oil-a` / `[data-oil-a]` page position, then `bake()` caches the
path into chunked strings (`Lstr`/`Rstr`). **`transform` an ancestor of an anchor and the
anchor moves while the cached path does not** — the oil visibly detaches from the bottle.

Hero anchors live inside `.hero-bottle-wrap`.

- **Safe:** parallax on elements containing no anchors (copy blocks, `.statement-art`).
- **Unsafe:** `.hero-bottle-wrap`, `.hero-stage`, any `.rail`.
- Must move an anchored element? Apply the *identical* transform to `#oilWrap`. **Never
  call `build()` per frame** — it re-samples the whole page path; it is a resize-time
  operation only.
- Cap any parallax at **8px**. Beyond that it stops being atmosphere.

### 6.2 Don't re-bake per frame

`centreline()`/`bake()`/`route()` are arc-length sampled at `STEP = 2.6px` and cached in
`CHUNK = 64` blocks specifically so settled geometry costs nothing per frame. Width
modulation belongs in `outline()`/`sheen()` — which is exactly what Step 3 does. Never
put per-frame work in `bake()`.

### 6.3 Route new reveals through the existing collection

`checkReveals()` gates on `r.top < vh * 0.95`, with an `IntersectionObserver` alongside.
The hero is separately forced visible on load — deliberate, keep it. New reveals go
through the existing `revealEls` array. Do not build a parallel system.

### 6.4 `will-change` discipline

Only on things animating *now*; remove after. A blanket `will-change: transform` on every
band costs more memory than it saves and can *lower* frame rate on mobile.

### 6.5 `svh`, not `vh`

Mobile sizing uses `svh` deliberately (`100svh`, `46svh`) so collapsing browser chrome
doesn't resize the hero mid-scroll. Keep using `svh`.

### 6.6 Reduced motion is a hard gate

`styles.css` collapses `.r-wipe`/`.r-rise` and clamps durations under
`@media (prefers-reduced-motion: reduce)`. `oil.js` reads `reduce` near line 22. Every
effect must sit behind one of those gates. Test by toggling the OS setting, not by reading.

---

## 7. FINAL ACCEPTANCE

Verify by running things. Do not claim any of these from reading the code.

**Performance**

- [ ] `grep -c "requestAnimationFrame" oil.js` → `3`. No new loops.
- [ ] `grep -c "addEventListener('scroll'" oil.js` → `2` (the pre-existing count). If it
      rose, you added a listener. Remove it and hook `onScroll()` instead.
- [ ] ≥55fps scroll-flicking the full page at 4× CPU throttle (DevTools Performance panel).
- [ ] No purple "Layout" bars during scroll — zero forced reflows in the render loop.

**Correctness**

- [ ] `node flow-probe.js` → `*** FLOW OK ***`
- [ ] `node hero-layout.spec.js` → `*** ALL PASS ***`
- [ ] Scroll to the bottom, stop, wait 3s: the ribbon is at rest width, **not** frozen
      half-necked. (Step 4.)
- [ ] The specular streak stays inside the ribbon body at all speeds. (Step 3b.)

**Identity**

- [ ] `git diff styles.css | grep -iE "^\+.*#[0-9a-f]{3,6}"` → no hex outside the existing
      amber / ink / line tokens.
- [ ] Still two reveal languages, four `data-d` steps, two fonts.
- [ ] Nothing from §5 present.
- [ ] `git diff --stat` touches only `oil.js`, `styles.css`, and new test files.

**Accessibility**

- [ ] With `prefers-reduced-motion: reduce`: page legible and static, oil renders but does
      not chase, `flow` pinned at 0.
- [ ] All interactive elements keyboard-reachable and visibly focused, including inside
      unrevealed bands (Step 12, if done).
- [ ] `--oil-3` on paper is the 5.1:1 accent. Don't lighten it for effect.

---

## 8. BEFORE YOU SAY YOU'RE FINISHED

1. **Scroll the page once as a stranger**, at normal speed, on a phone. Write down what you
   *noticed*. **If you noticed more than one new thing, you added too much.**
2. **The velocity test.** Scroll fast, stop dead. The oil should neck, then relax. If it
   doesn't, Steps 1–6 aren't right and nothing else matters.
3. **Remove one accessory.** Whatever your weakest addition is — you know which — delete
   it. The page will be better. Not optional.
4. **Justify each shipped item in one sentence** against §1.8: physics of the oil, or a
   property of the type. Anything you can't justify comes out.
5. **Report honestly:** what you shipped, what you skipped and why, both verification
   outputs pasted in full, and anything that failed. A short honest list beats silent
   omission. **Do not claim a step passed without pasting its output.**

---

## 9. IF IN DOUBT

Ship Steps 1–6 alone, verified, and stop. A single well-judged refinement to the page's
one real idea is worth more than nine cautious ones, and it is far harder to make look
generated.

---

## 10. PROPOSED (leave unimplemented)

Ideas that occurred to you but are not in this work order. Write them here. Do not build them.

---
---

# APPENDICES — the operating principles behind this brief

The three appendices below are the working method this brief was written with. They are
included in full because you will not otherwise have them. **Appendix B is the one that
matters most** — it is the difference between a report I can trust and one I can't.

---

## APPENDIX A — Design principles

Use this when a step in §4 asks for visual judgement, or when you are tempted to add
something not in the work order.

### A.1 The posture

Approach this as the design lead at a small studio known for giving every client a visual
identity that could not be mistaken for anyone else's. **This client has already rejected
proposals that felt templated.** Make deliberate, opinionated choices, and be able to
defend each one.

For *this* page, the identity is already established and is good. Your job is not to
invent a direction — it is to deepen the existing one without diluting it. That is a
harder discipline than starting fresh, and it mostly consists of *not* adding things.

### A.2 Ground every choice in the subject

Distinctive choices come from the subject's own world — its materials, instruments,
artifacts, and vernacular. Here the subject's world is: warm amber oil, amber glass, a
nightly ten-minute ritual, small batches from Lagos, skin.

That is why the refinements in this brief are things like *continuity in a falling
stream* and *optical sizing in the accent italic* — they come from the oil and the type.
It is also why a cursor-follower ring or a glassmorphic card would be wrong here: they
come from nowhere.

### A.3 What AI-generated design currently looks like — avoid these clusters

Right now AI design clusters around three looks:

1. Warm cream background (near `#F4F1EA`), high-contrast serif display, terracotta accent.
2. Near-black background with a single bright acid-green or vermilion accent.
3. Broadsheet layout: hairline rules, zero border-radius, dense newspaper columns.

All three are legitimate for *some* brief, but they appear regardless of subject, which
makes them defaults rather than choices.

**Note carefully:** this page deliberately sits *near* cluster 1 and *near* cluster 3 —
paper-white ground, an italic serif accent, hairline rules, zero radius — but arrives
there from the subject (paper, oil, a product photographed on white) rather than from
habit, and it breaks the pattern by making its display face a **lowercase grotesk with
hard negative tracking** instead of the expected high-contrast serif. **Do not push it
further toward those clusters.** Specifically: do not warm the paper toward cream, do not
promote the serif from accent to display, and do not add more hairline rules.

### A.4 Typography carries the personality

Type is not a neutral delivery vehicle for content. Here the pairing is already decided
and load-bearing: a lowercase grotesk at `-.045em` doing all the work, with a variable
italic serif appearing on roughly six words in the entire page to mark the emotional
beat. **The restraint is the idea.** Promoting the serif to a second body face would
destroy it. This is why Step 8 (animating the serif's optical size) is the *only* type
change in the brief — it deepens the accent without spreading it.

### A.5 Structure is information

Structural devices — numbering, eyebrows, dividers, labels — should encode something true
about the content, not decorate it.

Many generic designs use `01 / 02 / 03` markers. That is only appropriate when the content
genuinely *is* a sequence. **On this page it is:** the ritual band is a literal three-step
nightly routine, so the numbering carries information the reader needs. It stays. But do
not add numbered markers anywhere else, because nowhere else is ordered.

### A.6 Leverage motion deliberately

An orchestrated moment lands harder than scattered effects. Sometimes less is more, and
**extra animation is one of the strongest signals that a design was AI-generated.**

This brief spends its entire motion budget in one place — Steps 1–6, the oil responding to
scroll velocity — and asks you to keep everything else quiet. That is deliberate. Resist
the urge to distribute the effort more evenly; distributed effort is what makes a page
feel busy rather than considered.

### A.7 Match complexity to the vision

Maximalist directions need elaborate execution; minimal directions need precision in
spacing, type, and detail. **This page is the second kind.** Elegance here comes from
executing a restrained vision precisely — correct coefficients, no layout shift, the
specular streak staying inside the ribbon — not from adding richness.

### A.8 Restraint and self-critique

Spend your boldness in one place. Let the signature element be the one memorable thing,
keep everything around it disciplined, and cut any decoration that does not serve the
brief. Build to a quality floor without announcing it: responsive to mobile, visible
keyboard focus, reduced motion respected.

Consider Chanel's advice: **before leaving the house, look in the mirror and remove one
accessory.** This is §8 step 3, and it is not a figure of speech — actually delete
something.

Note that *not* taking a risk is itself a risk. But on a page with an established
identity, the risk worth taking is going deeper into its one idea (a liquid that responds
to your hand), not bolting on a second idea.

### A.9 On writing, if you touch any copy

You almost certainly shouldn't — copy is out of scope. If you must:

Words are design material, not decoration. Write from the reader's side of the screen.
Name things by what people recognise, not by how the system is built. Be specific rather
than clever. Use active voice; a control says exactly what happens when it is used
("Save changes", not "Submit"), and keeps the same name through the whole flow — the
button that says "Publish" produces a toast that says "Published." Sentence case, plain
verbs, no filler. Errors explain what happened and how to fix it; they do not apologise
and are never vague. An empty state is an invitation to act. Let each element do exactly
one job.

---

## APPENDIX B — Verification before completion  ← THE IMPORTANT ONE

**Core principle: evidence before claims, always.**

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

**If you have not run the verification command in this message, you cannot claim it passes.**

### B.1 The gate function

Before claiming any status, or expressing any satisfaction:

1. **IDENTIFY** — what command proves this claim?
2. **RUN** — execute the full command, fresh and complete.
3. **READ** — the full output. Check the exit code. Count the failures.
4. **VERIFY** — does the output actually confirm the claim?
   - If no: state the actual status, with evidence.
   - If yes: state the claim, with the evidence attached.
5. **ONLY THEN** make the claim.

Skipping any step is not verifying. It is lying.

### B.2 What each claim actually requires

| Claim | Requires | Not sufficient |
|---|---|---|
| "Tests pass" | Test command output showing 0 failures | A previous run; "should pass" |
| "The neck works" | `node flow-probe.js` → `*** FLOW OK ***` | The code looks right |
| "Layout unaffected" | `node hero-layout.spec.js` → `*** ALL PASS ***` | You only edited `oil.js` |
| "No new loops" | `grep -c "requestAnimationFrame" oil.js` → `3` | You don't remember adding one |
| "Bug fixed" | Re-test the original symptom | The code changed |
| "Reduced motion OK" | Toggled the OS setting and looked | The `reduce` gate is in the code |
| "Requirements met" | Line-by-line pass through §7 | The tests pass |

### B.3 Red flags — stop if you catch yourself

- Writing "should", "probably", "seems to", "looks correct".
- Expressing satisfaction before verifying — "Great!", "Perfect!", "Done!".
- About to commit without running both verifications.
- Relying on partial verification and extrapolating.
- Thinking "just this once".
- Wanting the work to be over.
- **Any wording that implies success when you have not run the check.**

### B.4 Rationalizations, answered

| Excuse | Reality |
|---|---|
| "Should work now" | Run the verification. |
| "I'm confident" | Confidence is not evidence. |
| "Just this once" | No exceptions. |
| "I only changed one line" | Run it. |
| "The grep passed, so it works" | A grep proves text exists, not that it behaves. |
| "I'm out of budget/time" | Then report honestly what is unverified. That is fine. Claiming it passed is not. |
| "Different words, so the rule doesn't apply" | Spirit over letter. |

### B.5 The specific instruction for this job

When you report back, **paste the full stdout of `node flow-probe.js` and
`node hero-layout.spec.js`.** Not a summary. Not "all tests passed." The actual output.

If you could not run them, say exactly that, say why, and list what remains unverified.
**An honest "I implemented Steps 1–4 but could not run Playwright, so the neck is
unverified" is a good report. "Done, everything works" without output is a bad one**, and
it will be assumed to be wrong.

---

## APPENDIX C — Systematic debugging

Use this the moment something doesn't work. Do not skip to fixes.

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

Symptom fixes are failures. This applies *especially* when you are in a hurry, when the
issue looks simple, or when a fix seems obvious — those are exactly the conditions under
which guessing wastes the most time.

### C.1 Phase 1 — Root cause investigation (before ANY fix)

1. **Read the error carefully.** Full stack trace, line numbers, exit codes. It often
   contains the answer.
2. **Reproduce consistently.** Can you trigger it reliably? Exact steps? Every time? If
   it is not reproducible, gather more data — do not guess.
3. **Check recent changes.** `git diff`. What did you just touch? On this task the answer
   is almost always one of the six steps you just applied.
4. **Gather evidence at each boundary.** This page has a clear chain:

   ```
   scroll event → onScroll() → measureTarget() sets `target`
     → frame(): shown chases target → speed → flow → flowNeck
       → outline()/sheen() read flowNeck → SVG path attributes
   ```

   Log at each arrow to find *where* it breaks before asking *why*. Example:

   ```js
   // temporary, inside frame() — remove before you finish
   if (!window.__n) window.__n = 0;
   if (window.__n++ % 30 === 0) console.log({speed:+speed.toFixed(2), flow:+flow.toFixed(3), flowNeck:+flowNeck.toFixed(3)});
   ```

   If `speed` moves but `flow` doesn't → Step 2. If `flow` moves but `flowNeck` doesn't →
   Step 3d. If `flowNeck` moves but nothing renders → Step 3a/3b, or the loop parked (Step 4).

5. **Trace data flow backward.** Find where the bad value *originates*, not where you
   first noticed it. Fix at the source.

### C.2 Phase 2 — Pattern analysis

Find working examples in the same codebase and compare. On this task there is a perfect
reference: **`sN` already does what `flow` does**, for the head droplet. If `flow` misbehaves,
read the four lines around `const sN = clamp(speed / 26, 0, 1)` and list every difference.
Don't assume any difference "can't matter."

### C.3 Phase 3 — Hypothesis and testing

1. **Form ONE hypothesis.** Write it down: "I think X is the root cause because Y."
2. **Test minimally.** Smallest possible change. One variable at a time.
3. **Verify before continuing.** Worked → Phase 4. Didn't work → form a *new* hypothesis.
   **Do not stack another fix on top of a failed one.**
4. **If you don't understand something, say so.** Don't pretend.

### C.4 Phase 4 — Implementation

1. Have a failing check *first* (`flow-probe.js` is already written for you).
2. **One fix at a time.** No "while I'm here" improvements. No bundled refactoring.
3. Verify: the check passes, nothing else broke, the symptom is actually gone.
4. **If a fix fails, count your attempts.** Under 3: return to Phase 1 with the new
   information. **At 3 or more: stop and question the approach itself** — if each fix
   reveals a new problem somewhere else, that is an architectural signal, not a failed
   hypothesis. Report back rather than attempting a fourth fix.

### C.5 Red flags — you are rationalizing

- "Quick fix now, investigate later."
- "Just try changing X and see if it works."
- "Let me change several things and run it."
- "It's probably X, let me fix that."
- "I don't fully understand this but this might work."
- "One more fix attempt" (when you've already tried two).

All of these mean: stop, return to Phase 1.

### C.6 A note specific to this codebase

The most likely bug you will hit is **the ribbon freezing half-necked after you stop
scrolling.** That is not a physics bug and not a maths bug — it is the loop parking
(§1.6b). The fix is Step 4. Check that before investigating anything else.
