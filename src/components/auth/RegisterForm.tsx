"use client"

import { useActionState } from "react"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { signUp, type AuthState } from "@/app/actions/auth"

const initialState: AuthState = { success: false }

export function RegisterForm() {
  const [state, action, isPending] = useActionState(signUp, initialState)

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nom complet</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="Amine Mansouri"
          autoComplete="name"
          required
          className="h-10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="vous@exemple.com"
          autoComplete="email"
          required
          className="h-10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="8 caractères minimum"
          autoComplete="new-password"
          required
          className="h-10"
        />
        <p className="text-xs text-muted-foreground">
          Au moins 8 caractères
        </p>
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2"
        >
          <p className="text-sm text-destructive">{state.error}</p>
        </div>
      )}

      <Button type="submit" className="w-full h-10" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            Création du compte…
          </>
        ) : (
          "Créer mon compte gratuitement"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        En créant un compte, vous acceptez nos{" "}
        <span className="underline cursor-pointer hover:text-foreground">
          Conditions d&apos;utilisation
        </span>{" "}
        et notre{" "}
        <span className="underline cursor-pointer hover:text-foreground">
          Politique de confidentialité
        </span>
        .
      </p>
    </form>
  )
}
