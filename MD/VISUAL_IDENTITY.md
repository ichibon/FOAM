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

### The Decision: High-Contrast Serif Wordmark + Clean Sans Body

The logo has spoken. The FOAM wordmark uses a high-contrast serif — thick strokes, elegant curves, the distinctive "f" curl that makes it instantly recognizable. This is the brand's display typeface identity. The app UI system builds around it.

**Two-typeface system:**
- **Display/Headlines:** A high-contrast serif matching the logo's character — bold, distinctive, premium without being stuffy
- **Body/Interface:** A clean geometric sans for all functional UI text — readable, fast, gets out of the way

### Logo Typeface — Display & Headlines

The FOAM wordmark appears to be set in a high-contrast serif in the style of **Playfair Display** or **Cormorant Garamond** — characterized by dramatic thick-to-thin stroke contrast, bracketed serifs, and elegant letterform curves. The "f" has a distinctive curl terminal that functions as an ownable brand mark.

**Recommended digital match:** **Playfair Display** (Google Fonts, free)
- Weight used in logo: Bold (700) to Extra Bold (800)
- The thick/thin contrast reads beautifully at display sizes on mobile
- Works in both Roman and Italic — the Roman weight is the primary brand voice

**Alternative:** Cormorant Garamond (slightly more refined, less contrast) or Freight Display (more contemporary feel).

**Usage:**
- App name treatments: 800 weight
- Onboarding headlines: 700 weight
- Feature callouts: 700 weight
- Marketing headlines: 700-800 weight

### Secondary Typeface — Body & Interface

**Inter** (Google Fonts, free)

Clean, highly legible at small sizes, designed specifically for screens. Pairs well with a high-contrast serif by providing the neutral counterpoint. The serif does the personality work; Inter does the clarity work.

**Usage:**
- Body copy: 400 weight
- UI labels and form fields: 400-500 weight
- Data, numbers, stats: 500-600 weight (tabular variant)
- Fine print and captions: 400 weight

```css
--font-display: 'Playfair Display', 'Cormorant Garamond', Georgia, serif;
--font-body:    'Inter', system-ui, -apple-system, sans-serif;
```

---

## 02 — Color Palette

### The Strategic Foundation

The mobile detailing industry's visual language is either sterile (clinical blue/white like a car wash chain) or masculine-aggressive (black, chrome, fire graphics). Neither is right for a platform trying to feel premium, modern, and welcoming to both detailers and customers.

FOAM's palette is built around three psychological goals:
1. **Confidence** — through contrast and intentional use of dark tones
2. **Energy** — through a single, charged accent that doesn't let you look away
3. **Worry-free** — through clean neutrals that make the interface feel organized and trustworthy

### The Core Palette

#### Primary Brand Blue — FOAM Blue
```
Primary Accent:    #339DC7   (FOAM Blue — extracted from brand logo)
Accent Bright:     #3DAFD6   (lighter for dark backgrounds)
Accent Hover:      #2B85A9   (darker for pressed states)
Accent Subtle:     rgba(51, 157, 199, 0.15)  (backgrounds, chips, tags)
```

**Why this blue:** This is the existing Foam Auto Spa brand color — a warm, medium sky blue that sits at the intersection of clean and approachable. Unlike cold tech blues, this color has warmth and human energy to it. It's distinctive in a category full of either aggressive dark palettes or sterile corporate blues. The color has brand heritage from the original business and carries it forward into the app with continuity.

#### Dark Teal — FOAM Dark
```
Dark Background:   #0F2F3C   (FOAM Dark Teal — extracted from brand logo)
Dark Elevated:     #164558
Dark Surface:      #1C5268
```

This dark teal is richer and more distinctive than a generic near-black. It has depth, warmth, and brand identity baked in — it looks like FOAM, not like every other dark-mode app.

#### Light Blue — FOAM Light
```
Light Background:  #E1F0F7   (FOAM Light — extracted from brand logo)
```

Used as a subtle background tint on light mode surfaces and as the distinct Rain Coverage feature color.

#### Neutral Grays (Teal-tinted)
```
Text Primary:     #F5F5F5   (off-white)
Text Secondary:   #A3C4CF   (teal-tinted secondary — stays on brand in dark mode)
Text Tertiary:    #6A9BAA
Text Disabled:    #3D6B7A
Border Subtle:    #1E5D72
Border Default:   #2B7A96
```

Grays with a slight teal tint rather than neutral grays — keeps the palette cohesive across light and dark modes without fighting the brand color.

#### Semantic Colors
```
Success:          #22C55E   (Green — payment received, job complete)
Warning:          #F59E0B   (Amber — upcoming appointment, low inventory)
Error:            #EF4444   (Red — payment failed, cancellation)
Rain Coverage:    #E1F0F7   (Light Blue — distinct, used only for Rain feature)
```

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

## 04 — Logo

### The Logo Is Decided

The FOAM wordmark from Foam Auto Spa carries forward as the official FOAM app logo. No redesign needed. The existing logo is strong, distinctive, and already has brand equity in the detailing world.

**What makes it work:**
The high-contrast serif wordmark — set in bold with dramatic thick-to-thin stroke variation — has presence and authority without feeling aggressive. The lowercase treatment gives it warmth and approachability. The distinctive "f" with its curved terminal is a natural standalone mark for app icons and small-format use. "AUTO SPA" in spaced uppercase light caps reads as a clean, confident subtitle treatment that can be dropped for the platform version of the brand.

### The Six Official Colorways

| Variant | Background | Logo Color | Use Case |
|---------|-----------|-----------|---------|
| Color on Light | #E1F0F7 | #339DC7 | Marketing, light UI contexts |
| Color on Dark | #0F2F3C | #339DC7 | App dark mode, dark marketing |
| White on Color | #339DC7 | White | CTAs, social avatars, buttons |
| White on Dark | #0F2F3C | White | App headers, dark backgrounds |
| Black on White | White | Black | Print, documents, press kit |
| White on Black | Black | White | High contrast, accessibility |

### App Icon Treatment

The standalone "f" — isolated from the wordmark — is the primary app icon mark. Set on the FOAM Dark Teal (#0F2F3C) background. The curl of the "f" is distinctive enough at 60x60px to be immediately recognizable on a home screen alongside 20 other app icons.

### Logo Rules

- Never stretch, skew, rotate, or add effects to the logo
- Never recreate the wordmark in a different typeface
- Never place the logo on busy photography without a backing treatment
- Minimum clear space: the cap height of the "f" on all four sides
- Minimum digital size: 80px wide for wordmark, 24px for mark-only
- Never use the full wordmark at app icon size — "f" mark only at small formats

---

## 05 — System in Practice

### How the Elements Work Together

The system only works if the elements stay in their lanes.

**Playfair Display Bold** commands. It headlines, it sets the tone in the first second of any screen.

**Inter Regular/Medium** executes. It delivers information clearly and gets out of the way.

**Cobalt Blue (#2563EB)** acts. It is the only color on screen that is asking you to do something.

**Inter Regular/Medium** executes. It delivers information clearly and gets out of the way.

**FOAM Blue (#339DC7)** acts. It is the only color on screen that is asking you to do something.

**Dark Teal backgrounds (#0F2F3C)** contain. They create the stage on which everything else performs — richer and more distinctive than generic near-black.

**Photography** proves. It shows real work by real people and makes the platform's promise feel credible.

**The logo** identifies. It doesn't explain. It doesn't decorate. It marks the thing as FOAM and steps back.

When all five of these are working together, a new user who has never heard of FOAM should feel — before they read anything — that this is **sharp, alive, and trustworthy.**

That's the brief. That's the system. Hold the line.

---

## Color Reference Card

| Token | Hex | Use |
|-------|-----|-----|
| FOAM Blue | #339DC7 | Primary accent, CTAs, links, active states |
| FOAM Blue Bright | #3DAFD6 | Accent on dark backgrounds |
| FOAM Blue Hover | #2B85A9 | Pressed/hover states |
| FOAM Blue Subtle | rgba(51,157,199,0.15) | Chips, tags, subtle backgrounds |
| FOAM Dark Teal | #0F2F3C | Primary dark background |
| FOAM Light Blue | #E1F0F7 | Light mode background, Rain Coverage feature |
| Success | #22C55E | Completed jobs, received payments |
| Warning | #F59E0B | Upcoming appointments, alerts |
| Error | #EF4444 | Failed payments, cancellations |

---

*Document Status: Complete. Reflects confirmed brand direction including logo, color, and typeface decisions locked May 2026.*
