import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchAdminUsers, fetchAdminUser, adjustUserCoins, clearUserDetail } from '../../features/admin/adminSlice'
import { Loader2, Search, ChevronLeft, ChevronRight, Coins, X } from 'lucide-react'

function formatCoins(n: number) { return n.toLocaleString() }
function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' }

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

  useEffect(() => {
    void dispatch(fetchAdminUsers({ page, limit: 20, search, sort, order }))
  }, [dispatch, page, search, sort, order])

  useEffect(() => {
    if (!coinModalOpen) {
      setCoinAmount('')
      setCoinReason('')
    }
  }, [coinModalOpen])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
  }

  async function handleUserClick(id: string) {
    setSelectedUserId(id)
    await dispatch(fetchAdminUser(id))
  }

  async function handleCoinAdjust() {
    if (!selectedUserId || !coinAmount) return
    const amount = parseInt(coinAmount, 10)
    if (isNaN(amount) || amount === 0) return
    await dispatch(adjustUserCoins({ id: selectedUserId, amount, reason: coinReason }))
    setCoinModalOpen(false)
    // Refresh user list
    void dispatch(fetchAdminUsers({ page, limit: 20, search, sort, order }))
  }

  function handleSort(field: string) {
    if (sort === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc')
    } else {
      setSort(field)
      setOrder('desc')
    }
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
          <input
            type="text"
            placeholder="Search by email or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10"
          />
        </div>
        <button type="submit" className="glass rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Search
        </button>
      </form>

      {loading && (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-brand-500" />
        </div>
      )}

      {!loading && error && (
        <div className="glass rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="glass overflow-hidden rounded-2xl border border-slate-100/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {[
                    { key: 'displayName', label: 'Name' },
                    { key: 'email', label: 'Email' },
                    { key: 'role', label: 'Role' },
                    { key: 'coins', label: 'Coins' },
                    { key: 'createdAt', label: 'Joined' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="cursor-pointer px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700"
                    >
                      {col.label}
                      <SortIcon field={col.key} />
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => void handleUserClick(u.id)}
                    className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-brand-50/30"
                  >
                    <td className="flex items-center gap-2 px-4 py-3">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="" className="size-7 rounded-full object-cover" />
                      ) : (
                        <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-400 text-[10px] font-bold text-white">
                          {(u.displayName || '?')[0].toUpperCase()}
                        </span>
                      )}
                      <span className="font-semibold text-slate-800">{u.displayName}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{formatCoins(u.coins)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedUserId(u.id)
                          setCoinModalOpen(true)
                        }}
                        className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                      >
                        <Coins className="mr-1 inline size-3" />
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm font-medium text-slate-400">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {usersPagination && usersPagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">
            Page {usersPagination.page} of {usersPagination.pages} · {usersPagination.total} users
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="glass rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              disabled={page >= usersPagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="glass rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {userDetail && selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setSelectedUserId(null); dispatch(clearUserDetail()) }}>
          <div className="glass w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">User Detail</h2>
              <button onClick={() => { setSelectedUserId(null); dispatch(clearUserDetail()) }} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="size-5" />
              </button>
            </div>
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-semibold text-slate-800">{userDetail.email}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-semibold text-slate-800">{userDetail.displayName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Role</span><span className={`font-bold uppercase ${userDetail.role === 'admin' ? 'text-purple-600' : 'text-slate-600'}`}>{userDetail.role}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Coins</span><span className="font-bold text-amber-600">{formatCoins(userDetail.coins)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Joined</span><span className="font-semibold text-slate-800">{formatDate(userDetail.createdAt)}</span></div>
            </div>
            {userDetail.recentTransactions.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase text-slate-500">Recent Transactions</h3>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {userDetail.recentTransactions.map((t, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                      <span className="font-medium text-slate-700">{t.action}</span>
                      <span className={`font-bold ${t.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {t.amount >= 0 ? '+' : ''}{t.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setCoinModalOpen(true)}
                className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
              >
                <Coins className="mr-1 inline size-3.5" />
                Adjust Coins
              </button>
            </div>
          </div>
        </div>
      )}

      {coinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setCoinModalOpen(false)}>
          <div className="glass w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-slate-900">Adjust Coins</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Amount (positive = add, negative = remove)</label>
                <input
                  type="number"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(e.target.value)}
                  placeholder="e.g. 50 or -10"
                  className="glass-input w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Reason</label>
                <input
                  type="text"
                  value={coinReason}
                  onChange={(e) => setCoinReason(e.target.value)}
                  placeholder="e.g. Bug fix compensation"
                  className="glass-input w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setCoinModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleCoinAdjust()}
                  disabled={!coinAmount || parseInt(coinAmount, 10) === 0}
                  className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
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
