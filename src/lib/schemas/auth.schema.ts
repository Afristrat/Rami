import { z } from "zod"
import { V } from "@/lib/utils/validation-messages"

export const loginSchema = z.object({
  email: z.string().min(1, V.emailRequired).email(V.emailInvalid),
  password: z.string().min(1, V.passwordRequired),
})

export const registerSchema = z
  .object({
    email: z.string().min(1, V.emailRequired).email(V.emailInvalid),
    password: z
      .string()
      .min(8, V.passwordMinLength)
      .regex(/[A-Z]/, V.passwordUppercase)
      .regex(/[0-9]/, V.passwordDigit),
    confirmPassword: z.string().min(1, V.confirmRequired),
    fullName: z
      .string()
      .min(2, V.nameMinLength)
      .max(100, V.nameTooLong),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: V.passwordsMismatch,
    path: ["confirmPassword"],
  })

export const resetPasswordSchema = z.object({
  email: z.string().min(1, V.emailRequired).email(V.emailInvalid),
})

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, V.passwordMinLength)
      .regex(/[A-Z]/, V.passwordUppercase)
      .regex(/[0-9]/, V.passwordDigit),
    confirmPassword: z.string().min(1, V.confirmRequired),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: V.passwordsMismatch,
    path: ["confirmPassword"],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>
