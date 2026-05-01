# FOAM — Visual Identity Brief

> For the design team. Every decision in here has a reason. Read the reasoning, not just the output.

---

## The Three Words

When someone sees anything from FOAM for the first time — an ad, the app icon, the onboarding screen, a notification — they should feel exactly three things before they read a single word:

### **Sharp. Alive. Trustworthy.**

**Sharp** — This was designed with intention. Nothing is accidental. The brand has a point of view and it shows. It doesn't look like every other app in the App Store.

**Alive** — There's energy here. It moves. It has pulse. It doesn't feel like a corporate SaaS tool. It feels like something built for people who are actually out there doing work.

**Trustworthy** — It's polished enough to hand your credit card to. Clean enough to believe the detailer who shows up actually knows what they're doing. Professional without being cold.

These three words are the test. Before any visual decision ships — color, type, layout, photography, logo — ask whether it makes FOAM feel sharper, more alive, and more trustworthy. If it doesn't do at least two of three, it's not right.

---

## 01 — Typography Direction

### The Decision: Geometric Sans + Display Weight Contrast

No serifs. No script. No decorative novelty fonts.

Here's why. FOAM serves two audiences who are both fundamentally mobile-first and action-oriented. A detailer between jobs checking their next booking doesn't have patience for type that requires effort to read. A customer booking in a parking lot needs instant clarity. Serifs add friction on small screens. Scripts signal the wrong category entirely — this is a business tool, not a wedding vendor app.

What FOAM needs is a geometric sans-serif that feels **modern, credible, and human** — with enough personality that it doesn't disappear into generic tech territory.

### Primary Typeface — Display & Headlines

**Outfit** (Google Fonts, free)

Why Outfit specifically: Geometric skeleton with subtly humanist proportions. Wide apertures read well at small sizes. The letterforms have just enough warmth to avoid feeling robotic, and just enough precision to feel like it was designed for a platform that means business. At heavy weights (700-800) it commands attention without screaming. The capital letters are particularly strong for short headlines and UI labels.

Alternatives if Outfit is unavailable: **Plus Jakarta Sans** (slightly more premium feel, excellent at display sizes) or **DM Sans** (cleaner, more neutral — less personality but extremely legible).

**Usage:**
- App name treatments: 800 weight
- Onboarding headlines: 700 weight
- Feature callouts and marketing headlines: 700-800 weight
- UI navigation labels: 600 weight

### Secondary Typeface — Body & Interface

**Inter** (Google Fonts, free)

Yes, Inter is everywhere. That's because it's the best-optimized typeface for digital interfaces at body sizes and it earns its place here. The distinction is that Outfit handles everything attention-grabbing and Inter handles everything functional. Two typefaces with clear lane assignments creates coherence, not competition.

**Usage:**
- Body copy: 400 weight
- UI labels and form fields: 400-500 weight
- Data, numbers, stats: 500-600 weight (tabular variant when available)
- Fine print and captions: 400 weight

### Type Scale — Mobile First

Base: 16px. Ratio: 1.25 (Major Third) — creates clear visual hierarchy without requiring too many size stops.

```
Display:     40px / 800 / -0.04em  — App name, splash screens
H1:          32px / 700 / -0.03em  — Section heroes, onboarding titles
H2:          24px / 700 / -0.02em  — Card headlines, screen titles
H3:          20px / 600 / -0.01em  — Sub-section headers
H4:          18px / 600 /  0em     — Component headers
Body L:      16px / 400 /  0em     — Primary reading text
Body M:      14px / 400 /  0em     — Supporting text, descriptions
Body S:      13px / 400 / +0.01em  — Captions, metadata
Label:       11px / 600 / +0.08em  — All caps labels ONLY
```

**Non-negotiable rules:**
- Body text never drops below 13px
- ALL CAPS used only for Label size with minimum +0.06em letter-spacing
- Line height for body: 1.5x font size. For headlines: 1.2x.
- Never use more than 4 font sizes on a single screen

---

## 02 — Color Palette

### The Strategic Foundation

The mobile detailing industry's visual language is either sterile (clinical blue/white like a car wash chain) or masculine-aggressive (black, chrome, fire graphics). Neither is right for a platform trying to feel premium, modern, and welcoming to both detailers and customers.

FOAM's palette is built around three psychological goals:
1. **Confidence** — through contrast and intentional use of dark tones
2. **Energy** — through a single, charged accent that doesn't let you look away
3. **Worry-free** — through clean neutrals that make the interface feel organized and trustworthy

### The Core Palette

#### Primary Background — Near Black
```
Dark Mode Base:   #0D0D0D   (not pure black — less harsh, more considered)
Dark Mode Surface: #161616
Dark Mode Elevated: #1F1F1F
Dark Mode Card:    #252525
```

Pure black feels like a void. #0D0D0D feels like depth. The difference is subtle on screen and significant in perception. Dark mode is the primary experience for FOAM — it matches the energy of the brand and the context of use (often outdoors, often in direct sun where dark UIs reduce glare).

#### Accent — Electric Cobalt Blue
```
Primary Accent:    #2563EB   (Cobalt Blue)
Accent Bright:     #3B82F6   (lighter for dark backgrounds)
Accent Hover:      #1D4ED8   (darker for pressed states)
Accent Subtle:     rgba(37, 99, 235, 0.15)  (backgrounds, chips, tags)
```

**Why this blue specifically:**

Most detailing apps reach for teal or green (cleanliness) or orange (energy). Both are expected. Cobalt blue is unexpected in this category, which makes it ownable.

Psychologically, this specific blue sits at the intersection of **trust and momentum** — it has the confidence of a financial app without the stuffiness. It reads as smart, fast, and premium. It also has exceptional contrast on dark backgrounds, making every CTA pop without feeling neon or aggressive.

This is the only accent color in the system. One accent, used with discipline, is more powerful than three competing for attention.

#### Neutral Grays
```
Text Primary:     #F5F5F5   (off-white — not pure white, reads softer)
Text Secondary:   #A3A3A3
Text Tertiary:    #666666
Text Disabled:    #3D3D3D
Border Subtle:    #2A2A2A
Border Default:   #363636
Border Strong:    #4A4A4A
```

Warm-neutral grays, not cool-blue grays. Warm grays feel more human and pair well with the cobalt accent without competing.

#### Semantic Colors
```
Success:          #22C55E   (Green — payment received, job complete)
Warning:          #F59E0B   (Amber — upcoming appointment, low inventory)
Error:            #EF4444   (Red — payment failed, cancellation)
Rain Coverage:    #60A5FA   (Sky blue — distinct from primary, used only for Rain feature)
```

**Rain Coverage gets its own distinct color** — sky blue (#60A5FA) rather than the primary cobalt. This matters because Rain Coverage is a special feature with emotional weight. The lighter, airier blue signals protection and sky without being confused with a primary action.

### Light Mode Palette

```
Background:       #FAFAFA
Surface:          #F4F4F5
Elevated:         #FFFFFF
Card:             #FFFFFF
Text Primary:     #0A0A0A
Text Secondary:   #525252
Text Tertiary:    #A3A3A3
Border Subtle:    #E4E4E7
Border Default:   #D4D4D8
Accent:           #2563EB   (same — maintains brand consistency across modes)
```

### Color Usage Rules

- Accent (#2563EB) is used ONLY for: primary CTAs, active states, links, key data points
- Never use accent as a background on anything larger than a chip or tag
- Maximum 10% of any screen's visual area should be accent color
- Success green is used ONLY for: completed jobs, received payments, positive states
- Error red is used ONLY for: failures, cancellations, destructive confirmations
- Never use color as the ONLY differentiator — always pair with an icon or label

---

## 03 — Photography Style

### The Brief in One Sentence

Real people, real craft, real light — not stock photography of someone smiling at a car.

### What to Shoot

**Hero Subjects:**
- Hands in motion — applying product, buffing, wiping down a surface. The craft is beautiful and underrepresented. Close in on the work.
- The before/after moment — not a split-image graphic, but the actual moment a detailer steps back and looks at what they just created.
- Detailers in their environment — their van, their equipment laid out, their setup. This is their office. Treat it that way.
- The car as protagonist — clean, gleaming, ideally in golden hour light where the reflections do the work. The car should look like something worth protecting.
- Customers in context — the moment they see their car for the first time after a detail. Genuine reaction, not posed satisfaction.

**Never Shoot:**
- Generic stock photos of people shaking hands or looking at phones
- Cars in unrealistic studio settings with dramatic lighting rigs
- Detailers who look like actors playing detailers
- Anyone smiling directly at the camera in a forced way
- Wide shots where the craft is invisible — get close

### How to Light It

**Primary style: Directional natural light with controlled contrast.**

The goal is to make everything look as good as a freshly detailed car — which means depth, clarity, and richness of color without the flatness of overlit commercial photography.

**Golden hour (preferred):** Shoot exteriors in the hour after sunrise or before sunset. The warm raking light hits paint and reflective surfaces in a way that makes even a standard sedan look worth caring about. This is when detailers' work looks the most compelling.

**Overcast (acceptable for process shots):** Even, diffused light is excellent for documenting the craft without distracting shadows. Good for hands-on-car detail work.

**Interior shots:** Natural window light plus one fill source. Keep it realistic. The goal is authentic, not aspirational-fake.

**Avoid:** Harsh midday sun that bleaches color and creates unflattering shadows. Over-processed HDR looks. Heavy filters that make everything the same color. Anything that looks like it was shot for a car wash chain's highway billboard.

### Color Treatment in Post

- Rich, slightly desaturated. Not Instagram-filtered, not clinical.
- Blacks should have depth, not crush to pure black
- Highlight retention in metallic and painted surfaces — this is where the craft shows
- Skin tones always priority-corrected — the detailers and customers are the point
- No heavy vignetting. No heavy grain unless used as a deliberate design element in marketing materials.

### Photography vs. Illustration

In-app: Photography for detailer profiles and job documentation. Simple line iconography for UI elements.

Marketing: Photography leads. Illustration only as supplementary graphic elements — never as a substitute for real photography of real people doing real work.

---

## 04 — Logo Concept Direction

### What the Logo Has to Do

FOAM's logo needs to work in three contexts with very different requirements:

1. **App icon** — 1024x1024px reduced to 60x60px on a home screen, often next to 20 other icons
2. **Wordmark** — in-app headers, marketing materials, press kit
3. **Small format** — notification badges, favicon, partner co-branding

This means the logo cannot rely on detail, complexity, or color to carry its meaning. It has to work in one color. It has to work at 16px. And it still has to feel like FOAM.

### Primary Direction: Bold Wordmark with a Graphic Mark

**The wordmark:**
FOAM set in Outfit 800 weight, all caps, with slightly tightened tracking (-0.03em). The weight alone creates confidence. The geometry of the letterforms in Outfit at heavy weight has an inherent architectural quality that works well for a platform brand.

The word FOAM itself is an asset. It's short (4 letters), memorable, visually balanced, and has an implicit connection to the car care world without being literal about it. The wordmark should let the word carry the weight.

**The graphic mark — two directions to explore:**

*Direction A: The Water Bead*
A highly abstracted water bead — the physics of water on a clean, hydrophobic surface. This is the most iconic visual cue in the detailing world. A perfectly formed sphere or spheroid, simplified to a geometric form (circle with subtle dimensional quality or a lens-shaped mark). Used alone as the app icon, alongside the wordmark for full lockup. This mark is ownable because nobody else has claimed it at this level of abstraction.

*Direction B: The "F" Mark*
A modified "F" from the Outfit typeface, treated as a contained mark — either in a rounded square (for app icon use) or as a freestanding letterform with a subtle graphic element that references motion or shine. Cleaner, more conventional. Lower risk. Less distinctive than Direction A.

**Recommendation:** Explore Direction A first. The water bead concept is genuinely ownable in this category, connects to both the brand name and the industry without being cliché, and works at every size. If it can't be executed at high quality, Direction B is the reliable fallback.

### Logo Rules (Non-Negotiable Before Design Begins)

- Minimum clear space: the height of the "F" in the wordmark on all four sides
- Minimum display size: 80px wide for wordmark, 24px wide for mark-only
- Never stretch, skew, outline, or add drop shadows to the logo
- Primary version: white on dark. Secondary: dark on light. Never on busy photography without a backing treatment.
- Never recreate the logo in a different typeface for "this one use case"
- App icon: graphic mark on dark background only — never the full wordmark at icon size

### What to Avoid

- Water droplets rendered literally or in 3D — too illustrative, too expected
- Car silhouettes in or around the mark — too limiting, too literal
- Shine rays or sparkle motifs — used by every car care brand since 1970
- Gradients in the primary logo — beautiful in digital, impossible to reproduce in print or embroidery
- Overlapping letterforms or letters that share strokes — illegible at small sizes

---

## 05 — System in Practice

### How the Elements Work Together

The system only works if the elements stay in their lanes.

**Outfit Bold** commands. It headlines, it labels navigation, it sets the tone in the first second of any screen.

**Inter Regular/Medium** executes. It delivers information clearly and gets out of the way.

**Cobalt Blue (#2563EB)** acts. It is the only color on screen that is asking you to do something.

**Near-Black backgrounds** contain. They create the stage on which everything else performs.

**Photography** proves. It shows real work by real people and makes the platform's promise feel credible.

**The logo** identifies. It doesn't explain. It doesn't decorate. It marks the thing as FOAM and steps back.

When all five of these are working together, a new user who has never heard of FOAM should feel — before they read anything — that this is **sharp, alive, and trustworthy.**

That's the brief. That's the system. Hold the line.

---

*Document Status: Complete. Update only when a brand identity decision is formally changed and approved. Do not make visual exceptions without updating this document.*
