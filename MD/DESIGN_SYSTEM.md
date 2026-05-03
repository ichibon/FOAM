# Design System

## Philosophy
Every design decision serves one of three goals: reduce cognitive load, build trust, or create delight. If a design element doesn't do at least one of these things, it doesn't belong.

---

## Platform
- Primary: iOS (launch)
- Secondary: Android (closely following iOS launch)
- Framework: React Native via Expo
- Design tool: UXPilot
- Both dark mode and light mode supported from launch

---

## Breakpoints
Mobile-first. No desktop breakpoints for V1. If a responsive web view is needed for owner dashboards in V2, breakpoints will be defined at that time.

---

## Color System

### Dark Mode (Primary)
```
Background Primary:     #0F2F3C   (FOAM Dark Teal — brand dark background)
Background Secondary:   #0D3A4A
Background Elevated:    #164558
Surface:                #1C5268
Border Subtle:          #1E5D72
Border Default:         #2B7A96

Text Primary:           #F5F5F5
Text Secondary:         #A3C4CF
Text Tertiary:          #6A9BAA
Text Disabled:          #3D6B7A

Accent Primary:         #339DC7   (FOAM Blue — primary brand color)
Accent Bright:          #3DAFD6   (lighter variant for dark backgrounds)
Accent Hover:           #2B85A9   (pressed/hover state)
Accent Subtle:          rgba(51, 157, 199, 0.15)  (chips, tags, backgrounds)
Rain Coverage:          #E1F0F7   (Light Blue — Rain Coverage feature only)
Success:                #22C55E
Warning:                #F59E0B
Error:                  #EF4444
Info:                   #3B82F6
```

### Light Mode
```
Background Primary:     #FAFAFA
Background Secondary:   #F4F4F5
Background Elevated:    #FFFFFF
Surface:                #FFFFFF
Border Subtle:          #E4E4E7
Border Default:         #D4D4D8

Text Primary:           #0A0A0A
Text Secondary:         #525252
Text Tertiary:          #A3A3A3
Text Disabled:          #D4D4D4

Accent Primary:         #339DC7   (FOAM Blue — primary brand color)
Accent Hover:           #2B85A9   (pressed/hover state)
Accent Subtle:          rgba(51, 157, 199, 0.10)  (chips, tags, backgrounds)
Rain Coverage:          #E1F0F7   (Light Blue — Rain Coverage feature only)
Success:                #16A34A
Warning:                #D97706
Error:                  #DC2626
```

---

## Typography

### Scale
```
Display XL:   32px / 700 weight / -0.5px tracking
Display L:    28px / 700 weight / -0.5px tracking
Heading 1:    24px / 600 weight / -0.3px tracking
Heading 2:    20px / 600 weight / -0.2px tracking
Heading 3:    18px / 600 weight / 0px tracking
Body L:       16px / 400 weight / 0px tracking
Body M:       14px / 400 weight / 0px tracking
Body S:       13px / 400 weight / 0px tracking
Caption:      12px / 400 weight / 0.2px tracking
Label:        11px / 500 weight / 0.5px tracking / uppercase
```

### Font Family

**Display & Headlines:** Playfair Display (Google Fonts, free)
- Weights used: 700, 800 (Bold, Extra Bold)
- High-contrast serif matching the FOAM wordmark character
- Used for: Onboarding headlines, feature callouts, marketing headlines, display text
- Fallback: Cormorant Garamond, Georgia, serif

**Body & Interface:** Inter (Google Fonts, free)
- Weights used: 400, 500, 600
- Used for: Body copy, UI labels, form fields, data and numbers, captions
- Fallback: system-ui, -apple-system, sans-serif

```css
--font-display: 'Playfair Display', 'Cormorant Garamond', Georgia, serif;
--font-body:    'Inter', system-ui, -apple-system, sans-serif;
```

---

## Spacing System
Base unit: 4px

```
2px   — micro (icon padding, hairline gaps)
4px   — xs
8px   — sm
12px  — md-sm
16px  — md (standard component padding)
20px  — md-lg
24px  — lg
32px  — xl
40px  — 2xl
48px  — 3xl
64px  — 4xl
```

---

## Border Radius
```
Pill:     9999px (tags, badges, chips)
XL:       20px (cards, bottom sheets, modals)
L:        16px (large cards)
M:        12px (standard cards, inputs)
S:        8px (small components, buttons)
XS:       4px (subtle rounding)
```

---

## Elevation / Shadow

### Dark Mode
```
Level 1: 0 1px 3px rgba(0,0,0,0.4)
Level 2: 0 4px 12px rgba(0,0,0,0.5)
Level 3: 0 8px 24px rgba(0,0,0,0.6)
Level 4: 0 16px 48px rgba(0,0,0,0.7)
```

### Light Mode
```
Level 1: 0 1px 3px rgba(0,0,0,0.08)
Level 2: 0 4px 12px rgba(0,0,0,0.10)
Level 3: 0 8px 24px rgba(0,0,0,0.12)
Level 4: 0 16px 48px rgba(0,0,0,0.15)
```

---

## Component Library

### Buttons
```
Primary:    Filled, accent color, 48px height, 16px horizontal padding
Secondary:  Outlined, accent border, same dimensions
Ghost:      No border, text only, same dimensions
Destructive: Filled, error color
Disabled:   Reduced opacity, not interactive
```

All buttons: 8px border radius, 600 weight label, 14px font size.

### Inputs
```
Height:         52px
Border:         1px subtle border default
Active border:  Accent color
Error border:   Error color
Border radius:  12px
Padding:        16px horizontal
Label:          12px, secondary text, above input
```

### Cards
```
Background:     Surface color
Border:         1px subtle border
Border radius:  16px
Padding:        16px
Shadow:         Level 1 elevation
```

### Bottom Sheets
```
Border radius:  20px top corners
Handle:         32px wide, 4px tall, tertiary color
Background:     Background Elevated
Max height:     85% viewport
```

### Rating Stars
```
Size:     16px (inline), 24px (review screen)
Filled:   Warning color (#F59E0B / #D97706)
Empty:    Border Default color
```

---

## Iconography
- Style: Rounded, consistent stroke weight (2px)
- Sizes: 16px (inline), 20px (nav), 24px (standard), 32px (featured)
- Library: Lucide Icons or similar open source set with rounded style
- Custom icons for app-specific concepts (detailing services, crew, vehicle types)

---

## Motion Principles
Defined in Interaction Principles document. Summary:
- Fast and purposeful. Not decorative.
- Standard duration: 200-250ms
- Easing: ease-out for entrances, ease-in for exits
- No animation longer than 400ms except onboarding
