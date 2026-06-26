import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Activity, Boxes } from 'lucide-react'
import clsx from 'clsx'

const links = [
  { to: '/',        label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects',  icon: FolderKanban },
  { to: '/status',  label: 'Services',  icon: Activity },
]

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-700/50 bg-surface-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 shadow-lg shadow-brand-500/40">
          <Boxes className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold tracking-tight text-slate-100">DevBoard</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Main
        </p>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-500/15 text-brand-400'
                  : 'text-slate-400 hover:bg-surface-700 hover:text-slate-200',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={clsx(
                    'h-4 w-4 transition-colors',
                    isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300',
                  )}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700/50 px-5 py-4">
        <p className="text-xs text-slate-600">Docker Practice Stack</p>
        <p className="font-mono text-[10px] text-slate-700">FastAPI · NestJS · React</p>
      </div>
    </aside>
  )
}
