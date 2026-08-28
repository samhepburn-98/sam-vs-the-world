import { configDefaults, defineConfig } from "vitest/config"
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
    // Spread the defaults rather than replacing them: the default exclude is
    // `**/node_modules/**`, and the bare `node_modules/**` we used before only
    // matched the one at the repo root. A git worktree under .claude/worktrees
    // brings its own, so a single background task left Vitest collecting ~49k
    // tests out of three copies of the dependency tree. Playwright owns e2e/.
    exclude: [
      ...configDefaults.exclude,
      "dist/**",
      "e2e/**",
      ".claude/**",
      "storybook-static/**",
    ],
  },
})

export default config
