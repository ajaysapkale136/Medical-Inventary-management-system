import { reportApi } from '../api/services'
import { BarChart, LineChart } from '../components/DashboardCharts'

const types = [
  { key: 'inventory', label: 'Full inventory report' },
  { key: 'low-stock', label: 'Low stock report' },
  { key: 'near-expiry', label: 'Near-expiry report' },
  { key: 'expired', label: 'Expired medicines report' },
]

const chartItems = [
  { label: 'Inventory', value: 85 },
  { label: 'Low stock', value: 34 },
  { label: 'Near expiry', value: 24 },
  { label: 'Expired', value: 12 },
]

const trendItems = [
  { label: 'Jan', value: 40 },
  { label: 'Feb', value: 48 },
  { label: 'Mar', value: 54 },
  { label: 'Apr', value: 62 },
  { label: 'May', value: 70 },
  { label: 'Jun', value: 85 },
]

export default function Reports() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Reports &amp; Export</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {types.map((t) => (
          <div key={t.key} className="card flex items-center justify-between">
            <span className="font-medium">{t.label}</span>
            <div className="space-x-2">
              <button className="btn-outline" onClick={() => reportApi.download('pdf', t.key)}>PDF</button>
              <button className="btn-primary" onClick={() => reportApi.download('excel', t.key)}>Excel</button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Report summary</h3>
            <span className="text-sm muted-text">Bar chart</span>
          </div>
          <BarChart items={chartItems} />
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Performance trend</h3>
            <span className="text-sm muted-text">Line chart</span>
          </div>
          <LineChart items={trendItems} color="#a7f3d0" />
        </div>
      </div>
    </div>
  )
}
