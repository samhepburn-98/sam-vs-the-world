import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
  stories: ["./docs/**/*.mdx", "../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {
      builder: {
        // The app's vite.config.ts carries the Cloudflare workerd and
        // TanStack Start plugins, which must not run inside Storybook —
        // point the builder at a minimal config instead.
        viteConfigPath: ".storybook/vite.config.ts",
      },
    },
  },
  staticDirs: ["../public"],
}

export default config
