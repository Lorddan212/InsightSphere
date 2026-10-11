import { Orbit } from 'lucide-react'
import { NavLink } from 'react-router'
import { navigation } from '../../app/navigation'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto border-r border-line bg-panel px-4 py-6 text-ink">
      <div className="mb-10 flex items-center gap-3 px-3 pt-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-elevated">
          <Orbit
            aria-hidden="true"
            className="size-7 text-accent"
            strokeWidth={1.5}
          />
        </span>
        <div>
          <span className="text-lg font-semibold tracking-tight">
            InsightSphere
          </span>
          <p className="mt-1 text-[11px] font-medium text-prestige">
            Multi-API Analytics
          </p>
        </div>
      </div>
      <p className="mb-3 px-3 text-xs font-medium text-muted">
        Analytics workspace
      </p>
      <nav aria-label="Main navigation" className="space-y-1.5">
        {navigation.map(({ path, title, icon: Icon }) => (
          <NavLink
            key={path}
            end={path === '/'}
            to={path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex min-h-12 items-center gap-3 rounded-lg border-l-2 px-3 text-sm transition-colors ${isActive ? 'border-accent bg-soft font-semibold text-accent' : 'border-transparent font-medium text-muted hover:bg-elevated hover:text-ink'}`
            }
          >
            <Icon aria-hidden="true" size={18} strokeWidth={1.7} />
            {title}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto px-3 pt-12">
        <div className="border-t border-line pt-5">
          <p className="text-xs font-semibold">Independent data sources</p>
          <p className="mt-2 text-xs leading-6 text-muted">
            Open-Meteo, Frankfurter, World Bank and CoinGecko.
          </p>
          <p className="mt-3 text-xs leading-5 text-muted">
            Observation dates and availability vary by provider.
          </p>
        </div>
      </div>
    </div>
  )
}
