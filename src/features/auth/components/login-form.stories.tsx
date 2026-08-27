import { userEvent, within } from "storybook/test"

import { LoginForm } from "@/features/auth/components/login-form"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The body of the /login card, and the only door into the owner-only half of
// the app — email and password, validated by the same zod schema the sign-in
// server function uses. It owns its own form state, so a caller hands it one
// thing: an onSubmit that resolves to a friendly message when the credentials
// are refused, or null once the session exists and the route can redirect.

const meta = {
  title: "Forms/Login form",
  component: LoginForm,
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm">
        <Story />
      </div>
    ),
  ],
  args: { onSubmit: async (): Promise<string | null> => null },
} satisfies Meta<typeof LoginForm>

export default meta
type Story = StoryObj<typeof meta>

/** Press Sign in — as Sam, with the given password, or on an untouched form
 *  when none is given. Typing runs with no per-key delay: every story here is
 *  a picture of what the press leads to, not of the typing. */
async function signIn(canvasElement: HTMLElement, password?: string) {
  const canvas = within(canvasElement)
  const user = userEvent.setup({ delay: null })
  if (password !== undefined) {
    await user.type(canvas.getByLabelText("Email"), "sam@example.com")
    await user.type(canvas.getByLabelText("Password"), password)
  }
  await user.click(canvas.getByRole("button", { name: "Sign in" }))
}

// The resting state, as the sign-in card first shows it.
export const Default: Story = {}

// Submitted empty: the schema's own messages, one per field, and both Fields
// go destructive. Nothing reaches the server until these pass.
export const ValidationErrors: Story = {
  name: "Validation errors",
  play: async ({ canvasElement }) => {
    await signIn(canvasElement)
  },
}

// The server said no, in the words the sign-in function actually returns. A
// rejection isn't any one field's fault, so it belongs to the form: an alert
// above the button, and everything typed still there to correct.
export const RejectedCredentials: Story = {
  name: "Rejected credentials",
  args: { onSubmit: async () => "Wrong email or password." },
  play: async ({ canvasElement }) => {
    await signIn(canvasElement, "not-the-one")
  },
}

// In flight: the button holds a spinner and refuses a second press, so a slow
// network can't be turned into two sign-in attempts.
export const SigningIn: Story = {
  name: "Signing in",
  args: { onSubmit: () => new Promise<string | null>(() => undefined) },
  play: async ({ canvasElement }) => {
    await signIn(canvasElement, "correct-horse")
  },
}
