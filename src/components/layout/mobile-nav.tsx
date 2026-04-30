"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { useTranslations } from "next-intl"
import { SidebarContent } from "./sidebar-content"

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const t = useTranslations("common")

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-y-0 start-0 z-50 w-72 bg-white dark:bg-[#0A0A0F] border-e border-gray-200 dark:border-white/10 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left rtl:data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-left rtl:data-[state=open]:slide-in-from-right duration-300"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          <div className="relative h-full">
            <Dialog.Close asChild>
              <button className="absolute end-3 top-4 z-10 flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <X className="size-4" />
                <span className="sr-only">{t("close")}</span>
              </button>
            </Dialog.Close>
            <SidebarContent onNavigate={() => onOpenChange(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
