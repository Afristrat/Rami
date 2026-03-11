"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { deleteTenantAction } from "@/lib/actions/settings.actions"

const CONFIRMATION_PHRASE = "SUPPRIMER MON ESPACE"

export function DangerZone() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isConfirmed = inputValue === CONFIRMATION_PHRASE

  function handleOpen() {
    setInputValue("")
    setError(null)
    setOpen(true)
  }

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteTenantAction(inputValue)
      if (result.error) {
        setError(result.error)
        return
      }
      // Redirection vers login après suppression
      router.push("/login")
    })
  }

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5">
      {/* En-tête */}
      <div className="border-b border-destructive/20 px-5 py-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-destructive" />
          <h3 className="text-base font-semibold text-destructive">Zone de danger</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Les actions dans cette section sont irréversibles et affectent l&apos;ensemble de votre espace de travail.
        </p>
      </div>

      {/* Action de suppression */}
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Supprimer l&apos;espace de travail</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Supprime définitivement votre espace RAMI, vos données Brand DNA, vos posts, vos assets et votre abonnement.
            Cette action est <span className="font-semibold">irréversible</span>.
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleOpen}
          className="shrink-0"
        >
          <Trash2 className="size-3.5" />
          Supprimer
        </Button>
      </div>

      {/* Dialog de confirmation */}
      <Dialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 mb-2">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <DialogTitle>Supprimer l&apos;espace de travail</DialogTitle>
            <DialogDescription className="text-left">
              Cette action est <strong>définitive et irréversible</strong>. Tout sera supprimé :
            </DialogDescription>
          </DialogHeader>

          <ul className="mx-0 space-y-1 text-sm text-muted-foreground px-1">
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-destructive/60 shrink-0" />
              Brand DNA et configurations
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-destructive/60 shrink-0" />
              Posts planifiés et historique de publication
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-destructive/60 shrink-0" />
              Visuels générés et assets
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-destructive/60 shrink-0" />
              Membres d&apos;équipe et invitations
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-destructive/60 shrink-0" />
              Abonnement et données de facturation
            </li>
          </ul>

          <div className="space-y-2 pt-2">
            <Label htmlFor="confirmInput" className="text-sm">
              Tapez{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono font-semibold text-foreground">
                {CONFIRMATION_PHRASE}
              </code>{" "}
              pour confirmer
            </Label>
            <Input
              id="confirmInput"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setError(null)
              }}
              placeholder={CONFIRMATION_PHRASE}
              disabled={isPending}
              className={isConfirmed ? "border-destructive/50 focus-visible:ring-destructive/30" : ""}
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isPending}>
                Annuler
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!isConfirmed || isPending}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
