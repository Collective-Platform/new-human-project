---
version: alpha
name: Rhythm
description: >-
  Visual identity for Rhythm — a bilingual (EN/ZH) PWA for building healthy
  rhythms across three dimensions: Mental, Emotional, and Physical. Warm,
  grounded, and editorial, with a single confident red accent driving action.
colors:
  # Core
  background: "#fafafa"
  foreground: "#171717"
  primary: "#be2b17"
  on-primary: "#f4f5f5"
  secondary: "#135db9"
  tertiary: "#645f50"
  # Surfaces
  surface: "#f4f5f5"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#ffffff"
  surface-container: "#ffffff"
  surface-container-high: "#f4f5f5"
  surface-container-highest: "#ffffff"
  # On-surface text + outlines
  on-surface: "#35322f"
  on-surface-variant: "#625e5b"
  outline: "#7e7a76"
  outline-variant: "#b6b1ad"
  bar-track: "#f3f4f4"
  # Tonal containers
  primary-dim: "#ab0010"
  primary-container: "#ffaca3"
  on-primary-container: "#7f0009"
  secondary-container: "#d7e2ff"
  on-secondary-container: "#004fa5"
  tertiary-container: "#fef6e3"
  on-tertiary-fixed-variant: "#6d6859"
  # Category — Mental
  category-mental: "#d99100"
  category-mental-bg: "#fdf4e1"
  # Category — Emotional
  category-emotional: "#256a65"
  category-emotional-bg: "#effffe"
  # Category — Physical
  category-physical: "#3688d8"
  category-physical-bg: "#e0f0ff"
typography:
  display-xl:
    fontFamily: Nowstalgic
    fontSize: 10rem
    fontWeight: 900
    lineHeight: "0.9"
  display-lg:
    fontFamily: Nowstalgic
    fontSize: 9rem
    fontWeight: 900
    lineHeight: "0.9"
  h1:
    fontFamily: GT America
    fontSize: 3rem
    fontWeight: 500
    lineHeight: "1.1"
  h2:
    fontFamily: GT America
    fontSize: 2.25rem
    fontWeight: 500
    lineHeight: "1.15"
  h3:
    fontFamily: GT America
    fontSize: 1.875rem
    fontWeight: 500
    lineHeight: "1.2"
  title-lg:
    fontFamily: GT America
    fontSize: 1.5rem
    fontWeight: 500
    lineHeight: "1.25"
  title-md:
    fontFamily: GT America
    fontSize: 1.25rem
    fontWeight: 500
    lineHeight: "1.3"
  body-lg:
    fontFamily: GT America
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: "1.5"
  body-md:
    fontFamily: GT America
    fontSize: 1rem
    fontWeight: 400
    lineHeight: "1.5"
  body-sm:
    fontFamily: GT America
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: "1.5"
  label:
    fontFamily: GT America
    fontSize: 0.875rem
    fontWeight: 600
    lineHeight: "1.2"
  caption:
    fontFamily: GT America
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: "1.3"
  cjk-display:
    fontFamily: Kaiti SC Black
    fontSize: 3rem
    fontWeight: 900
    lineHeight: "1.2"
rounded:
  sm: 1rem
  md: 2rem
  lg: 3rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    radius: "{rounded.full}"
    fontWeight: 600
    fontSize: "{typography.body-sm.fontSize}"
    paddingY: 14px
    shadow: "0 10px 15px -3px rgba(190,43,23,0.2)"
  button-emotional:
    backgroundColor: "{colors.category-emotional}"
    textColor: "#ffffff"
    radius: "{rounded.full}"
  button-physical:
    backgroundColor: "{colors.category-physical}"
    textColor: "#ffffff"
    radius: "{rounded.full}"
  field-input:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.foreground}"
    placeholderColor: "{colors.outline-variant}"
    radius: "{rounded.md}"
    focusRing: "{colors.primary-container}"
    paddingX: 16px
    paddingY: 12px
  toggle-pill:
    radius: "{rounded.full}"
    selectedBackground: "{colors.secondary-container}"
    selectedText: "{colors.on-secondary-container}"
    unselectedBackground: "{colors.surface-container-high}"
    unselectedText: "{colors.on-surface-variant}"
  card:
    backgroundColor: "{colors.surface-container}"
    radius: "{rounded.md}"
    shadow: "0 12px 32px rgba(53,50,47,0.06)"
    shadowHover: "0 16px 40px rgba(53,50,47,0.08)"
---

## Overview

Rhythm is a calm, editorial wellness app. The mood is **warm and grounded** — a
soft off-white canvas, ink-dark text, and a single confident red that owns every
call to action. It should feel less like a clinical dashboard and more like a
thoughtfully printed journal: generous whitespace, large rounded surfaces, and
big expressive numerals for moments that matter (streaks, day counts, scores).

The product is **bilingual (English / Simplified Chinese)**. Every type and
layout decision must survive a language switch, including a dedicated CJK display
typeface for large Chinese headings.

## Colors

The palette is built on warm neutrals, a single brand red, and three fixed
category hues that map to the program's three dimensions.

- **Primary () — Vermilion Red:** The brand color and the only driver of primary
  action. Buttons, active states, streaks, key emphasis. Use sparingly so it
  retains its weight. `primary-dim ()` and `primary-container ()` /
  `on-primary-container ()` provide pressed and tonal variants.
- **Secondary () — Cobalt Blue:** Secondary actions, links, and selected
  toggle states via `secondary-container ()` / `on-secondary-container ()`.
- **Tertiary () — Warm Stone:** Muted accent for low-emphasis chrome, backed by
  `tertiary-container ()` for soft beige fills.
- **Background () / Foreground ():** Near-white limestone canvas and near-black
  ink — the default page contrast pair.
- **Surfaces:** `surface ()` is the warm gray app shell; the
  `surface-container-*` ramp goes from white () up to warm gray () for cards,
  inputs, and layered panels.
- **On-surface text:** `on-surface ()` for primary text on cards,
  `on-surface-variant ()` for secondary text, `outline ()` and
  `outline-variant ()` for borders and dividers.

### Category Colors

Each program dimension has a saturated accent and a tinted background. These are
**semantic and fixed** — never swap them or use them decoratively.

- **Mental () on ():** Amber / gold.
- **Emotional () on ():** Teal.
- **Physical () on ():** Sky blue.

## Typography

Three typeface roles, with Chinese fallbacks injected via `next/font`.

- **GT America** — the workhorse for `h1`–`h3`, titles, body, labels, and
  captions. Headline elements (`.font-headline`) are pinned to **weight 500
  (Medium)**; this is intentional and overrides Tailwind's `font-bold` to keep a
  consistent type hierarchy. GT America has no semibold, so weight 600 resolves
  to Bold via fallback.
- **Nowstalgic** — the **display** face. Reserve it for large expressive moments:
  oversized numerals, the wordmark, hero counts (`display-lg` / `display-xl`).
  Never use it for body copy.
- **Kaiti SC Black** — CJK display face for large Simplified Chinese headings
  (`cjk-display`). Latin text falls back through Noto Sans SC → PingFang SC for
  body in Chinese locale.

Body text defaults to `body-md`/`body-sm`. The two densest UI sizes — `0.75rem`
(caption) and `0.875rem` (body-sm/label) — carry most of the interface, so keep
them at sufficient contrast (`on-surface` / `on-surface-variant`).

## Layout

- **Mobile-first PWA.** The app is designed for a portrait phone viewport with
  safe-area insets (`viewportFit: cover`) and a persistent bottom navigation bar.
- **Spacing scale** is an 8px-based rhythm: `xs 4 / sm 8 / md 16 / lg 24 /
  xl 32`. Prefer multiples of 8 for padding and gaps.
- **Generous padding.** Cards and inputs use comfortable internal padding
  (16px horizontal, 12–14px vertical) and sit on the warm `surface` shell.
- **Content width** is constrained to a single readable column on mobile; avoid
  multi-column dense layouts.

## Elevation & Depth

Depth is expressed through **soft, warm, low-opacity shadows**, never hard lines.

- **Card:** `0 12px 32px rgba(53,50,47,0.06)` at rest, lifting to
  `0 16px 40px rgba(53,50,47,0.08)` on hover.
- **Primary button:** colored shadow tinted toward the button's own hue
  (e.g. red glow under the primary CTA) for a tactile, lifted feel.
- Shadows use the ink color () at very low alpha — keep them subtle and diffuse.

## Shapes

Rhythm is defined by **large, friendly corner radii**.

- `rounded.sm` = **1rem (16px)** — inputs, small chips.
- `rounded.md` = **2rem (32px)** — cards, panels, the default surface radius.
- `rounded.lg` = **3rem (48px)** — large hero containers.
- `rounded.full` = **9999px** — all buttons and toggle pills are fully rounded.

When in doubt, round more, not less. Sharp 4px corners are off-brand.

## Components

- **Primary Button:** Full-pill, `primary` background, white text, semibold,
  ~14px vertical padding, full-width, with a soft colored shadow. Variants
  `emotional` and `physical` swap the fill to the matching category color.
  States: `hover:opacity-90`, `active:scale-[0.99]`, disabled at 50% opacity with
  no shadow.
- **Field Input:** Borderless, fill on `surface-container-high`, `rounded.sm`,
  medium-weight foreground text, `outline-variant` placeholder, focus ring in
  `primary-container`.
- **Toggle Pill:** Full-pill segmented control. Selected state uses a tonal
  container + matching `ring-*/20` (secondary, tertiary, emotional, physical);
  unselected sits on `surface-container-high` with `on-surface-variant` text and
  brightens on hover. `active:scale-95` for tactile press.
- **Card:** White `surface-container`, `rounded.md`, soft card shadow — the
  primary content container throughout the app.

## Do's and Don'ts

- **Do** reserve `primary` red for one clear action per view.
- **Do** keep category colors strictly tied to their dimension (Mental=amber,
  Emotional=teal, Physical=sky blue).
- **Do** use Nowstalgic only for large display numerals and the wordmark.
- **Do** keep headline elements at weight 500 — don't bold them.
- **Do** design mobile-first with the bottom nav and safe-area insets in mind.
- **Do** verify every screen in both English and Simplified Chinese.
- **Don't** introduce new accent colors or gradients outside this palette.
- **Don't** use hard borders or heavy drop shadows for elevation.
- **Don't** use small, sharp corners — favor the generous radius scale.
- **Don't** set body copy in Nowstalgic or use category colors decoratively.
