# The roster card hover glow (retired)

> **Status: retired.** The Broadcast redesign (decision 17) replaced the home
> card grid with roster rows, so nothing renders these sprites any more and
> they are deleted from `public/`. The technique below — pre-rendered glow
> sprites over live `drop-shadow`, compositor-only animation — remains the
> playbook if a card glow ever returns; `scripts/generate-card-glow.mjs`
> still bakes the sprites.

The glow behind a roster card on hover is **not** a CSS `drop-shadow` — it is a
pre-rendered image: the card frame's silhouette, tinted to the frame's colour,
Gaussian-blurred, and baked into a small webp. The hover then animates only
compositor-friendly properties: `transform` for the lift, `opacity` to fade the
sprite in.

## Why a baked sprite

The obvious implementation — `filter: drop-shadow(...)` on the card,
transitioned on hover — fails three ways:

1. **Transitioning a filter is slow.** The browser re-rasterizes the filtered
   element on every frame of the transition. That was the hover jank, worst in
   WebKit.
2. **Engines disagree about drop-shadow even when it is static.** For the same
   blur radius, Chromium paints a wide soft halo while WebKit paints a much
   tighter one — the effect simply doesn't look the same in Safari and Chrome.
3. **WebKit clips the filter's paint region.** In Safari the halo was cut off
   with hard edges; in Playwright's WebKit some variants rendered it warped.
   This is the bug that kept resurfacing however the filter was arranged.

An image has none of these problems: it renders identically in every engine,
costs nothing at runtime, and fading it with `opacity` stays on the compositor.

## The moving parts

| Piece         | Where                                                                          |
| ------------- | ------------------------------------------------------------------------------ |
| Source frames | `public/card-frame-p1.png`, `public/card-frame-p2.png`                         |
| Generator     | `scripts/generate-card-glow.mjs` (tints, blur, and padding live here)          |
| Baked sprites | `public/card-glow-p1.webp`, `public/card-glow-p2.webp` (~19KB each, committed) |
| Consumer      | `RosterCard` (`src/features/dashboard/components/roster-card.tsx`)             |

The sprite is larger than the frame: the generator adds transparent padding on
every side so the blur has room to breathe. The consumer positions the sprite
with percentage insets that must match the generator's ratios:

- horizontal inset = `PAD / W` → currently 48/240 = **20%** per side
- vertical inset = `PAD / H` → currently 48/383 ≈ **12.53%** per side
- so the sprite box is **140%** of the card's width and **≈125.06%** of its height

Those four numbers are the arbitrary values on the `<img>` in `RosterCard`
(`left-[-20%] top-[-12.53%] w-[140%] h-[125.06%]`).

## If you change things

**Changed a frame PNG, or want a different tint, blur, or glow strength**
(tints and `BLUR` are constants in the generator):

```bash
node scripts/generate-card-glow.mjs
```

Run it from the repo root and commit the regenerated webps. It drives a
headless Chromium canvas via the repo's Playwright, so the browser binary must
be present (`pnpm exec playwright install chromium` once per machine).

**Changed the generator's `W`, `PAD`, or the frame's aspect ratio:** the
percentage insets in `RosterCard` must be recomputed with the formulas above,
or the glow will sit offset from the card. `BLUR` must stay comfortably inside
`PAD` (currently half of it) or the halo will clip inside the sprite itself —
which is the exact bug this design exists to avoid.

**Added a new frame variant (a third side/colour):** add its tint to the
generator's `TINTS`, regenerate, and add the sprite path to `GLOW_SPRITES` in
`RosterCard`.

**Verifying:** Chromium says nothing about Safari here — check the hover in
real Safari, or render with Playwright's WebKit
(`pnpm exec playwright install webkit`, then drive `webkit.launch()` at
`deviceScaleFactor: 2`), and look at the halo around the shield's bottom point
and sides — that's where the filter approach used to clip.
