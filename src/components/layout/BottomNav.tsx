import { NavLink } from 'react-router-dom'
import { Calendar, LayoutGrid, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { usePlanningStore } from '../../stores/planningStore'

const NAV_ITEMS = [
  { to: '/planning', label: 'Plan', Icon: Calendar, primary: true },
  { to: '/presets', label: 'Presets', Icon: LayoutGrid, primary: false },
  { to: '/history', label: 'History', Icon: Clock, primary: false },
] as const

export default function BottomNav() {
  const step = usePlanningStore((s) => s.step)
  const sessionActive = step > 1

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      {NAV_ITEMS.map(({ to, label, Icon, primary }) => (
        <NavLink
          key={to}
          to={to}
          className="flex flex-1"
        >
          {({ isActive }) => (
            <motion.div
              className="relative flex flex-1 flex-col items-center gap-1 py-3"
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {/* Active top indicator pill */}
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon
                  className={`transition-colors ${
                    primary ? 'h-6 w-6' : 'h-5 w-5'
                  } ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
                />

                {/* Activity dot for Plan tab */}
                {to === '/planning' && (
                  <AnimatePresence>
                    {sessionActive && (
                      <motion.span
                        key="dot"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"
                      />
                    )}
                  </AnimatePresence>
                )}
              </div>

              <span
                className={`text-[10px] font-medium transition-colors ${
                  primary ? 'font-semibold' : ''
                } ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {label}
              </span>
            </motion.div>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
