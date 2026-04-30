export default function TeamLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 rounded-2xl bg-muted/30 dark:bg-white/[0.04] w-1/3" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-muted/30 dark:bg-white/[0.04]" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-muted/30 dark:bg-white/[0.04]" />
    </div>
  )
}
