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
    // Padded, not centered: most of this kit is a full-width broadcast strip,
    // and centering one makes it read as a small object floating in a canvas.
    // A story that genuinely wants centering sets `layout: "centered"` itself.
    layout: "padded",
    // the docs shell stays dark; story canvases follow the toolbar theme
    docs: { theme: themes.dark },
    // The app's surfaces come from its own tokens; Storybook's background
    // switcher would paint colors that exist nowhere in the system.
    backgrounds: { disable: true },
    options: {
      // Sidebar order is reading order for someone planning a page: the
      // rules first, then whole-page recipes, then the kit those recipes
      // are built from, then the feature-specific pieces, primitives last
      // (you reach for a Button knowing what it is).
      storySort: {
        order: [
          "Foundations",
          [
            "Overview",
            "Pick a component",
            "Colors",
            "Typography",
            "Headings",
            "The Broadcast rules",
          ],
          "Patterns",
          "Broadcast",
          "Cards",
          "Dashboard",
          "Logger",
          "Manage",
          "Primitives",
        ],
      },
    },
  },
}

export default preview
