// App.tsx
import { useState } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Scheduler from './pages/Scheduler'
import Tasks from './pages/TasksTest'
import Mentor from './pages/Mentor'
import Resources from './pages/Resources'
import Analytics from './pages/AnalyticsSimple'
import Rooms from './pages/Rooms'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { Avatar, AvatarFallback } from './components/ui/avatar'
import {
  LayoutDashboard,
  Calendar,
  Target,
  MessageSquare,
  TrendingUp,
  User,
  LogOut,
} from 'lucide-react'

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { token, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  if (!token) return <Navigate to="/login" replace />
  return children
}

function Layout({ children }: { children: JSX.Element }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/scheduler', label: 'Scheduler', icon: Calendar },
    { path: '/tasks', label: 'Tasks', icon: Target },
    { path: '/chat', label: 'AI Chat', icon: MessageSquare },
    { path: '/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile/Tablet Navbar */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
        <h1 className="text-lg font-bold">StudyBuddy</h1>
        <Button variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                sidebarOpen
                  ? 'M6 18L18 6M6 6l12 12'
                  : 'M4 6h16M4 12h16M4 18h16'
              }
            />
          </svg>
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed z-50 h-full w-60 border-r bg-card flex flex-col transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:static lg:flex 
          `}
        >
          <div className="p-6 border-b">
            <h1
              className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-700 to-pink-600 bg-clip-text text-transparent animate-gradient-x"
              style={{ backgroundSize: '200% auto' }}
            >
              StudyBuddy
            </h1>
            <p className="text-sm text-muted-foreground">AI-Powered Learning</p>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto flex-grow-2 w-[80%]">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setSidebarOpen(false)} // close on mobile/tablet
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t bg-card">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    L{user?.level || 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {user?.xp || 0} XP
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Overlay for mobile/tablet */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-6 overflow-auto max-w-[1440px] mx-auto w-full flex-grow-5">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/scheduler"
          element={
            <PrivateRoute>
              <Layout>
                <Scheduler />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <PrivateRoute>
              <Layout>
                <Tasks />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/mentor"
          element={
            <PrivateRoute>
              <Layout>
                <Mentor />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/resources"
          element={
            <PrivateRoute>
              <Layout>
                <Resources />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <PrivateRoute>
              <Layout>
                <Analytics />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/rooms"
          element={
            <PrivateRoute>
              <Layout>
                <Rooms />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Layout>
                <Profile />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Layout>
                <Chat />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
