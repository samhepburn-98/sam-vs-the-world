import { addons } from "storybook/manager-api"
import { themes } from "storybook/theming"

// Dark shell to match the dark-only design system.
addons.setConfig({ theme: themes.dark })
