import { Orbit } from 'lucide-react'
import { NavLink } from 'react-router'
import { navigation } from '../../app/navigation'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#192c43] p-5 text-white">
      <div className="mb-12 flex items-center gap-3 px-2 pt-3">
        <Orbit aria-hidden="true" className="size-9 text-[#a9c8ff]" />
        <span className="text-xl font-semibold tracking-tight">
          InsightSphere
        </span>
      </div>
      <p className="mb-3 px-3 text-xs text-slate-300">Your workspace</p>
      <nav aria-label="Main navigation" className="space-y-1">
        {navigation.map(({ path, title, icon: Icon }) => (
          <NavLink
            key={path}
            end={path === '/'}
            to={path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium focus-visible:outline-white ${isActive ? 'bg-[#314d72] text-white' : 'text-slate-300 hover:bg-[#243d5b] hover:text-white'}`
            }
          >
            <Icon aria-hidden="true" size={19} />
            {title}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-12">
        <div className="rounded-lg border border-slate-600 p-4">
          <p className="text-sm font-medium">A broader perspective.</p>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            Weather, markets, and economies. One place to make sense of it all.
          </p>
        </div>
        <p className="px-2 pt-5 text-xs text-slate-300">
          InsightSphere / Preview
        </p>
      </div>
    </div>
  )
}
