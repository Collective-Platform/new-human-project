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
  control: 1rem
  card: 1.5rem
  sheet: 2rem
  full: 9999px
shadows:
  card: "0 4px 16px rgba(53,50,47,0.06)"
  raised: "0 16px 40px rgba(53,50,47,0.10)"
  float: "0 24px 64px rgba(53,50,47,0.18)"
  glow: "0 10px 15px -3px rgba(190,43,23,0.2)"
motion:
  duration-fast: 120ms
  duration-base: 200ms
  duration-slow: 280ms
  ease-out: "cubic-bezier(0.23, 1, 0.32, 1)"
  ease-drawer: "cubic-bezier(0.32, 0.72, 0, 1)"
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
    shadow: "{shadows.glow}"
    pressScale: 0.97
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
    radius: "{rounded.control}"
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
    radius: "{rounded.card}"
    shadow: "{shadows.card}"
    shadowHover: "{shadows.raised}"
  sheet:
    backgroundColor: "{colors.surface}"
    radius: "{rounded.sheet}"
    shadow: "{shadows.float}"
  hover-tint:
    backgroundColor: "rgba(53,50,47,0.05)"
---

## Overview

Rhythm is a calm, editorial wellness app. The mood is **warm and grounded** — a
soft off-white canvas, ink-dark text, and a single confident red that owns every
call to action. It should feel less like a clinical dashboard and more like a
thoughtfully printed journal: tight, calm spacing, softly rounded surfaces, and
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
  (Medium)**; this is intentional and overrides any `font-*` weight class on a
  headline, so do not add one. GT America has no semibold, so weight 600
  resolves to Bold via fallback.
- **Nowstalgic** — the **display** face. Reserve it for large expressive moments:
  oversized numerals, the wordmark, hero counts (`display-lg` / `display-xl`).
  Never use it for body copy.
- **Kaiti SC Black** — CJK display face for large Simplified Chinese headings
  (`cjk-display`). Latin text falls back through Noto Sans SC → PingFang SC for
  body in Chinese locale.

Body text defaults to `body-md`/`body-sm`. The two densest UI sizes — `0.75rem`
(caption) and `0.875rem` (body-sm/label) — carry most of the interface, so keep
them at sufficient contrast (`on-surface` / `on-surface-variant`).

- **Smallest size is `text-xs` (12px).** Do not use `text-[9px]`, `text-[10px]`
  or `text-[11px]`, including bottom-nav labels, chips and chart labels. Text
  inputs are 16px, so iOS does not zoom the page.
- **Weights in use:** `font-normal` for body, `font-medium` for labels and
  emphasis, `font-semibold` for buttons and strong emphasis. Do not use
  `font-bold`, `font-extrabold` or `font-light`. `font-black` is only for
  Nowstalgic display numerals (for example the live banner) and `/live`.

## Layout

- **Mobile-first PWA.** The app is designed for a portrait phone viewport with
  safe-area insets (`viewportFit: cover`) and a persistent bottom navigation bar.
- **Spacing scale** is an 8px-based rhythm: `xs 4 / sm 8 / md 16 / lg 24 /
xl 32`. Prefer multiples of 8 for padding and gaps.
- **Tight and calm.** Cards use 16px internal padding (`p-4`), inputs use 16px
  horizontal and 12px vertical, and gaps between cards are 12px (`gap-3`). Do not
  add extra padding to make a screen feel roomy. Show more content per screen.
- **Content width** is constrained to a single readable column on mobile; avoid
  multi-column layouts.
- **Touch targets are at least 44px.** A small control keeps its look and gets
  an invisible 44px area through the `tap-target` class. Do not add it to
  full-width list rows, calendar cells or links inside a sentence.

## Elevation & Depth

Depth is expressed through **soft, warm, low-opacity shadows**, never hard lines.
Use only these tokens. Do not write custom `shadow-[...]` values.

| Token           | Value                                  | Use                                 |
| --------------- | -------------------------------------- | ----------------------------------- |
| `shadow-card`   | `0 4px 16px rgba(53,50,47,0.06)`       | A card at rest                      |
| `shadow-raised` | `0 16px 40px rgba(53,50,47,0.10)`      | Hover lift, menus, avatars          |
| `shadow-float`  | `0 24px 64px rgba(53,50,47,0.18)`      | Dialogs and sheets                  |
| `shadow-glow`   | `0 10px 15px -3px rgba(190,43,23,0.2)` | Red glow under primary buttons only |

- Shadows use the ink color (`#35322f`) at low alpha. Keep them diffuse.
- Do not use Tailwind's default `shadow-sm`, `shadow-lg`, `shadow-xl` or
  `shadow-2xl`.

## Shapes

Rhythm uses **soft, friendly corner radii**, not bubbles. Use only these tokens.

| Token             | Value  | Use                                           |
| ----------------- | ------ | --------------------------------------------- |
| `rounded-control` | 16px   | Inputs, buttons that are not pills, menu rows |
| `rounded-card`    | 24px   | Content cards                                 |
| `rounded-sheet`   | 32px   | Dialogs and bottom sheets                     |
| `rounded-full`    | 9999px | Pill buttons, toggle pills, tags, avatars     |

- Do not round more than the token for the surface. Sharp 4px corners are off-brand.
- Do not use Tailwind's `rounded-sm`, `-md`, `-lg`, `-xl`, `-2xl` or `-3xl` in new
  code. The theme still defines `--radius-sm/md/lg` (16, 32 and 48px) for a few
  small tiles: skeleton blocks, calendar cells and chart bar tops. These are
  data shapes, not UI surfaces.

## Motion

Motion tokens live in `app/globals.css`. Use the tokens. Do not type a number.

| Token             | Value                            | Use                                                             |
| ----------------- | -------------------------------- | --------------------------------------------------------------- |
| `--duration-fast` | 120ms                            | Press, hover, color changes (also the default for `transition`) |
| `--duration-base` | 200ms                            | Fades, small popups, pop-in                                     |
| `--duration-slow` | 280ms                            | Sheets, slide-in panels, the nav pill                           |
| `--ease-out`      | `cubic-bezier(0.23, 1, 0.32, 1)` | Default curve. Also the Tailwind `ease-out`.                    |
| `--ease-drawer`   | `cubic-bezier(0.32, 0.72, 0, 1)` | Sheets and panels (`ease-drawer`)                               |

- **Never use `ease-in`.** It feels slow.
- **Name the properties.** Do not use `transition-all`.
- **Exit is faster than enter.** Fades leave in 120ms. Sheets and panels leave in 200ms.
- **Press feedback:** every tappable control shrinks to 97% on press, in 120ms.
  Add `press`. Wide cards use `press-soft` (99%). Disabled controls do not move.
- **Hover:** use one tint for neutral controls: `hover:bg-on-surface/5` (5% warm
  ink). Filled buttons use `hover:opacity-90`. Plain text rows use
  `hover:opacity-70`.
- **Reduced motion:** the app falls back to a plain fade. Keep this working.

## Components

- **Primary Button:** Full-pill, `primary` background, white text, semibold,
  ~14px vertical padding, full-width, with `shadow-glow`. Variants
  `emotional` and `physical` swap the fill to the matching category color.
  States: `hover:opacity-90`, `press` (shrinks to 97% on press), disabled at
  50% opacity with no shadow.
- **Field Input:** Borderless, fill on `surface-container-high`, `rounded-control`,
  medium-weight foreground text, `outline-variant` placeholder, focus ring in
  `primary-container`.
- **Toggle Pill:** Full-pill segmented control. Selected state uses a tonal
  container + matching `ring-*/20` (secondary, tertiary, emotional, physical);
  unselected sits on `surface-container-high` with `on-surface-variant` text and
  brightens on hover. Uses `press` for tactile press.
- **Card:** White `surface-container`, `rounded-card`, `shadow-card` — the
  primary content container throughout the app. A card that can be tapped uses
  `press-soft` and may lift to `shadow-raised` on hover.
- **Overlay (modal, sheet, full-screen page, side panel):** Always use
  `app/components/overlay.tsx`. Variants: `center`, `sheet` (bottom sheet on
  phones, centered dialog from 640px wide), `fullscreen`, `panel` (slides in from
  the right). One shared backdrop (black at 40% with a light blur), one enter
  motion, one exit motion. Dialog panels use `rounded-sheet` and `shadow-float`.

## Do's and Don'ts

- **Do** reserve `primary` red for one clear action per view.
- **Do** keep category colors strictly tied to their dimension (Mental=amber,
  Emotional=teal, Physical=sky blue).
- **Do** use Nowstalgic only for large display numerals and the wordmark.
- **Do** keep headline elements at weight 500 — don't bold them.
- **Do** design mobile-first with the bottom nav and safe-area insets in mind.
- **Do** use the radius, shadow and motion tokens. Do not type custom values.
- **Do** add `press` to every tappable control and `tap-target` to any control under 44px.
- **Do** keep text at 12px or larger.
- **Do** verify every screen in both English and Simplified Chinese.
- **Don't** introduce new accent colors or gradients outside this palette.
- **Don't** use hard borders or heavy drop shadows for elevation.
- **Don't** use small, sharp corners. Use the radius tokens.
- **Don't** write `{open && <div className="fixed inset-0 …">}`. Use the Overlay component.
- **Don't** use `transition-all`, `ease-in`, or `font-bold` / `font-light`.
- **Don't** use raw Tailwind greys (`zinc-*`, `neutral-*`) or hex colors in components. Use the tokens.
- **Don't** set body copy in Nowstalgic or use category colors decoratively.
