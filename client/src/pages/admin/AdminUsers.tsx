import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchAdminUsers, fetchAdminUser, adjustUserCoins, toggleUserRole, deleteUser, clearUserDetail } from '../../features/admin/adminSlice'
import { api, apiErrorMessage } from '../../lib/api'
import { Loader2, Search, ChevronLeft, ChevronRight, Coins, X, Shield, ShieldOff, Trash2, User } from 'lucide-react'

function formatCoins(n: number) { return n.toLocaleString() }
function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' }
function formatDateTime(d: string) { return d ? new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' }

export default function AdminUsers() {
  const dispatch = useAppDispatch()
  const { users, usersPagination, userDetail, loading, error } = useAppSelector((s) => s.admin)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('createdAt')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [coinModalOpen, setCoinModalOpen] = useState(false)
  const [coinAmount, setCoinAmount] = useState('')
  const [coinReason, setCoinReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    void dispatch(fetchAdminUsers({ page, limit: 20, search, sort, order }))
  }, [dispatch, page, sort, order])

  useEffect(() => {
    if (!coinModalOpen) { setCoinAmount(''); setCoinReason('') }
  }, [coinModalOpen])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    void dispatch(fetchAdminUsers({ page: 1, limit: 20, search, sort, order }))
  }

  async function handleUserClick(id: string) {
    setSelectedUserId(id)
    await dispatch(fetchAdminUser(id))
  }

  async function handleCoinAdjust() {
    if (!selectedUserId || !coinAmount) return
    const amount = parseInt(coinAmount, 10)
    if (isNaN(amount) || amount === 0) return
    setActionLoading('coin')
    await dispatch(adjustUserCoins({ id: selectedUserId, amount, reason: coinReason }))
    setCoinModalOpen(false)
    setActionLoading(null)
    void dispatch(fetchAdminUsers({ page, limit: 20, search, sort, order }))
  }

  async function handleToggleRole(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Change this user\'s role?')) return
    setActionLoading(id)
    await dispatch(toggleUserRole(id))
    setActionLoading(null)
    void dispatch(fetchAdminUsers({ page, limit: 20, search, sort, order }))
  }

  async function handleDeleteUser(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return
    setActionLoading(id)
    await dispatch(deleteUser(id))
    setActionLoading(null)
    setSelectedUserId(null)
    dispatch(clearUserDetail())
  }

  function handleSort(field: string) {
    if (sort === field) setOrder(order === 'asc' ? 'desc' : 'asc')
    else { setSort(field); setOrder('desc') }
    setPage(1)
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sort !== field) return null
    return <span className="ml-1">{order === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by email or name…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10" />
        </div>
        <button type="submit" className="glass rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Search</button>
      </form>

      {loading && <div className="flex min-h-[200px] items-center justify-center"><Loader2 className="size-6 animate-spin text-brand-500" /></div>}
      {!loading && error && <div className="glass rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="glass overflow-hidden rounded-2xl border border-slate-100/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {[{ key: 'displayName', label: 'User' }, { key: 'role', label: 'Role' }, { key: 'coins', label: 'Coins' }, { key: 'createdAt', label: 'Joined' }, { key: 'lastLoginAt', label: 'Last Login' }].map((col) => (
                    <th key={col.key} onClick={() => handleSort(col.key)} className="cursor-pointer px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700">
                      {col.label}<SortIcon field={col.key} />
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} onClick={() => void handleUserClick(u.id)} className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-brand-50/30">
                    <td className="flex items-center gap-3 px-4 py-3">
                      {u.photoURL ? <img src={u.photoURL} alt="" className="size-8 rounded-full object-cover" />
                        : <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-400 text-[10px] font-bold text-white">{(u.displayName || u.email || '?')[0].toUpperCase()}</span>}
                      <div>
                        <p className="font-semibold text-slate-800">{u.displayName}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-amber-600">{formatCoins(u.coins)}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-500">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedUserId(u.id); setCoinModalOpen(true) }}
                          className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100" title="Adjust coins">
                          <Coins className="size-3.5" />
                        </button>
                        <button onClick={(e) => void handleToggleRole(u.id, e)} disabled={actionLoading === u.id}
                          className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${u.role === 'admin' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                          title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}>
                          {u.role === 'admin' ? <ShieldOff className="size-3.5" /> : <Shield className="size-3.5" />}
                        </button>
                        <button onClick={(e) => void handleDeleteUser(u.id, e)} disabled={actionLoading === u.id}
                          className="rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-500 transition-colors hover:bg-red-100" title="Delete user">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-sm font-medium text-slate-400">No users found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {usersPagination && usersPagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">Page {usersPagination.page} of {usersPagination.pages} · {usersPagination.total} users</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="glass rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="size-4" /></button>
            <button disabled={page >= usersPagination.pages} onClick={() => setPage((p) => p + 1)} className="glass rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="size-4" /></button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {userDetail && selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setSelectedUserId(null); dispatch(clearUserDetail()) }}>
          <div className="glass w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">User Detail</h2>
              <button onClick={() => { setSelectedUserId(null); dispatch(clearUserDetail()) }} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>
            </div>
            <div className="mb-4 flex items-center gap-4 rounded-xl bg-slate-50 p-4">
              {userDetail.photoURL ? <img src={userDetail.photoURL} alt="" className="size-12 rounded-full object-cover" />
                : <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-400 text-sm font-bold text-white"><User className="size-5" /></span>}
              <div>
                <p className="font-bold text-slate-900">{userDetail.displayName}</p>
                <p className="text-sm text-slate-500">{userDetail.email}</p>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">Role</p>
                <p className={`text-sm font-bold ${userDetail.role === 'admin' ? 'text-purple-600' : 'text-slate-700'}`}>{userDetail.role}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">Coins</p>
                <p className="text-sm font-bold text-amber-600">{formatCoins(userDetail.coins)}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">Joined</p>
                <p className="text-sm font-semibold text-slate-700">{formatDate(userDetail.createdAt)}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">Last Login</p>
                <p className="text-sm font-semibold text-slate-700">{userDetail.lastLoginAt ? formatDateTime(userDetail.lastLoginAt) : '—'}</p>
              </div>
            </div>
            {userDetail.recentTransactions.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase text-slate-500">Recent Transactions</h3>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {userDetail.recentTransactions.map((t, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                      <div>
                        <span className="font-medium text-slate-700">{t.action}</span>
                        <span className="ml-2 text-slate-400">{formatDateTime(t.createdAt)}</span>
                      </div>
                      <span className={`font-bold ${t.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {t.amount >= 0 ? '+' : ''}{t.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button onClick={() => setCoinModalOpen(true)} className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all">
                <Coins className="mr-1 inline size-3.5" />Adjust Coins
              </button>
              <button onClick={(e) => void handleToggleRole(selectedUserId, e)}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all ${userDetail.role === 'admin' ? 'bg-slate-500 hover:bg-slate-600' : 'bg-purple-600 hover:bg-purple-700'}`}>
                {userDetail.role === 'admin' ? <><ShieldOff className="mr-1 inline size-3.5" />Demote</> : <><Shield className="mr-1 inline size-3.5" />Promote</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coin Adjust Modal */}
      {coinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setCoinModalOpen(false)}>
          <div className="glass w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-slate-900">Adjust Coins</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Amount (+add / -remove)</label>
                <input type="number" value={coinAmount} onChange={(e) => setCoinAmount(e.target.value)} placeholder="e.g. 50 or -10"
                  className="glass-input w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Reason</label>
                <input type="text" value={coinReason} onChange={(e) => setCoinReason(e.target.value)} placeholder="e.g. Bug fix compensation"
                  className="glass-input w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setCoinModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={() => void handleCoinAdjust()} disabled={!coinAmount || parseInt(coinAmount, 10) === 0 || actionLoading === 'coin'}
                  className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                  {actionLoading === 'coin' ? <Loader2 className="mr-1 inline size-3.5 animate-spin" /> : <Coins className="mr-1 inline size-3.5" />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
