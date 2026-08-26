import { themes } from "storybook/theming"

import type { Preview } from "@storybook/react-vite"

import "../src/styles.css"

// Ultimate is dark-only; mirror the app's permanent root class so shadcn's
// dark: refinements are active in stories too.
document.documentElement.classList.add("dark")
document.documentElement.style.colorScheme = "dark"

const preview: Preview = {
  parameters: {
    layout: "centered",
    // dark-only system, dark docs canvas — the app's light foreground text
    // would wash out on Storybook's default white docs pages
    docs: { theme: themes.dark },
    // The app's surfaces come from its own tokens; Storybook's background
    // switcher would paint colors that exist nowhere in the system.
    backgrounds: { disable: true },
    options: {
      storySort: {
        order: [
          "Foundations",
          ["Overview", "Colors", "Typography", "The ten rules"],
          "Typography",
          "UI",
        ],
      },
    },
  },
}

export default preview
