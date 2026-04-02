# Rope Design System

> A Bible journaling app built around the ROPE framework: **Read, Observe, Pray, Execute.**

---

## Design Philosophy

**"Spiritual Contemplation"** — warm, earthy, intentional. Every surface should feel like opening a well-loved journal by candlelight. Restraint over decoration. Clarity over cleverness. The UI should disappear so the Scripture can breathe.

---

## Color Palette

### Light Mode

| Token | Hex | Usage |
|---|---|---|
| Ivory | `#f5efe3` | Primary background |
| Cream | `#ebe4d4` | Card surfaces, secondary bg |
| Cream Dark | `#ddd5c3` | Tertiary layers, dividers |
| Brown | `#5c4327` | Primary text, buttons, interactive elements |
| Brown Light | `#7d6245` | Hover states |
| Very Dark | `#2e2418` | Highest-contrast text |
| Muted | `#9a8e7a` | Secondary text, captions |
| Muted Light | `#b8ad9a` | Tertiary text, placeholders |
| Sidebar | `#e6ddd0` | Sidebar background |

### Accent Colors (consistent across themes)

| Token | Hex | Semantic |
|---|---|---|
| Accent Gold | `#c4a265` | Primary accent, CTAs, praise |
| Accent Olive | `#7a8c6a` | Prayer, growth, nature |
| Struggle Warm | `#b86b4e` | Struggle, warning |
| Prayer Green | `#6d8c5c` | Success, prayer execution |
| Praise Gold | `#c4a044` | Progress, praise |

### Dark Mode

Dark mode inverts the palette while keeping warmth — gold replaces brown as the primary interactive color. No cool grays.

| Light Token | Dark Value |
|---|---|
| Ivory | `#1a1714` |
| Cream | `#231f1a` |
| Brown | `#c4a265` (gold) |
| Dark | `#e8e0d4` |
| Muted | `#8a7e6a` |

---

## Typography

### Families

- **Serif:** Playfair Display (Georgia, "Times New Roman" fallback) — headings, titles, hero text
- **Sans-serif:** Inter (system-ui fallback) — body text, labels, UI chrome

### Scale

| Level | Size | Weight | Font | Usage |
|---|---|---|---|---|
| Hero | `clamp(4.5rem, 18vw, 14rem)` | 700 | Serif | Splash page ROPE letters |
| Display | `2.5rem` | 700 | Serif | Page headings |
| Headline | `1.875rem` | 600 | Serif | Section headers |
| Subheading | `1.125rem` | 600 | Serif | Card titles |
| Body | `1rem` / `0.875rem` | 400 | Sans | Standard copy |
| Small | `0.75rem` | 500 | Sans | Labels, metadata |
| Tiny | `0.625rem` | 600 | Sans | Utility labels |

### Letter Spacing

- Headings: `-0.01em`
- Labels/tracking: `0.15em` to `0.4em`
- Body: normal

---

## Spacing

| Token | Value | Usage |
|---|---|---|
| xs | `0.5rem` (8px) | Minimal spacing |
| sm | `0.75rem` (12px) | Compact sections |
| md | `1rem` (16px) | Standard padding |
| lg | `1.5rem` (24px) | Container padding |
| xl | `2rem` (32px) | Section padding |

---

## Shadows

All shadows use warm dark-brown tints (`rgba(46, 36, 24, ...)`) to maintain warmth.

| Level | Value |
|---|---|
| Card | `0 1px 3px rgba(46, 36, 24, 0.06), 0 1px 2px rgba(46, 36, 24, 0.04)` |
| Card Hover | `0 4px 12px rgba(46, 36, 24, 0.08), 0 2px 4px rgba(46, 36, 24, 0.04)` |
| Elevated | `0 8px 24px rgba(46, 36, 24, 0.1), 0 2px 8px rgba(46, 36, 24, 0.06)` |

Dark mode shifts shadows to pure black with slightly higher opacity.

---

## Component Patterns

### Card Surface

```css
background: linear-gradient(135deg, var(--color-cream) 0%, #ede6d6 50%, var(--color-cream) 100%);
border: 1px solid rgba(92, 67, 39, 0.08);
border-radius: 1rem;
box-shadow: var(--shadow-card);
```

### Primary Button

```css
background: var(--color-brown);
color: var(--color-ivory);
padding: 0.75rem 1.5rem;
border-radius: 12px;
font-weight: 600;
/* Hover: lighten bg, translateY(-1px), deeper shadow */
/* Disabled: 40% opacity */
```

### Section Divider

```css
height: 1px;
background: linear-gradient(90deg, transparent, rgba(92, 67, 39, 0.12) 20%, rgba(92, 67, 39, 0.12) 80%, transparent);
```

### Step Badge (ROPE steps)

```css
width: 2.5rem; height: 2.5rem;
border-radius: 50%;
background: var(--color-brown);
color: var(--color-ivory);
font: bold 0.875rem serif;
```

### Input/Textarea

```css
background: var(--color-ivory);
border: 1px solid rgba(92, 67, 39, 0.1);
/* Focus: brown border + 3px glow ring */
```

---

## Animation

### Keyframes

| Name | Duration | Description |
|---|---|---|
| `fadeIn` | 0.4s | Y(8px) to Y(0) with opacity |
| `fadeInUp` | 0.5s | Y(16px) to Y(0) |
| `pulse-gentle` | 3s infinite | Subtle opacity pulse |
| `breathe` | 3s infinite | Scale + expanding glow (centering moment) |
| `shimmer` | Background position shift |

### Timing

- Fast (UI feedback): 0.15s
- Standard (interactions): 0.2s–0.3s
- Medium (page transitions): 0.4s–0.5s
- Slow (breathing exercises): 2s–3s

### Easing

- Entrances: `ease-out`
- Looping: `ease-in-out`
- Staggered delays via `animationDelay`

---

## Layout

### Responsive Strategy

Mobile-first. Breakpoints:
- Default: mobile
- `md` (768px): desktop sidebar visible
- `xl` (1280px): right sidebar panel

### Structure

- **Mobile:** Full-width content + fixed 64px bottom nav
- **Desktop:** Fixed 256px left sidebar + fluid content
- **XL:** + 280px right sidebar

### Containers

- Mobile: `max-w-lg` (512px), `px-5`
- Desktop: `max-w-2xl` (672px), `px-4`
- Vertical: `pt-6 pb-8`

---

## ROPE Framework UI

The four steps form the core journaling flow:

1. **R — Read** — Select and display Scripture passage
2. **O — Observe** — Note what stands out, context, patterns
3. **P — Pray** — Turn observations into prayer
4. **E — Execute** — Commit to a specific action

Each step gets a numbered badge (serif, bold) and its own card. The flow is vertical and sequential — users move through steps in order. The Insights page shows ROPE Balance bars to track which steps get the most attention.

---

## Iconography

Custom SVG accents throughout:
- Subtle cross (splash, accents)
- Olive branches (prayer, growth)
- Lamp/candle (insight, illumination)
- Decorative flourishes at section breaks

---

## Accessibility

- High contrast ratios maintained in both themes
- Semantic HTML structure
- Focus rings: `ring-2 ring-brown/30 ring-offset-1`
- Custom scrollbars: 6px, muted thumb color, doesn't visually intrude

---

## Design Principles

1. **Warmth** — Brown and gold, never clinical grays
2. **Intentionality** — Every element serves the contemplative experience
3. **Restraint** — Minimal decoration, maximum clarity
4. **Responsiveness** — Mobile-first, thoughtful desktop enhancements
5. **Reverence** — The UI should feel like sacred space, not a productivity tool
