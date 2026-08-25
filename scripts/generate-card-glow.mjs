// Bakes public/card-glow-{p1,p2}.webp — the roster cards' hover glow — from
// the card frame PNGs: silhouette, tinted per side, Gaussian-blurred, with
// proportional padding so the halo never clips. Pre-rendering instead of a
// runtime drop-shadow filter keeps the glow identical across engines (WebKit
// clips filter regions and engines disagree on drop-shadow spread) and keeps
// the hover animating only compositor-friendly properties.
//
// The consuming CSS in roster-card.tsx depends on the ratios below:
// PAD / W = 20% (horizontal inset) and PAD / H = 12.53% (vertical inset).
//
// Run from the repo root after changing a frame or tint:
//   node scripts/generate-card-glow.mjs

import { createRequire } from "node:module"
import fs from "node:fs"

const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")

const TINTS = {
  p1: "rgba(224, 120, 66, 0.85)",
  p2: "rgba(92, 142, 232, 0.85)",
}

const browser = await chromium.launch()
const page = await browser.newPage()

for (const [side, color] of Object.entries(TINTS)) {
  const frame = fs
    .readFileSync(`public/card-frame-${side}.png`)
    .toString("base64")
  const dataUrl = await page.evaluate(
    async ([b64, tint]) => {
      const img = new Image()
      img.src = `data:image/png;base64,${b64}`
      await img.decode()
      const W = 240
      const H = Math.round((W * img.height) / img.width)
      const PAD = 48 // 20% of W; blur must stay well inside it
      const BLUR = 24

      const silhouette = document.createElement("canvas")
      silhouette.width = W
      silhouette.height = H
      const sctx = silhouette.getContext("2d")
      sctx.drawImage(img, 0, 0, W, H)
      sctx.globalCompositeOperation = "source-in"
      sctx.fillStyle = tint
      sctx.fillRect(0, 0, W, H)

      const out = document.createElement("canvas")
      out.width = W + PAD * 2
      out.height = H + PAD * 2
      const octx = out.getContext("2d")
      octx.filter = `blur(${BLUR}px)`
      octx.drawImage(silhouette, PAD, PAD)
      return out.toDataURL("image/webp", 0.75)
    },
    [frame, color]
  )
  const file = `public/card-glow-${side}.webp`
  fs.writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"))
  console.log(`wrote ${file}`)
}

await browser.close()
