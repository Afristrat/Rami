import { cn } from "@/lib/utils"

interface AuthCardProps {
  children: React.ReactNode
  className?: string
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[420px]",
        "rounded-2xl border border-white/[0.08]",
        "bg-white/[0.04] backdrop-blur-xl",
        "shadow-2xl shadow-black/40",
        "p-8",
        className
      )}
    >
      {children}
    </div>
  )
}

export function RamiLogo() {
  return (
    <div className="flex flex-col items-center gap-2 mb-8">
      {/* Icône RAMI */}
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-500/25">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="text-white"
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {/* Texte RAMI */}
      <div className="text-center">
        <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
          RAMI
        </span>
        <p className="text-[11px] text-white/30 tracking-widest uppercase mt-0.5">
          Agency OS by AI-MPower
        </p>
      </div>
    </div>
  )
}

interface FormAlertProps {
  type: "error" | "success"
  message: string
}

export function FormAlert({ type, message }: FormAlertProps) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        type === "error" &&
          "border-red-500/20 bg-red-500/10 text-red-400",
        type === "success" &&
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
      )}
    >
      {message}
    </div>
  )
}

interface FieldErrorProps {
  message?: string
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null
  return <p className="text-xs text-red-400 mt-1">{message}</p>
}
