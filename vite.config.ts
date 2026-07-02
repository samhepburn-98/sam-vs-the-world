import { defineConfig } from "vitest/config"
import { cloudflare } from "@cloudflare/vite-plugin"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// The Cloudflare plugin retargets the SSR build (and dev/preview) at the
// workerd runtime — but it must not wrap Vitest, whose node/jsdom suites
// have nothing to do with the Worker.
const isVitest = Boolean(process.env.VITEST)

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    ...(isVitest ? [] : [cloudflare({ viteEnvironment: { name: "ssr" } })]),
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  test: {
    // Playwright owns e2e/ — keep it out of Vitest's glob.
    exclude: ["node_modules/**", "dist/**", "e2e/**"],
  },
})

export default config
