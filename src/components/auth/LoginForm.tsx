"use client"

import { useActionState } from "react"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { signIn, type AuthState } from "@/app/actions/auth"

const initialState: AuthState = { success: false }

export function LoginForm() {
  const [state, action, isPending] = useActionState(signIn, initialState)

  return (
    <form action={action} className="space-y-5">
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
          aria-invalid={!state.success && !!state.error}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mot de passe</Label>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          className="h-10"
          aria-invalid={!state.success && !!state.error}
        />
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
            Connexion en cours…
          </>
        ) : (
          "Se connecter"
        )}
      </Button>
    </form>
  )
}
