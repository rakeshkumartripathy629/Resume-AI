import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchAdminPayments } from '../../features/admin/adminSlice'
import { Loader2, Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react'

function formatPaise(paise: number) { return `₹${(paise / 100).toLocaleString()}` }
function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' }

function StatusBadge({ status }: { status: string }) {
  if (status === 'paid') return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700"><CheckCircle className="size-3" />Paid</span>
  if (status === 'failed') return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600"><XCircle className="size-3" />Failed</span>
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700"><Clock className="size-3" />{status}</span>
}

export default function AdminPayments() {
  const dispatch = useAppDispatch()
  const { payments, paymentsPagination, loading, error } = useAppSelector((s) => s.admin)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    void dispatch(fetchAdminPayments({ page, limit: 20, status: statusFilter, search }))
  }, [dispatch, page, statusFilter])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    void dispatch(fetchAdminPayments({ page: 1, limit: 20, status: statusFilter, search }))
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="glass-input rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10"
        >
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </form>

      {loading && (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-brand-500" />
        </div>
      )}

      {!loading && error && (
        <div className="glass rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-600">{error}</div>
      )}

      {!loading && !error && (
        <div className="glass overflow-hidden rounded-2xl border border-slate-100/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">User</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Plan</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Coins</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 transition-colors hover:bg-brand-50/30">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{p.userEmail}</p>
                      {p.userName && <p className="text-xs text-slate-500">{p.userName}</p>}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{p.planId}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{formatPaise(p.amountInPaise)}</td>
                    <td className="px-4 py-3 font-semibold text-amber-600">+{p.coinAmount}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm font-medium text-slate-400">No payments found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {paymentsPagination && paymentsPagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">
            Page {paymentsPagination.page} of {paymentsPagination.pages} · {paymentsPagination.total} payments
          </p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="glass rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">
              <ChevronLeft className="size-4" />
            </button>
            <button disabled={page >= paymentsPagination.pages} onClick={() => setPage((p) => p + 1)} className="glass rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
