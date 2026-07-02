import { z } from "zod"

// One validation source for the login form AND the sign-in server function
// (§8.4: forms and the API layer validate from the same schema).

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
})

export type LoginInput = z.infer<typeof loginSchema>
