import { Orbit } from 'lucide-react'
import { NavLink } from 'react-router'
import { navigation } from '../../app/navigation'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="workspace-sidebar flex h-full flex-col overflow-y-auto px-3 py-6">
      <div className="mb-12 flex items-center gap-2 px-2 pt-4">
        <span className="flex size-8 shrink-0 items-center justify-center">
          <Orbit
            aria-hidden="true"
            className="size-7 text-sidebar-accent"
            strokeWidth={1.5}
          />
        </span>
        <div>
          <span className="text-[17px] font-semibold tracking-tight">
            InsightSphere
          </span>
          <p className="mt-1 text-[11px] font-medium text-sidebar-prestige">
            Multi-API Analytics
          </p>
        </div>
      </div>
      <p className="mb-3 px-3 text-xs font-medium text-sidebar-muted">
        Workspace
      </p>
      <nav aria-label="Main navigation" className="space-y-1.5">
        {navigation.map(({ path, title, icon: Icon }) => (
          <NavLink
            key={path}
            end={path === '/'}
            to={path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex min-h-12 items-center gap-3 rounded-r-lg border-l-2 px-3 text-sm transition-colors ${isActive ? 'border-sidebar-accent bg-sidebar-active font-semibold text-sidebar-ink' : 'border-transparent font-medium text-sidebar-muted hover:bg-sidebar-hover hover:text-white'}`
            }
          >
            <Icon aria-hidden="true" size={18} strokeWidth={1.7} />
            {title}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto px-3 pt-12">
        <div className="border-t border-sidebar-line pt-5">
          <p className="text-xs font-semibold">
            Four perspectives. One workspace.
          </p>
          <p className="mt-2 text-xs leading-6 text-sidebar-muted">
            Open-Meteo, Frankfurter, World Bank and CoinGecko.
          </p>
        </div>
      </div>
    </div>
  )
}
