import { useEffect, useState } from 'react'
import { medicineApi, reportApi } from '../api/services'

/** Near-expiry and expired medicines. */
export default function ExpiryTracking() {
  const [near, setNear] = useState([])
  const [expired, setExpired] = useState([])

  useEffect(() => {
    medicineApi.nearExpiry().then(({ data }) => setNear(data))
    medicineApi.expired().then(({ data }) => setExpired(data))
  }, [])

  const Table = ({ rows, tone }) => (
    <table className="w-full text-sm">
      <thead className="text-left text-xs uppercase text-[var(--text-muted)]">
        <tr><th className="py-2">Name</th><th>Batch</th><th>Qty</th><th>Expiry</th></tr>
      </thead>
      <tbody>
        {rows.map((m) => (
          <tr key={m.id} className="border-t">
            <td className="py-2">{m.name}</td><td>{m.batchNumber}</td><td>{m.quantity}</td>
            <td className={tone}>{m.expiryDate}</td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan="4" className="py-3 text-[var(--text-muted)]">Nothing here</td></tr>}
      </tbody>
    </table>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Expiry Tracking</h2>
        <div className="space-x-2">
          <button className="btn-outline" onClick={() => reportApi.download('pdf', 'near-expiry')}>Near-expiry PDF</button>
          <button className="btn-outline" onClick={() => reportApi.download('excel', 'expired')}>Expired Excel</button>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-2 font-semibold text-amber-600">Expiring in the next 30 days ({near.length})</h3>
        <Table rows={near} tone="text-amber-600" />
      </div>

      <div className="card">
        <h3 className="mb-2 font-semibold text-rose-600">Already expired ({expired.length})</h3>
        <Table rows={expired} tone="text-rose-600" />
      </div>
    </div>
  )
}
