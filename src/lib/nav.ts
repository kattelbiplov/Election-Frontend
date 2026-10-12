import {
  LayoutDashboard,
  Building2,
  Building,
  Users,
  MapPinned,
  ScrollText,
  UserCircle,
  Home,
  IdCard,
  ClipboardList,
  BarChart3,
  Map,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { Permission } from './permissions'
import type { UserRole } from './types'

export interface NavItem {
  label: string
  path: string
  icon: ComponentType<{ className?: string }>
  permission?: Permission
  roles?: UserRole[]
}

export const primaryNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Organizations', path: '/organizations', icon: Building2, permission: 'org:list' },
  { label: 'Organization', path: '/organization', icon: Building, roles: ['CAMPAIGN_ADMIN'] },
  { label: 'Users', path: '/users', icon: Users, permission: 'users:read' },
  { label: 'Geo Structure', path: '/geo', icon: MapPinned, permission: 'geo:read' },
  { label: 'Households', path: '/households', icon: Home, permission: 'household:read' },
  { label: 'Map', path: '/map', icon: Map, permission: 'household:read' },
  { label: 'Voters', path: '/voters', icon: IdCard, permission: 'voter:read' },
  { label: 'Tasks', path: '/tasks', icon: ClipboardList, permission: 'task:read' },
  { label: 'Reports', path: '/reports', icon: BarChart3, permission: 'report:read' },
  { label: 'Audit Logs', path: '/audit-logs', icon: ScrollText, permission: 'audit:read' },
]

export const secondaryNav: NavItem[] = [{ label: 'Profile', path: '/profile', icon: UserCircle }]
