import remarkGfm from "remark-gfm"

import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
  stories: ["./docs/**/*.mdx", "../src/**/*.stories.tsx"],
  addons: [
    {
      name: "@storybook/addon-docs",
      options: {
        // MDX ships CommonMark only, so a pipe table renders as literal
        // pipes. The reference pages are mostly lookup tables, so GFM is
        // the difference between a table and a wall of "|".
        mdxPluginOptions: {
          mdxCompileOptions: { remarkPlugins: [remarkGfm] },
        },
      },
    },
  ],
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
