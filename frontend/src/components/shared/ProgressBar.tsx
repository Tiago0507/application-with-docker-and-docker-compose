interface ProgressBarProps {
  value: number
  max: number
  color?: string
}

export function ProgressBar({ value, max, color = '#6366f1' }: ProgressBarProps) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{value} / {max} tasks</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-600">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
