import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { useAuthStore } from './store/authStore'
import { bootstrapAuth } from './features/auth/bootstrapAuth'
import { PageSpinner } from './components/ui/Spinner'
import { Toaster } from './components/ui/Toaster'
import { AppShell } from './components/layout/AppShell'
import { RequireAuth } from './components/guards/RequireAuth'
import { RequirePermission, RequireRole } from './components/guards/RequirePermission'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { OrganizationsListPage } from './features/organizations/OrganizationsListPage'
import { OrganizationSettingsPage } from './features/organizations/OrganizationSettingsPage'
import { UsersListPage } from './features/users/UsersListPage'
import { GeoExplorerPage } from './features/geo/GeoExplorerPage'
import { GeoImportPage } from './features/geo/GeoImportPage'
import { HouseholdsListPage } from './features/households/HouseholdsListPage'
import { HouseholdSearchPage } from './features/households/HouseholdSearchPage'
import { MapPage } from './features/map/MapPage'
import { VotersListPage } from './features/voters/VotersListPage'
import { VoterImportPage } from './features/voters/VoterImportPage'
import { VoterImportJobDetailPage } from './features/voters/VoterImportJobDetailPage'
import { VoterDetailPage } from './features/voters/VoterDetailPage'
import { TasksListPage } from './features/tasks/TasksListPage'
import { TaskDetailPage } from './features/tasks/TaskDetailPage'
import { ReportsPage } from './features/reports/ReportsPage'
import { AuditLogsPage } from './features/audit/AuditLogsPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { NotFoundPage } from './features/misc/NotFoundPage'
import { UnauthorizedPage } from './features/misc/UnauthorizedPage'

function AppRoutes() {
  const hydrated = useAuthStore((s) => s.hydrated)

  useEffect(() => {
    bootstrapAuth()
  }, [])

  if (!hydrated) return <PageSpinner />

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/organizations"
            element={
              <RequirePermission permission="org:list">
                <OrganizationsListPage />
              </RequirePermission>
            }
          />
          <Route
            path="/organization"
            element={
              <RequireRole roles={['CAMPAIGN_ADMIN']}>
                <OrganizationSettingsPage />
              </RequireRole>
            }
          />
          <Route
            path="/users"
            element={
              <RequirePermission permission="users:read">
                <UsersListPage />
              </RequirePermission>
            }
          />
          <Route path="/geo" element={<GeoExplorerPage />} />
          <Route
            path="/geo/import"
            element={
              <RequirePermission permission="geo:manage_admin_units">
                <GeoImportPage />
              </RequirePermission>
            }
          />
          <Route
            path="/households"
            element={
              <RequirePermission permission="household:read">
                <HouseholdsListPage />
              </RequirePermission>
            }
          />
          <Route
            path="/households/search"
            element={
              <RequirePermission permission="household:read">
                <HouseholdSearchPage />
              </RequirePermission>
            }
          />
          <Route
            path="/map"
            element={
              <RequirePermission permission="household:read">
                <MapPage />
              </RequirePermission>
            }
          />
          <Route
            path="/voters"
            element={
              <RequirePermission permission="voter:read">
                <VotersListPage />
              </RequirePermission>
            }
          />
          <Route
            path="/voters/import"
            element={
              <RequirePermission permission="voter:import_read">
                <VoterImportPage />
              </RequirePermission>
            }
          />
          <Route
            path="/voters/import-jobs/:id"
            element={
              <RequirePermission permission="voter:import_read">
                <VoterImportJobDetailPage />
              </RequirePermission>
            }
          />
          <Route
            path="/voters/:id"
            element={
              <RequirePermission permission="voter:read">
                <VoterDetailPage />
              </RequirePermission>
            }
          />
          <Route
            path="/tasks"
            element={
              <RequirePermission permission="task:read">
                <TasksListPage />
              </RequirePermission>
            }
          />
          <Route
            path="/tasks/:id"
            element={
              <RequirePermission permission="task:read">
                <TaskDetailPage />
              </RequirePermission>
            }
          />
          <Route
            path="/reports"
            element={
              <RequirePermission permission="report:read">
                <ReportsPage />
              </RequirePermission>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <RequirePermission permission="audit:read">
                <AuditLogsPage />
              </RequirePermission>
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
