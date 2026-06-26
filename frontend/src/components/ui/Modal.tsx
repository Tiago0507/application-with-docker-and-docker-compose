import { useEffect } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={clsx(
          'relative w-full rounded-2xl border border-slate-700 bg-surface-800 shadow-2xl animate-slide-up',
          sizes[size],
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-700 hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
