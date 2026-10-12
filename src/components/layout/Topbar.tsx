import { Menu as MenuIcon, LogOut, KeyRound, ChevronDown, WifiOff } from 'lucide-react'
import { Menu, MenuItem } from '../ui/Menu'
import { Avatar } from '../ui/Avatar'
import { RoleBadge } from '../ui/Badge'
import { ROLE_LABELS } from '../../lib/permissions'
import { useCurrentUser } from '../../hooks/usePermission'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { useAuth } from '../../features/auth/useAuth'
import { useNavigate } from 'react-router-dom'

export function Topbar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const user = useCurrentUser()
  const online = useOnlineStatus()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="safe-top sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onOpenMobileMenu}
        aria-label="Open menu"
        className="focus-ring -ml-1 rounded-md p-2 text-text hover:bg-bg lg:hidden"
      >
        <MenuIcon className="size-5" />
      </button>

      <div className="min-w-0 flex-1" />

      {!online && (
        <span className="hidden items-center gap-1.5 rounded-full bg-warning-bg px-2.5 py-1 text-[12px] font-medium text-warning sm:flex">
          <WifiOff className="size-3.5" />
          Offline
        </span>
      )}

      {user && (
        <Menu
          trigger={({ toggle }) => (
            <button onClick={toggle} className="focus-ring flex items-center gap-2 rounded-md py-1 pl-1 pr-2 hover:bg-bg">
              <Avatar name={user.name} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block max-w-[140px] truncate text-[13px] font-semibold text-text">{user.name}</span>
                <span className="block text-[11.5px] text-text-secondary">{ROLE_LABELS[user.role]}</span>
              </span>
              <ChevronDown className="hidden size-4 text-text-muted sm:block" />
            </button>
          )}
        >
          <div className="border-b border-border px-3.5 py-2.5 sm:hidden">
            <p className="truncate text-[13px] font-semibold text-text">{user.name}</p>
            <div className="mt-1">
              <RoleBadge role={user.role} label={ROLE_LABELS[user.role]} />
            </div>
          </div>
          <MenuItem icon={<KeyRound className="size-4" />} onClick={() => navigate('/profile')}>
            Change password
          </MenuItem>
          <MenuItem icon={<LogOut className="size-4" />} danger onClick={signOut}>
            Sign out
          </MenuItem>
        </Menu>
      )}
    </header>
  )
}
