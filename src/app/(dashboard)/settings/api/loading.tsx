export default function ApiSettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 rounded-2xl bg-muted/30 dark:bg-white/[0.04] w-2/3" />
      <div className="h-48 rounded-2xl bg-muted/30 dark:bg-white/[0.04]" />
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/30 dark:bg-white/[0.04]" />
        ))}
      </div>
    </div>
  )
}
