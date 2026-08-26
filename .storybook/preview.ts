import { themes } from "storybook/theming"

import type { Decorator, Preview } from "@storybook/react-vite"

import "../src/styles.css"

// Two lighting rigs (see styles.css): stories default to the night studio
// and the toolbar switches to daylight, mirroring the app's theme class.
const withTheme: Decorator = (Story, context) => {
  const dark = context.globals.theme !== "light"
  document.documentElement.classList.toggle("dark", dark)
  document.documentElement.style.colorScheme = dark ? "dark" : "light"
  return Story()
}

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: "Studio lighting rig",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: ["dark", "light"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "dark" },
  parameters: {
    layout: "centered",
    // the docs shell stays dark; story canvases follow the toolbar theme
    docs: { theme: themes.dark },
    // The app's surfaces come from its own tokens; Storybook's background
    // switcher would paint colors that exist nowhere in the system.
    backgrounds: { disable: true },
    options: {
      storySort: {
        order: [
          "Foundations",
          ["Overview", "Colors", "Typography", "The Broadcast rules"],
          "Cards",
          "Typography",
          "UI",
          "Logger",
        ],
      },
    },
  },
}

export default preview
