import { useLocation } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '../ui/Button'

const titles: Record<string, string> = {
  '/':         'Dashboard',
  '/projects': 'Projects',
  '/status':   'Service Status',
}

export function TopBar() {
  const { pathname } = useLocation()
  const qc = useQueryClient()

  const base = '/' + pathname.split('/')[1]
  const title = pathname.startsWith('/projects/') ? 'Project Detail' : (titles[base] ?? 'DevBoard')

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-700/50 bg-surface-900 px-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
        <p className="text-xs text-slate-500 font-mono">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        icon={<RefreshCw className="h-3.5 w-3.5" />}
        onClick={() => qc.invalidateQueries()}
      >
        Refresh
      </Button>
    </header>
  )
}
