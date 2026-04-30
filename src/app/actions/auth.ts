"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { z } from "zod"

const AuthSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

export type AuthState = {
  success: boolean
  error?: string
}

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = AuthSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return {
      success: false,
      error:
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect"
          : error.message,
    }
  }

  redirect("/dashboard")
}

const RegisterSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  fullName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100)
    .trim(),
})

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = RegisterSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    }
  }

  const { email, password, fullName } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })

  if (error) {
    return {
      success: false,
      error:
        error.message === "User already registered"
          ? "Un compte existe déjà avec cet email"
          : error.message,
    }
  }

  // Vérifier si l'utilisateur qui vient de s'inscrire est super_admin
  const { data: { user: newUser } } = await supabase.auth.getUser()
  if (newUser?.app_metadata?.role === "super_admin") redirect("/dashboard")

  redirect("/onboarding")
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
