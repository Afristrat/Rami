"use client"

import { useState, useTransition } from "react"
import {
  Users,
  UserPlus,
  Loader2,
  Crown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  inviteTeamMemberAction,
  updateMemberRoleAction,
  revokeMemberAccessAction,
  type TeamMember,
} from "@/lib/actions/settings.actions"
import { cn } from "@/lib/utils"

interface TeamManagerProps {
  initialMembers: TeamMember[]
  ownerEmail: string
}

const ROLE_LABELS: Record<TeamMember["role"], string> = {
  admin: "Admin",
  editor: "Éditeur",
  viewer: "Lecteur",
}

const ROLE_DESCRIPTIONS: Record<TeamMember["role"], string> = {
  admin: "Accès complet sauf facturation",
  editor: "Créer et publier du contenu",
  viewer: "Lecture seule",
}

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

function StatusBadge({ status }: { status: TeamMember["status"] }) {
  if (status === "accepted") {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-xs">
        Actif
      </Badge>
    )
  }
  return (
    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-xs">
      <Clock className="size-3 mr-1" />
      En attente
    </Badge>
  )
}

export function TeamManager({ initialMembers, ownerEmail }: TeamManagerProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("editor")
  const [inviteMessage, setInviteMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [memberToRevoke, setMemberToRevoke] = useState<TeamMember | null>(null)
  const [isInviting, startInviteTransition] = useTransition()
  const [isRevoking, startRevokeTransition] = useTransition()

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteMessage(null)

    startInviteTransition(async () => {
      const result = await inviteTeamMemberAction({
        email: inviteEmail,
        role: inviteRole,
      })

      if (result.error) {
        setInviteMessage({ type: "error", text: result.error })
        return
      }

      setInviteMessage({ type: "success", text: result.success ?? "Invitation envoyée." })
      setInviteEmail("")

      // Ajouter optimistiquement le membre
      setMembers((prev) => [
        {
          id: crypto.randomUUID(),
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          status: "pending",
          invitedAt: new Date().toISOString(),
          acceptedAt: null,
          userId: null,
        },
        ...prev,
      ])
    })
  }

  function handleRoleChange(memberId: string, role: TeamMember["role"]) {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role } : m))
    )

    startInviteTransition(async () => {
      await updateMemberRoleAction(memberId, role)
    })
  }

  function handleRevoke() {
    if (!memberToRevoke) return

    startRevokeTransition(async () => {
      const result = await revokeMemberAccessAction(memberToRevoke.id)
      if (!result.error) {
        setMembers((prev) => prev.filter((m) => m.id !== memberToRevoke.id))
      }
      setMemberToRevoke(null)
    })
  }

  return (
    <div className="space-y-6">
      {/* Inviter un membre */}
      <Card>
        <CardHeader>
          <CardTitle>Inviter un membre</CardTitle>
          <CardDescription>
            Les membres invités recevront un email pour rejoindre votre espace RAMI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="inviteEmail">Email</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborateur@exemple.com"
                  required
                />
              </div>
              <div className="space-y-1.5 sm:w-40">
                <Label htmlFor="inviteRole">Rôle</Label>
                <Select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamMember["role"])}
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Éditeur</option>
                  <option value="viewer">Lecteur</option>
                </Select>
              </div>
            </div>

            {/* Description du rôle sélectionné */}
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">{ROLE_LABELS[inviteRole]}</span> —{" "}
              {ROLE_DESCRIPTIONS[inviteRole]}
            </p>

            {inviteMessage && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm",
                  inviteMessage.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {inviteMessage.type === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 shrink-0" />
                )}
                {inviteMessage.text}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isInviting}>
                {isInviting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                {isInviting ? "Envoi…" : "Inviter"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Liste des membres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" />
            Membres ({members.length + 1})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Owner */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {getInitials(ownerEmail)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{ownerEmail}</p>
              <p className="text-xs text-muted-foreground">Vous</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-0 text-xs">
                <Crown className="size-3 mr-1" />
                Propriétaire
              </Badge>
            </div>
          </div>

          {/* Membres invités */}
          {members.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Users className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Aucun membre invité pour l&apos;instant.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {members.map((member) => (
                <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {getInitials(member.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{member.email}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <StatusBadge status={member.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(member.id, e.target.value as TeamMember["role"])
                      }
                      className="w-28 text-xs h-7"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Éditeur</option>
                      <option value="viewer">Lecteur</option>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setMemberToRevoke(member)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Révoquer l&apos;accès</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Dialog confirmation révocation */}
      <Dialog open={!!memberToRevoke} onOpenChange={(open) => !open && setMemberToRevoke(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Révoquer l&apos;accès</DialogTitle>
            <DialogDescription>
              Voulez-vous révoquer l&apos;accès de{" "}
              <span className="font-medium text-foreground">{memberToRevoke?.email}</span> ?
              Cette action peut être annulée en réinvitant ce membre.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={isRevoking}
            >
              {isRevoking && <Loader2 className="size-4 animate-spin" />}
              Révoquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
