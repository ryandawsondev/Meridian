import { NavLink } from 'react-router-dom'
import { Calendar, LayoutGrid, Clock } from 'lucide-react'
import { usePlanningStore } from '../../stores/planningStore'

const NAV_ITEMS = [
  { to: '/planning', label: 'Plan', Icon: Calendar },
  { to: '/presets', label: 'Presets', Icon: LayoutGrid },
  { to: '/history', label: 'History', Icon: Clock },
] as const

export default function BottomNav() {
  const step = usePlanningStore((s) => s.step)
  const sessionActive = step > 1

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          <div className="relative">
            <Icon className="h-5 w-5" />
            {to === '/planning' && sessionActive && (
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
