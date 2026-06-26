import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-700/50 bg-surface-800 p-5',
        hover && 'transition-all duration-200 hover:border-slate-600 hover:shadow-lg hover:shadow-black/30',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('mb-4 flex items-center justify-between', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={clsx('text-sm font-semibold text-slate-200', className)}>{children}</h3>
}
