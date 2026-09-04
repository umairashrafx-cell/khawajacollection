/**
 * Validation for the auth forms. Section 4 puts forms on react-hook-form + zod,
 * and these are the schemas for the four of them.
 *
 * ON THE PASSWORD RULE. Eight characters and nothing else — no forced symbol,
 * no forced digit. Composition rules push people towards `Password1!` and a
 * sticky note; length is the property that actually costs an attacker
 * anything. Supabase enforces its own minimum server-side regardless, so this
 * is the message the customer reads, not the boundary.
 */

import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("That does not look like an email address.");

const password = z.string().min(8, "Passwords need at least 8 characters.");

export const signInSchema = z.object({
  email,
  // Deliberately not length-checked on sign-in: an existing password that
  // predates any rule change still has to be typeable, and the server decides.
  password: z.string().min(1, "Enter your password."),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name."),
  email,
  password,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: "The two passwords do not match.",
    path: ["confirm"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
