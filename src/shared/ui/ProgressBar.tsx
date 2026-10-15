interface ProgressBarProps {
  value: number
  max: number
  label: string
  className?: string
}

export function ProgressBar({ value, max, label, className = '' }: ProgressBarProps) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className={className}>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-xs text-muted">
        <span>{label}</span>
        <span className="font-semibold tabular-nums text-ink">
          {value}/{max}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} trên ${max}`}
        className="h-2 overflow-hidden rounded-full bg-ink/10"
      >
        <div
          className="h-full rounded-full bg-matcha transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
