"use client"

import { useState, useTransition } from "react"
import {
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ShieldCheck,
  Settings2,
  Pencil,
  Eye,
  X,
  Send,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
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
import { useIntlLocale } from "@/lib/utils/format-locale"

interface TeamManagerProps {
  initialMembers: TeamMember[]
  ownerEmail: string
}

function getInitials(text: string) {
  return text.slice(0, 2).toUpperCase()
}

export function TeamManager({ initialMembers, ownerEmail }: TeamManagerProps) {
  const t = useTranslations("settings.teamSection")
  const tCommon = useTranslations("common")
  const intlLocale = useIntlLocale()

  const ROLE_CONFIG = {
    owner: {
      label: t("owner"),
      color: "text-violet-500 dark:text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
      icon: ShieldCheck,
      iconColor: "text-violet-500",
      bgIcon: "bg-violet-500/20",
      description: t("ownerDescription"),
    },
    admin: {
      label: t("admin"),
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      icon: Settings2,
      iconColor: "text-blue-500",
      bgIcon: "bg-blue-500/20",
      description: t("adminDescription"),
    },
    editor: {
      label: t("editor"),
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: Pencil,
      iconColor: "text-emerald-500",
      bgIcon: "bg-emerald-500/20",
      description: t("editorDescription"),
    },
    viewer: {
      label: t("viewer"),
      color: "text-gray-400 dark:text-slate-500",
      bg: "bg-gray-100 dark:bg-slate-500/10",
      border: "border-gray-200 dark:border-white/5",
      icon: Eye,
      iconColor: "text-gray-400 dark:text-slate-500",
      bgIcon: "bg-gray-200/50 dark:bg-slate-500/20",
      description: t("viewerDescription"),
    },
  } as const

  const renderRoleBadge = (role: string) => {
    const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.viewer
    return (
      <div
        className={cn(
          "flex items-center gap-2 font-medium text-xs px-3 py-1 rounded-full w-fit",
          config.color,
          config.bg
        )}
      >
        {config.label}
      </div>
    )
  }

  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("editor")
  const [inviteResult, setInviteResult] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [memberToRevoke, setMemberToRevoke] = useState<TeamMember | null>(null)
  const [isInviting, startInviteTransition] = useTransition()
  const [isRevoking, startRevokeTransition] = useTransition()

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteResult(null)

    startInviteTransition(async () => {
      const result = await inviteTeamMemberAction({
        email: inviteEmail,
        role: inviteRole,
      })
      if (result.error) {
        setInviteResult({ type: "error", text: result.error })
        return
      }
      setInviteResult({ type: "success", text: result.success ?? t("sentRecently") })
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
      setInviteEmail("")
      setTimeout(() => setInviteOpen(false), 1500)
    })
  }

  function _handleRoleChange(memberId: string, role: TeamMember["role"]) {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)))
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

  const acceptedMembers = members.filter((m) => m.status === "accepted")
  const pendingMembers = members.filter((m) => m.status === "pending")

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground dark:text-white tracking-tight mb-2">
            {t("managementTitle")}
          </h2>
        </div>
        <button
          onClick={() => {
            setInviteResult(null)
            setInviteOpen(true)
          }}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all",
            "bg-gradient-to-r from-violet-600 to-blue-600 text-white",
            "shadow-xl shadow-violet-500/20",
            "hover:scale-[1.02] active:scale-95"
          )}
        >
          <UserPlus className="size-4" />
          {t("inviteMember")}
        </button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(["owner", "admin", "editor", "viewer"] as const).map((role) => {
          const config = ROLE_CONFIG[role]
          const RoleIcon = config.icon
          return (
            <div
              key={role}
              className={cn(
                "p-5 rounded-2xl relative overflow-hidden group transition-all",
                "bg-white border border-gray-200/60 shadow-sm",
                "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
              )}
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <RoleIcon className={cn("size-12", config.iconColor)} />
              </div>
              <div
                className={cn(
                  "size-10 rounded-lg flex items-center justify-center mb-4",
                  config.bgIcon
                )}
              >
                <RoleIcon className={cn("size-5", config.iconColor)} />
              </div>
              <h3
                className={cn(
                  "font-bold text-lg mb-1",
                  role === "viewer" ? "text-gray-400 dark:text-slate-300" : "text-foreground dark:text-white"
                )}
              >
                {config.label}
              </h3>
              <p className="text-xs text-muted-foreground dark:text-slate-400 leading-relaxed">
                {config.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Members Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-foreground dark:text-white">
            {t("teamMembers")}{" "}
            <span className="text-muted-foreground text-sm font-normal ml-2">
              {acceptedMembers.length + 1} {t("members")}
            </span>
          </h3>
        </div>
        <div
          className={cn(
            "rounded-2xl overflow-hidden",
            "bg-white border border-gray-200/60 shadow-sm",
            "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
          )}
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
                  {t("memberColumn")}
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
                  {t("emailColumn")}
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
                  {t("roleColumn")}
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
                  {t("activityColumn")}
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 text-right">
                  {t("actionsColumn")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
              {/* Owner row */}
              <tr className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-violet-500/15 text-xs font-semibold text-violet-500">
                      {getInitials(ownerEmail)}
                    </div>
                    <span className="text-sm font-semibold text-foreground dark:text-white">
                      {ownerEmail.split("@")[0]}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground dark:text-slate-400">
                  {ownerEmail}
                </td>
                <td className="px-6 py-4">
                  {renderRoleBadge("owner")}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground dark:text-slate-400">
                  {t("online")}
                </td>
                <td className="px-6 py-4" />
              </tr>

              {/* Team members */}
              {acceptedMembers.map((member) => (
                <tr
                  key={member.id}
                  className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {getInitials(member.email)}
                      </div>
                      <span className="text-sm font-semibold text-foreground dark:text-white">
                        {member.email.split("@")[0]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground dark:text-slate-400">
                    {member.email}
                  </td>
                  <td className="px-6 py-4">
                    {renderRoleBadge(member.role)}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground dark:text-slate-400">
                    {member.acceptedAt
                      ? new Date(member.acceptedAt).toLocaleDateString(intlLocale, {
                          day: "numeric",
                          month: "short",
                        })
                      : "\u2014"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setMemberToRevoke(member)}
                      className="p-2 text-gray-400 dark:text-slate-500 hover:text-foreground dark:hover:text-slate-200 transition-colors"
                    >
                      <MoreVertical className="size-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingMembers.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-foreground dark:text-white mb-4">
            {t("pendingInvitations")}
          </h3>
          <div
            className={cn(
              "rounded-2xl overflow-hidden",
              "bg-white border border-gray-200/60 shadow-sm",
              "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
            )}
          >
            <div className="divide-y divide-gray-200 dark:divide-white/5">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-6"
                >
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-sm font-semibold text-foreground dark:text-white">
                        {member.email}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-slate-500">
                        {member.invitedAt
                          ? t("sentDaysAgo", { count: Math.max(1, Math.round((Number(new Date()) - new Date(member.invitedAt).getTime()) / (1000 * 60 * 60 * 24))) })
                          : t("sentRecently")}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-medium",
                        "bg-gray-100 border border-gray-200 text-gray-500",
                        "dark:bg-slate-800 dark:border-white/5 dark:text-slate-400"
                      )}
                    >
                      {ROLE_CONFIG[member.role]?.label ?? member.role}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMemberToRevoke(member)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-400/10 transition-colors"
                    >
                      {tCommon("cancel")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Invite Modal ──────────────────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={(v) => !isInviting && setInviteOpen(v)}>
        <DialogContent
          className={cn(
            "max-w-lg rounded-[2rem] p-8",
            "dark:bg-[#0A0A0F]/95 dark:backdrop-blur-xl dark:border-violet-500/20"
          )}
        >
          <button
            onClick={() => setInviteOpen(false)}
            className="absolute top-6 right-6 text-gray-400 dark:text-slate-500 hover:text-foreground dark:hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>

          <div className="size-14 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-500 mb-6">
            <UserPlus className="size-7" />
          </div>

          <DialogTitle className="text-2xl font-extrabold mb-2 text-foreground dark:text-white">
            {t("inviteNewMember")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground dark:text-slate-400 text-sm mb-8">
            {t("inviteSubtitle")}
          </DialogDescription>

          <form onSubmit={handleInvite} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-500 mb-2">
                {t("emailLabel")}
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
                className={cn(
                  "w-full rounded-xl px-4 py-3 text-sm transition-all",
                  "bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-violet-500/50",
                  "dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:ring-violet-500/50"
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-500 mb-2">
                {t("assignedRole")}
              </label>
              <div className="relative">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamMember["role"])}
                  className={cn(
                    "w-full rounded-xl px-4 py-3 text-sm appearance-none transition-all",
                    "bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-violet-500/50",
                    "dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:ring-violet-500/50"
                  )}
                >
                  <option value="editor">{t("editor")}</option>
                  <option value="admin">{t("admin")}</option>
                  <option value="viewer">{t("viewer")}</option>
                </select>
              </div>
            </div>

            {inviteResult && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm",
                  inviteResult.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {inviteResult.type === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 shrink-0" />
                )}
                {inviteResult.text}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className={cn(
                  "flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all",
                  "border border-gray-200 hover:bg-gray-50",
                  "dark:border-white/10 dark:hover:bg-white/5"
                )}
              >
                {tCommon("cancel")}
              </button>
              <button
                type="submit"
                disabled={isInviting}
                className={cn(
                  "flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all",
                  "bg-gradient-to-r from-violet-600 to-blue-600 text-white",
                  "shadow-xl shadow-violet-500/20",
                  "hover:scale-[1.02] active:scale-95",
                  "disabled:opacity-50 flex items-center justify-center gap-2"
                )}
              >
                {isInviting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {isInviting ? t("sending") : t("sendInvite")}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Revoke confirmation ───────────────────────────────────────────── */}
      <Dialog open={!!memberToRevoke} onOpenChange={(open) => !open && setMemberToRevoke(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("revokeAccess")}</DialogTitle>
            <DialogDescription>
              {t("revokeConfirm")}{" "}
              <span className="font-medium text-foreground">{memberToRevoke?.email}</span> ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{tCommon("cancel")}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleRevoke} disabled={isRevoking}>
              {isRevoking && <Loader2 className="size-4 animate-spin" />}
              {t("revoke")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
