# CURVA — Visual Asset & Image Generation Specification

This document provides complete, production-grade image generation briefs, asset status, and prompt specifications for all photography slots across the **Curva** single-page brand experience.

---

## Asset Inventory & Live References

| Slot | File Reference | Aspect Ratio | Dimensions | Section Location | Status |
|---|---|---|---|---|---|
| **01** | [`assets/img-bottle.jpg`](file:///c:/Users/bb201/Documents/curva/assets/img-bottle.jpg) | `4:5` (3:4) | 1024 × 1365 px | Featured Oil / Flagship Band | **Active & Generated** |
| **02** | [`assets/img-texture.jpg`](file:///c:/Users/bb201/Documents/curva/assets/img-texture.jpg) | `3:2` | 1365 × 910 px | Statement Band | **Active & Generated** |
| **03** | [`assets/img-counter.jpg`](file:///c:/Users/bb201/Documents/curva/assets/img-counter.jpg) | `16:9` | 1365 × 768 px | Collection / Counter Band | **Active & Generated** |
| **04** | [`assets/img-ritual.jpg`](file:///c:/Users/bb201/Documents/curva/assets/img-ritual.jpg) | `16:9` | 1365 × 768 px | The Ritual Band | **Active & Generated** |
| **05** | [`assets/og-image.png`](file:///c:/Users/bb201/Documents/curva/assets/og-image.png) | `1200:630` | 1200 × 630 px | Open Graph & Social Cards | **Active & Compiled** |

---

## Art Direction Principles

1. **Ground & Palette Integrity**:
   - **Background**: Pure paper white (`#FFFFFF`). No warm cream, no pink or blush tints, no studio clutter.
   - **Chroma**: Amber oil (`#8A4F16` → `#D89A3E`) is the primary saturated element in every composition.
   - **Inks & Accents**: Soft warm-black (`#14100E`) and muted stone tones.

2. **Lighting & Texture**:
   - **Key Light**: Single-source directional warm key (3800K–4100K) from high-left (45° angle), producing crisp specular highlights and golden amber subsurface scattering/caustics.
   - **Fill Light**: Soft, subtle neutral fill preserving micro-shadow definition and skin/glass texture.
   - **Texture**: Tangible, high-resolution organic surface details — real glass refractions, open neck brim with flowing meniscus, natural skin pores, and viscous liquid luster. Zero artificial airbrushing or plastic CGI smoothness.

3. **Representation & Origin**:
   - Curva is formulated and hand-blended in small batches in Lagos, Nigeria.
   - Models and hand imagery celebrate rich, deep melanated Nigerian skin tones with authentic natural glow.

---

## 1. Flagship Product Shot — `assets/img-bottle.jpg`

- **Slot Location**: Featured Oil / Product Band (`.product-art`)
- **Aspect Ratio**: `4:5` (3:4)
- **Live File**: `assets/img-bottle.jpg`
- **Single Job**: Showcase the open-mouth apothecary glass bottle with rich amber oil brimming at the rim and dripping down the glass neck onto the shoulder, with the glass pipette dropper resting beside it.

### Detailed Prompt
> **Prompt**:
> High-end commercial luxury studio product photography of a single 100ml cylindrical heavy-base amber glass cosmetic bottle with an open mouth collar at the top (dropper cap unsealed and removed, resting gracefully beside the bottle). Rich, viscous golden-amber botanical body oil is brimmed at the open glass lip, with a delicate glisten of oil overflowing at the rim and running down the neck. Minimalist white apothecary label on the glass reads "curva" and "HIP & BUTT OIL". Pristine, seamless flat white `#FFFFFF` paper background with generous negative space. Warm directional studio spotlight from high-left (4000K) illuminates translucent amber oil inside the glass, casting delicate golden caustics and a soft, warm cast shadow on the white tabletop. Razor-sharp Hasselblad macro focus, quiet luxury skincare editorial.

### Negative Prompt
> `pink background, blush tones, cream paper, warm yellow background, cluttered props, plants, marble counter, plastic bottle, fake droplets, CGI render, cartoonish 3D, harsh digital noise, blurry label, oversaturated red, low resolution`

### Skin Tone Note
> N/A (Product still life).

### Key Takeaway
> *"An unsealed, concentrated botanical oil made in small artisanal batches, ready to pour."*

---

## 2. Liquid Texture Macro — `assets/img-texture.jpg`

- **Slot Location**: Statement Band (`.statement-art`)
- **Aspect Ratio**: `3:2` (Landscape)
- **Live File**: `assets/img-texture.jpg`
- **Single Job**: Reveal the physical density, surface tension, and warmth of the oil on radiant skin.

### Detailed Prompt
> **Prompt**:
> Extreme macro beauty editorial photograph of a single viscous, globular bead of rich amber botanical body oil (`#C1802A`) resting on deep, radiant dark brown Nigerian skin (deep ebony / dark espresso complexion). The oil droplet has high surface tension, forming a rounded, plump liquid dome with a crisp, curved specular highlight reflecting a warm key light. Subsurface golden light glows through the droplet onto the skin beneath. Authentic, high-resolution skin texture with visible natural pores and a healthy, hydrated satin sheen. Clean composition framed against a pure, bright neutral background. Shot on Phase One XF IQ4 150MP, 120mm Macro f/4.0, 1/200s, ISO 50. Tactile, sensorial, quiet luxury, editorial skincare campaign.

### Negative Prompt
> `airbrushed skin, plastic skin, mannequin, smoothed pores, acne scars, artificial glitter, pink hue, purple tint, white cream, watery splash, low detail, stock photo look, dry skin, greasy glare`

### Skin Tone Note
> Authentic deep dark brown Nigerian melanated skin tone (Fitzpatrick Type VI) with rich undertones and natural luminescence.

### Key Takeaway
> *"Dense and slow — it goes on with substance and warms as you work it in."*

---

## 3. Full Counter Flat-Lay — `assets/img-counter.jpg`

- **Slot Location**: Collection / Counter Band (`.collection-art`)
- **Aspect Ratio**: `16:9` (Widescreen)
- **Live File**: `assets/img-counter.jpg`
- **Single Job**: Showcase the complete Curva counter as a unified, purposeful botanical formulary.

### Detailed Prompt
> **Prompt**:
> Overhead 45-degree top-down editorial flat-lay photograph of the complete Curva cosmetic counter collection arranged deliberately on a pure, seamless `#FFFFFF` paper surface with generous white negative space. The curated arrangement includes: one 100ml amber glass bottle of Curva Hip & Butt oil with black dropper collar, two sleek matte black-and-gold sealed herbal powder sachets ("Weight Gain Powder" & "Hip & Butt Powder"), a small carved dark teak wooden measuring scoop holding a mound of golden botanical powder, and a small handcrafted bone-white ceramic ritual oil dish catching warm sunlight. Soft directional lighting from top-left creating subtle, soft-edged shadows. Clean geometry, minimalist apothecary aesthetic, premium natural wellness brand. Leica SL2, 50mm Summicron lens, f/5.6, ISO 100, 1/125s.

### Negative Prompt
> `messy arrangement, cluttered background, pink background, bathroom tiles, flowers, decorative petals, rustic wood table, glossy plastic, fake CGI reflections, distorted proportions, low contrast`

### Skin Tone Note
> N/A (Still-life arrangement).

### Key Takeaway
> *"Every formula on the counter is an intentional part of the larger ritual."*

---

## 4. The Nightly Ritual in Motion — `assets/img-ritual.jpg`

- **Slot Location**: The Ritual Band (`.ritual-art`)
- **Aspect Ratio**: `16:9` (Widescreen)
- **Live File**: `assets/img-ritual.jpg`
- **Single Job**: Frame the application as an intimate, grounding nightly practice.

### Detailed Prompt
> **Prompt**:
> Close-up intimate editorial photograph of two graceful hands with deep rich melanated dark skin gently cupping several warm golden drops of Curva amber body oil. The palms are tilted inward, with the viscous liquid catching a soft, warm golden glow between the fingers. Clean, manicured natural nails. Soft, tranquil atmosphere suggesting a private nightly evening routine. Pure, uncluttered white-and-warm background with gentle light falloff. High detail on hand contours, skin texture, and the reflective satin luster of the oil. Shot on Canon EOS R5, 85mm f/2.0, ISO 200, 1/160s. Calm, intentional, sensorial luxury wellness editorial.

### Negative Prompt
> `rough hands, artificial acrylic nails, jewellery, watches, pink lighting, messy background, watery splash, clinical spa setting, sterile hospital lighting, distorted fingers, extra fingers, cartoonish`

### Skin Tone Note
> Deep, rich dark brown skin tone with warm golden undertones, celebrating Nigerian beauty.

### Key Takeaway
> *"Ten minutes a night that belong to nobody else — warm oil, slow circles, and showing up for yourself."*

---

## 5. Social Share Card — `assets/og-image.png`

- **Slot Location**: Open Graph & Twitter Summary Large Image
- **Aspect Ratio**: `1200 × 630 px`
- **Live File**: `assets/og-image.png`
- **Single Job**: Create an unforgettable, high-converting thumbnail with pure white canvas, amber bottle, and running oil rivulet.

### Detailed Prompt
> **Prompt**:
> High-impact minimalist luxury graphic design and commercial photography composition for Curva. On a stark, pristine `#FFFFFF` paper background, the right third of the frame features a 100ml amber glass bottle of Curva Hip & Butt oil standing upright. A single viscous, glossy rivulet of translucent amber oil (`#D89A3E`) flows gracefully from the lip of the bottle down along the right silhouette edge of the glass into the lower frame. On the left side, elegant typography in soft charcoal black (`#14100E`) displays "curva" with the tagline "hip & butt oil · small batch lagos". Pristine negative space, high contrast, golden caustics, crisp editorial magazine aesthetic. 1200x630 resolution, ultra-sharp vector alignment and studio photography fusion.

### Negative Prompt
> `pink background, blush gradients, busy patterns, discount badges, 3D bubble letters, cluttered text, low resolution, artifacts, blurry edges`

### Key Takeaway
> *"Curva: The nightly hip and butt oil ritual."*
