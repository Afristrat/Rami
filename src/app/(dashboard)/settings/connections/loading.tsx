export default function ConnectionsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 rounded-2xl bg-muted/30 dark:bg-white/[0.04] w-2/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 rounded-2xl bg-muted/30 dark:bg-white/[0.04]" />
        ))}
      </div>
    </div>
  )
}
