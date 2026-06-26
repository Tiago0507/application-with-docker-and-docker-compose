import clsx from 'clsx'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

const variants: Record<Variant, string> = {
  default:  'bg-slate-700 text-slate-300',
  success:  'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  warning:  'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  danger:   'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  info:     'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30',
  purple:   'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30',
}

interface BadgeProps {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
