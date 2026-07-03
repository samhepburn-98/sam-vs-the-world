// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { LoginForm } from "./login-form"

// RTL auto-cleanup needs vitest globals, which we don't enable — clean manually.
afterEach(cleanup)

describe("LoginForm", () => {
  it("validates via the shared zod schema before submitting", async () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText("Enter a valid email address")).toBeDefined()
      expect(screen.getByText("Enter your password")).toBeDefined()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("surfaces the server's friendly error as a form-level alert", async () => {
    const onSubmit = vi.fn().mockResolvedValue("Wrong email or password.")
    render(<LoginForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "sam@example.com" },
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "hunter2" },
    })
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe(
        "Wrong email or password.",
      )
    })
    expect(onSubmit).toHaveBeenCalledWith({
      email: "sam@example.com",
      password: "hunter2",
    })
  })
})
