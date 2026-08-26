import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, Coins, LayoutDashboard, LogOut, Plus, Shield, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchCoinBalance, clearCoins } from '../../features/coins/coinsSlice'
import { Logo } from '../Logo'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return '?'
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Navbar({ authed = false }: { authed?: boolean }) {
  const { profile, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const coinBalance = useAppSelector((state) => state.coins.balance)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (authed) {
      void dispatch(fetchCoinBalance())
    } else {
      dispatch(clearCoins())
    }
  }, [authed, profile?.id, dispatch])

  useEffect(() => {
    function onClickOutside(event: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleLogout(): Promise<void> {
    setMenuOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const displayName = profile?.displayName || profile?.email?.split('@')[0] || 'User'

  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-3">
        <div className="glass-strong flex h-14 items-center justify-between rounded-2xl border border-white/60 px-4 shadow-lg shadow-slate-900/5 sm:px-5">
          <Link to={authed ? '/dashboard' : '/'} className="shrink-0">
            <Logo />
          </Link>

          {!authed && (
            <nav className="hidden items-center gap-8 md:flex">
              <a href="/#features" className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900">
                Features
              </a>
              <a href="/#how-it-works" className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900">
                How it works
              </a>
            </nav>
          )}

          {authed ? (
            <div className="flex items-center gap-2.5">
              {coinBalance !== null && (
                <Link
                  to="/pricing"
                  title="Coin balance — click to top up"
                  className="group flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-sm font-bold text-amber-700 transition-all hover:shadow-md hover:shadow-amber-500/10"
                >
                  <Coins className="size-4 text-amber-500 group-hover:animate-float" />
                  {coinBalance.toLocaleString()}
                </Link>
              )}
              <Link
                to="/pricing"
                title="Buy more coins"
                className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:border-brand-300 hover:text-brand-500 hover:shadow-md"
              >
                <Plus className="size-4" />
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white py-1 pl-1 pr-2.5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
                >
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" className="size-8 rounded-full object-cover ring-2 ring-white" />
                  ) : (
                    <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold text-white ring-2 ring-white">
                      {initials(displayName)}
                    </span>
                  )}
                  <span className="hidden max-w-[8rem] truncate text-sm font-semibold text-slate-700 sm:block">
                    {displayName}
                  </span>
                  <ChevronDown className={`size-3.5 text-slate-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-900/10 animate-fade-in-scale">
                    <div className="border-b border-slate-100 px-3.5 py-3">
                      <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
                      <p className="truncate text-xs text-slate-400">{profile?.email}</p>
                    </div>
                    <div className="pt-1.5">
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-purple-50 hover:text-purple-700"
                        >
                          <Shield className="size-4" />
                          Admin Panel
                        </Link>
                      )}
                      <Link
                        to="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <LayoutDashboard className="size-4 text-slate-400" />
                        Dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                      >
                        <LogOut className="size-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link to="/login">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-accent-700 hover:shadow-brand-500/35 active:scale-[0.98]"
              >
                <Sparkles className="size-3.5" />
                Sign in
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
