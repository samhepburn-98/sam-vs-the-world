import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"

// Storybook-only Vite config: just Tailwind and the tsconfig path alias.
// The React plugin is added by @storybook/react-vite itself.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss()],
})
