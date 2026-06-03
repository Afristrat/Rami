'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Upload, CloudUpload, Globe, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { transcribeUploadAction } from '@/lib/actions/transcriptions.actions'

// ── Types ────────────────────────────────────────────────────────────────────

interface TranscriptionUploadZoneProps {
  onUploadComplete?: (id: string) => void
}

const ACCEPTED_EXTENSIONS = '.mp3,.mp4,.wav,.m4a'
const ACCEPTED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/x-m4a',
  'audio/m4a',
  'video/mp4',
  'video/mpeg',
]
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB

const LANGUAGES = [
  { value: 'fr', label: 'Fran\u00e7ais (FR)', flag: '\ud83c\uddeb\ud83c\uddf7' },
  { value: 'ar', label: 'Arabe (AR)', flag: '\ud83c\uddf8\ud83c\udde6' },
  { value: 'darija', label: 'Darija (MA)', flag: '\ud83c\uddf2\ud83c\udde6' },
  { value: 'en', label: 'Anglais (EN)', flag: '\ud83c\uddfa\ud83c\uddf8' },
  { value: 'es', label: 'Espagnol (ES)', flag: '\ud83c\uddea\ud83c\uddf8' },
] as const

const FORMAT_BADGES = ['MP3', 'MP4', 'WAV', 'M4A'] as const

// ── Component ────────────────────────────────────────────────────────────────

export default function TranscriptionUploadZone({ onUploadComplete }: TranscriptionUploadZoneProps) {
  const t = useTranslations("transcriptions")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [language, setLanguage] = useState<'fr' | 'ar' | 'darija' | 'en' | 'es'>('fr')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      return t('unsupportedFormat')
    }
    if (file.size > MAX_FILE_SIZE) {
      return t('fileTooLarge')
    }
    return null
  }, [t])

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setSelectedFile(null)
      return
    }
    setError(null)
    setSelectedFile(file)
  }, [validateFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const estimatedMinutes = selectedFile
    ? Math.max(1, Math.round((selectedFile.size / (1024 * 1024)) * 0.8))
    : null
  const estimatedCost = selectedFile
    ? Math.max(0.01, Number(((selectedFile.size / (1024 * 1024)) * 0.01).toFixed(2)))
    : null

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return

    setUploading(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append('file', selectedFile)
      fd.append('language', language)

      // Upload réel (MinIO) + transcription Whisper côté serveur.
      const result = await transcribeUploadAction(fd)

      if (!result.id) {
        setError(result.error ?? tCommon('unexpectedError'))
      } else {
        // Une entrée a été créée (status completed ou failed). On rafraîchit la liste ;
        // si la transcription a échoué (ex. clé absente), on remonte le message.
        if (result.status === 'failed' && result.error) setError(result.error)
        onUploadComplete?.(result.id)
        setSelectedFile(null)
        router.refresh() // rafraîchit la liste (RSC) avec la nouvelle transcription
      }
    } catch {
      setError(tCommon('unexpectedError'))
    } finally {
      setUploading(false)
    }
  }, [selectedFile, language, onUploadComplete, tCommon, router])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        className={cn(
          'relative rounded-2xl p-10 text-center transition-all cursor-pointer',
          'glass-card !border-2 !border-dashed !border-violet-500/30 hover:!border-violet-500/50',
          isDragging && 'border-violet-500 bg-violet-500/10',
          selectedFile && !uploading && 'border-violet-500/40 bg-violet-500/5'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            'flex size-14 items-center justify-center rounded-2xl transition-transform',
            isDragging ? 'scale-110 bg-violet-500/20' : 'bg-violet-500/10',
          )}>
            <CloudUpload className="size-7 text-violet-500 dark:text-violet-400" />
          </div>

          {selectedFile ? (
            <div>
              <p className="font-semibold text-foreground">{selectedFile.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)} &middot; {t("clickToChange")}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-foreground">
                {isDragging ? t("releaseFile") : t("dragDropFile")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("orClickToSelect")}
              </p>
            </div>
          )}

          {!selectedFile && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleBrowseClick()
              }}
              className={cn(
                'mt-2 inline-flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white',
                'bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 transition-opacity'
              )}
            >
              {t("browseFiles")}
            </button>
          )}

          <div className="flex items-center gap-3 mt-2">
            {FORMAT_BADGES.map((fmt) => (
              <span
                key={fmt}
                className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                  'bg-muted/30 text-muted-foreground'
                )}
              >
                {fmt}
              </span>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-1">{t("maxSize")}</p>
        </div>

        {/* État de traitement (indéterminé : upload + transcription Whisper côté serveur) */}
        {uploading && (
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
            <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 animate-pulse" />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground text-center">
              {t("processing")}
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* Settings row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Language selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Globe className="size-3.5" />
            {t("audioLanguage")}
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as typeof language)}
            className={cn(
              'w-full h-12 rounded-xl px-4 text-sm outline-none transition-colors',
              'bg-background border border-border text-foreground focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400'
            )}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.flag} {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cost estimate */}
        {selectedFile && (
          <div className={cn(
            'h-12 self-end rounded-xl px-4 flex items-center justify-between',
            'bg-violet-500/5 border border-violet-500/20'
          )}>
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <Info className="size-4" />
              <span className="text-sm font-medium">
                ~{estimatedMinutes} min &middot; Co\u00fbt estim\u00e9 : ${estimatedCost}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Upload button when file is selected */}
      {selectedFile && !uploading && (
        <button
          type="button"
          onClick={handleUpload}
          className={cn(
            'w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white',
            'bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 transition-opacity'
          )}
        >
          <Upload className="size-4" />
          {t("startTranscription")}
        </button>
      )}
    </div>
  )
}
