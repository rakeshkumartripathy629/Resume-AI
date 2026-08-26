import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchAdminStats } from '../../features/admin/adminSlice'
import { Loader2, Users, Coins, CreditCard, Activity, TrendingUp, BarChart3 } from 'lucide-react'

const statCard = 'glass rounded-2xl p-5 border border-slate-100/80 shadow-sm hover:shadow-md transition-all'

function formatPaise(paise: number) {
  return `₹${(paise / 100).toLocaleString()}`
}

export default function AdminDashboard() {
  const dispatch = useAppDispatch()
  const { stats, loading, error } = useAppSelector((s) => s.admin)

  useEffect(() => {
    void dispatch(fetchAdminStats())
  }, [dispatch])

  if (loading && !stats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-600">
        {error}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={statCard}>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50">
              <Users className="size-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Total Users</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.users.total.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">+{stats.users.newToday} today · +{stats.users.newThisWeek} this week</p>
        </div>

        <div className={statCard}>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50">
              <Coins className="size-5 text-amber-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Coins in Circulation</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.coins.totalInCirculation.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">avg {stats.coins.avgPerUser.toLocaleString()} per user</p>
        </div>

        <div className={statCard}>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50">
              <CreditCard className="size-5 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Revenue</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{formatPaise(stats.revenue.totalPaise)}</p>
          <p className="mt-1 text-xs text-slate-500">{stats.revenue.totalPayments} payments</p>
        </div>

        <div className={statCard}>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50">
              <Activity className="size-5 text-purple-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500">API Usage</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            {stats.apiUsage.scores + stats.apiUsage.tailors + stats.apiUsage.interviews + stats.apiUsage.roadmaps}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {stats.apiUsage.scores} scores · {stats.apiUsage.tailors} tailors · {stats.apiUsage.interviews} interviews
          </p>
        </div>
      </div>

      {stats.revenueByDay.length > 0 && (
        <div className="glass rounded-2xl border border-slate-100/80 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="size-5 text-brand-500" />
            <h2 className="text-sm font-bold text-slate-900">Revenue — Last 7 Days</h2>
          </div>
          <div className="flex items-end gap-3">
            {stats.revenueByDay.map((day) => {
              const maxRevenue = Math.max(...stats.revenueByDay.map((d) => d.revenue), 1)
              const height = (day.revenue / maxRevenue) * 100
              return (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">{formatPaise(day.revenue)}</span>
                  <div
                    className="w-full rounded-xl bg-gradient-to-t from-brand-500 to-accent-400 transition-all duration-500"
                    style={{ height: `${Math.max(height, 8)}%` }}
                  />
                  <span className="text-[10px] font-medium text-slate-400">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Scores Run', value: stats.apiUsage.scores, color: 'text-blue-600' },
          { label: 'Tailors Run', value: stats.apiUsage.tailors, color: 'text-emerald-600' },
          { label: 'Interviews', value: stats.apiUsage.interviews, color: 'text-purple-600' },
          { label: 'Roadmaps', value: stats.apiUsage.roadmaps, color: 'text-amber-600' },
        ].map((item) => (
          <div key={item.label} className="glass flex items-center gap-4 rounded-2xl border border-slate-100/80 p-5 shadow-sm">
            <TrendingUp className={`size-5 ${item.color}`} />
            <div>
              <p className={`text-2xl font-extrabold ${item.color}`}>{item.value}</p>
              <p className="text-xs font-semibold text-slate-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
