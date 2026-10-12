import { NavLink } from 'react-router-dom'
import { ChevronsLeft, ChevronsRight, Vote, X } from 'lucide-react'
import { primaryNav, secondaryNav, type NavItem } from '../../lib/nav'
import { hasPermission } from '../../lib/permissions'
import { useCurrentUser } from '../../hooks/usePermission'
import { cn } from '../../lib/utils'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

function isVisible(item: NavItem, role: string | undefined) {
  if (item.roles) return role !== undefined && item.roles.includes(role as never)
  if (item.permission) return hasPermission(role as never, item.permission)
  return true
}

function NavList({ items, role, collapsed, onNavigate }: { items: NavItem[]; role: string | undefined; collapsed: boolean; onNavigate: () => void }) {
  return (
    <ul className="flex flex-col gap-0.5 px-3">
      {items.filter((item) => isVisible(item, role)).map((item) => (
        <li key={item.path}>
          <NavLink
            to={item.path}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] font-medium transition-colors focus-ring',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-white/70 hover:bg-sidebar-hover hover:text-white',
              )
            }
          >
            <item.icon className="size-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const user = useCurrentUser()

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onCloseMobile} aria-hidden />
      )}
      <aside
        className={cn(
          'safe-top fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-sidebar transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed && 'lg:w-[76px]',
        )}
      >
        <div className={cn('flex h-16 shrink-0 items-center gap-2.5 px-5', collapsed && 'lg:justify-center lg:px-0')}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand text-white">
            <Vote className="size-[18px]" />
          </span>
          {!collapsed && (
            <span className="truncate text-[14.5px] font-semibold text-white">Election Ops</span>
          )}
          <button
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="focus-ring ml-auto rounded-md p-1.5 text-white/70 hover:bg-sidebar-hover hover:text-white lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <NavList items={primaryNav} role={user?.role} collapsed={collapsed} onNavigate={onCloseMobile} />
          <div className="my-3 border-t border-white/10" />
          <NavList items={secondaryNav} role={user?.role} collapsed={collapsed} onNavigate={onCloseMobile} />
        </nav>

        <button
          onClick={onToggleCollapsed}
          className={cn(
            'safe-bottom mx-3 mb-3 hidden items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] font-medium text-white/60 transition-colors hover:bg-sidebar-hover hover:text-white lg:flex',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? <ChevronsRight className="size-[18px]" /> : <ChevronsLeft className="size-[18px]" />}
          {!collapsed && 'Collapse'}
        </button>
      </aside>
    </>
  )
}
