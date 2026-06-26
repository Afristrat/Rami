'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Clapperboard, Zap } from 'lucide-react'
import { VideoGeneratorClient } from '@/components/visual/VideoGeneratorClient'
import { MishkatStudioClient } from '@/components/visual/MishkatStudioClient'

type Mode = 'studio' | 'quick'

export function VideoWorkspace() {
  const t = useTranslations('videoStudio')
  const [mode, setMode] = useState<Mode>('studio')

  return (
    <div className="space-y-4">
      <div className="mx-auto flex max-w-3xl gap-2 px-4 pt-4">
        <ModeButton active={mode === 'studio'} onClick={() => setMode('studio')} icon={<Clapperboard className="h-4 w-4" />} label={t('modeStudio')} />
        <ModeButton active={mode === 'quick'} onClick={() => setMode('quick')} icon={<Zap className="h-4 w-4" />} label={t('modeQuick')} />
      </div>
      {mode === 'studio' ? <MishkatStudioClient /> : <VideoGeneratorClient />}
    </div>
  )
}

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
        active ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground hover:bg-muted'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
