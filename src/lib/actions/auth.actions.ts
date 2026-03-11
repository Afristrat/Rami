"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function loginAction(formData: {
  email: string
  password: string
}): Promise<{ error: string } | never> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { error: "Email ou mot de passe incorrect." }
    }
    if (error.message.includes("Email not confirmed")) {
      return {
        error:
          "Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception.",
      }
    }
    return { error: "Une erreur est survenue. Veuillez réessayer." }
  }

  redirect("/dashboard")
}

export async function registerAction(formData: {
  email: string
  password: string
  fullName: string
}): Promise<{ error?: string; success?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.includes("User already registered")) {
      return { error: "Un compte existe déjà avec cet email." }
    }
    return { error: "Impossible de créer le compte. Veuillez réessayer." }
  }

  return {
    success:
      "Compte créé ! Vérifiez votre email pour confirmer votre inscription.",
  }
}

export async function resetPasswordAction(formData: {
  email: string
}): Promise<{ error?: string; success?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password/update`,
  })

  if (error) {
    return { error: "Impossible d'envoyer l'email. Veuillez réessayer." }
  }

  return {
    success:
      "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
  }
}

export async function updatePasswordAction(formData: {
  password: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: formData.password,
  })

  if (error) {
    return { error: "Impossible de mettre à jour le mot de passe." }
  }

  redirect("/dashboard")
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
