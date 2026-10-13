# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Rhythm serves community members who want to build sustainable habits that transform their daily lives. They follow a structured, multi-week daily programme in English or Simplified Chinese, using it primarily on mobile.

## Product Purpose

Rhythm helps people establish sustainable rhythms for their mental, emotional, and physical wellbeing while drawing closer to God. Success means members can return to meaningful daily practices and carry them into everyday life.

## Positioning

Rhythm combines a God-centred devotional journey with practical daily habit-building across three connected dimensions: Mental, Emotional, and Physical. Its daily programme brings together devotionals, scripture, reflection, mood logging, and exercises instead of treating spiritual growth and daily wellbeing as separate tracks.

## Operating Context

Members progress through a structured programme of blocks and daily tasks in an installable mobile PWA. Daily work can include devotionals, scripture readings, mood logs, and exercises; members can track completion and progress, join community activity, and manage their profile and notification preferences. The product has English and Simplified Chinese locale-aware flows.

## Capabilities and Constraints

- The product is a Next.js web application and PWA with locale-parameterised English and Simplified Chinese routes.
- Authentication is passwordless email OTP; passwords are not part of the product.
- Programme content is stored as Markdown, not in the database. Its immutable `t_` + ULID task identifiers must be preserved because progress records reference them.
- Devotional and emotional programme content is supplied by the content team in Word documents and must be imported verbatim rather than rewritten.
- Member progress supports optimistic updates; the programme’s Mental, Emotional, and Physical dimensions are fixed product terminology.

## Brand Commitments

- The product name is Rhythm.
- The product must support both English and Simplified Chinese throughout its member experience.
- The spiritual purpose is explicit: Rhythm helps people get closer to God.
- Existing brand and product assets include the Rhythm app icons and logo under `public/icons/` and `public/live/`, along with licensed local typefaces under `public/fonts/`.

## Evidence on Hand

- Product and technical context: `AGENTS.md`.
- Existing public landing and app routes: `app/[locale]/`.
- Programme source content: `data/program/`.
- Translation strings: `messages/en.json` and `messages/zh.json`.
- Existing mobile/PWA assets and manifest: `public/manifest.json`, `public/icons/`, and `public/splash/`.
- Existing visual system: `DESIGN.md`.

## Product Principles

1. Build practices members can sustain in ordinary daily life.
2. Let every core journey support deeper closeness to God.
3. Treat mental, emotional, and physical wellbeing as connected parts of one rhythm.
4. Keep the programme faithful to its authored content and continuous across member progress.
5. Give English- and Simplified-Chinese-speaking members equivalent access to the experience.
