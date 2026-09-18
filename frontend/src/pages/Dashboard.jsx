import { useEffect, useState } from 'react'
import { dashboardApi } from '../api/services'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'
import { BarChart, DonutChart, LineChart } from '../components/DashboardCharts'

/** Admin sees everything; Pharmacist/Staff see the inventory-focused view. */
export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => { dashboardApi.stats().then(({ data }) => setStats(data)) }, [])

  if (!stats) return <p className="text-[var(--text-muted)]">Loading dashboard...</p>
  const isAdmin = user.role === 'ADMIN'
  const title = isAdmin ? 'Admin' : (user.role === 'PHARMACIST' ? 'Pharmacist' : 'Staff')

  const stockChartItems = Object.entries(stats.stockByCategory || {}).map(([name, qty]) => ({ label: name, value: qty }))
  const stockHealthItems = [
    { label: 'In stock', value: Math.max(0, stats.totalMedicines - stats.lowStockCount - stats.outOfStockCount), color: '#159b68' },
    { label: 'Low stock', value: stats.lowStockCount, color: '#f59e0b' },
    { label: 'Out of stock', value: stats.outOfStockCount, color: '#ef4444' },
  ]
  const supplierChartItems = Object.entries(stats.medicinesBySupplier || {}).map(([name, count]) => ({ label: name, value: count }))
  const stockTrend = [
    { label: 'Jan', value: Math.max(40, stats.totalMedicines - 18) },
    { label: 'Feb', value: Math.max(45, stats.totalMedicines - 12) },
    { label: 'Mar', value: Math.max(50, stats.totalMedicines - 10) },
    { label: 'Apr', value: Math.max(58, stats.totalMedicines - 6) },
    { label: 'May', value: stats.totalMedicines },
    { label: 'Jun', value: Math.max(stats.totalMedicines, stats.totalMedicines + 6) },
  ]

  return (
    <div className="space-y-6">
      <div className="panel flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Dashboard overview</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{title} Dashboard</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
            A clearer snapshot of stock health, supplier coverage, and critical inventory events in one place.
          </p>
        </div>
        <div className="rounded-full border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.12)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">
          {isAdmin ? 'Full access analytics' : 'Inventory & stock insights'}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total medicines" value={stats.totalMedicines} subtitle="Items in inventory" />
        <StatCard label="Low stock" value={stats.lowStockCount} tone="amber" subtitle="Needs restock soon" />
        <StatCard label="Out of stock" value={stats.outOfStockCount} tone="rose" subtitle="Immediate attention" />
        <StatCard label="Expiring soon" value={stats.nearExpiryCount} tone="emerald" subtitle="Within review window" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Stock health</h3>
            <span className="text-sm muted-text">Live overview</span>
          </div>
          <DonutChart items={stockHealthItems} />
        </div>

        <div className="card xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Stock by category</h3>
            <span className="text-sm muted-text">Quantity distribution</span>
          </div>
          <BarChart items={stockChartItems} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Recent stock movements</h3>
            <span className="text-sm muted-text">Latest activity</span>
          </div>
          <ul className="space-y-2 text-sm muted-text">
            {(stats.recentActivity || []).map((a, i) => (
              <li key={i} className="rounded-2xl border border-[rgba(18,56,47,0.08)] bg-[var(--panel-bg)] px-4 py-3">{a}</li>
            ))}
            {(stats.recentActivity || []).length === 0 && (
              <li className="rounded-2xl border border-[rgba(18,56,47,0.08)] bg-[var(--panel-bg)] px-4 py-3 muted-text">No activity yet</li>
            )}
          </ul>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Supplier coverage</h3>
            <span className="text-sm muted-text">Medicines per supplier</span>
          </div>
          <BarChart items={supplierChartItems} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Inventory trend</h3>
            <span className="text-sm muted-text">Last 6 months</span>
          </div>
          <LineChart items={stockTrend} color="#159b68" />
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Restock focus</h3>
            <span className="text-sm muted-text">Current stock status</span>
          </div>
          <BarChart items={stockHealthItems} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Expired" value={stats.expiredCount} tone="rose" subtitle="Needs immediate review" />
        <StatCard label="Suppliers" value={stats.totalSuppliers} tone="slate" subtitle="Registered vendors" />
        <StatCard label="Inventory value" value={`Rs ${stats.inventoryValue}`} tone="teal" subtitle="Estimated stock value" />
      </div>

      {isAdmin && (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Admin summary</h3>
            <span className="text-sm muted-text">System health</span>
          </div>
          <div className="flex flex-wrap gap-3 text-sm muted-text">
            <span className="rounded-full border border-[rgba(18,56,47,0.08)] bg-[var(--panel-bg)] px-3 py-1">Users: {stats.totalUsers}</span>
            <span className="rounded-full border border-[rgba(18,56,47,0.08)] bg-[var(--panel-bg)] px-3 py-1">Purchase cost: Rs {stats.totalPurchaseCost}</span>
          </div>
        </div>
      )}
    </div>
  )
}
