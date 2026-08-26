import type { Preview } from "@storybook/react-vite"

import "../src/styles.css"

const preview: Preview = {
  parameters: {
    layout: "centered",
    // The app's surfaces come from its own tokens; Storybook's background
    // switcher would paint colors that exist nowhere in the system.
    backgrounds: { disable: true },
    options: {
      storySort: {
        order: ["Foundations", "Typography", "UI"],
      },
    },
  },
}

export default preview
