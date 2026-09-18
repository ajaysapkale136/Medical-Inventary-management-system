import { useEffect, useState } from 'react'
import { notificationApi } from '../api/services'

export default function Notifications() {
  const [items, setItems] = useState([])
  const load = () => notificationApi.list().then(({ data }) => setItems(data))
  useEffect(() => { load() }, [])

  const styles = {
    LOW_STOCK: 'notification-warning',
    OUT_OF_STOCK: 'notification-neutral',
    NEAR_EXPIRY: 'notification-warning',
    EXPIRED: 'notification-danger',
    PURCHASE: 'notification-success',
    SYSTEM: 'notification-neutral',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Notifications</h2>
        <button className="btn-outline" onClick={() => notificationApi.readAll().then(load)}>Mark all read</button>
      </div>
      <div className="card space-y-2">
        {items.map((n) => (
          <div key={n.id} className={`notification-row flex items-center gap-3 border-b py-3 last:border-0 ${styles[n.type] || 'notification-neutral'}`}>
            <span className="badge notification-badge">{n.type.replaceAll('_', ' ')}</span>
            <span className="text-sm">{n.message}</span>
            <span className="ml-auto text-xs muted-text">{n.createdAt?.replace('T', ' ').slice(0, 16)}</span>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-[var(--text-muted)]">No notifications yet</p>}
      </div>
    </div>
  )
}
