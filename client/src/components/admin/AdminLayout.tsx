import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Loader2 } from 'lucide-react'

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/monitor', label: 'Monitor' },
]

export function AdminLayout() {
  const { isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-500" />
      </div>
    )
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-bold text-white shadow-lg shadow-brand-500/20">
          A
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Admin Panel</h1>
          <p className="text-xs text-slate-500">Platform management</p>
        </div>
      </div>

      <div className="mb-6 flex gap-1 rounded-2xl border border-slate-200/80 bg-white/60 p-1 shadow-sm backdrop-blur-sm">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="animate-fade-in">
        <Outlet />
      </div>
    </div>
  )
}
