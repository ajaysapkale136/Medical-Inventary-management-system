import { useEffect, useState } from 'react'
import { categoryApi, medicineApi, supplierApi } from '../api/services'
import { useAuth } from '../context/AuthContext'
import StockBadge from '../components/StockBadge'
import RestockModal from '../components/RestockModal'

const empty = {
  name: '', batchNumber: '', categoryId: '', supplierId: '',
  quantity: 0, lowStockThreshold: 20, manufacturingDate: '', expiryDate: '', price: 0,
}

export default function Inventory() {
  const { hasRole } = useAuth()
  const canEdit = hasRole('ADMIN', 'PHARMACIST', 'STAFF')
  const canAddStock = hasRole('SUPPLIER')
  const canPurchase = hasRole('ADMIN', 'PHARMACIST')

  const [medicines, setMedicines] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [filters, setFilters] = useState({ keyword: '', categoryId: '', supplierId: '', stockStatus: 'ALL' })
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [restockOpen, setRestockOpen] = useState(false)
  const [restockTarget, setRestockTarget] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    medicineApi.list(params).then(({ data }) => setMedicines(data))
  }

  useEffect(() => {
    categoryApi.list().then(({ data }) => setCategories(data))
    supplierApi.list().then(({ data }) => setSuppliers(data))
  }, [])
  useEffect(load, [filters])

  const save = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      ...form,
      categoryId: form.categoryId || null,
      supplierId: form.supplierId || null,
      quantity: Number(form.quantity),
      lowStockThreshold: Number(form.lowStockThreshold),
      price: Number(form.price),
    }
    try {
      if (editingId) await medicineApi.update(editingId, payload)
      else await medicineApi.create(payload)
      setForm(empty)
      setEditingId(null)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save medicine')
    }
  }

  const edit = (m) => {
    setEditingId(m.id)
    setShowForm(true)
    setForm({
      name: m.name, batchNumber: m.batchNumber,
      categoryId: m.category?.id || '', supplierId: m.supplier?.id || '',
      quantity: m.quantity, lowStockThreshold: m.lowStockThreshold,
      manufacturingDate: m.manufacturingDate || '', expiryDate: m.expiryDate, price: m.price,
    })
  }

  const move = async (m, dir) => {
    const qty = Number(prompt(`Quantity to ${dir === 'in' ? 'add' : 'remove'}?`, '1'))
    if (!qty) return
    try {
      if (dir === 'in') await medicineApi.addStock(m.id, { quantity: qty, note: 'Manual update' })
      else await medicineApi.removeStock(m.id, { quantity: qty, note: 'Dispensed' })
      load()
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(52,211,153,0.18),rgba(8,25,23,0.95))] p-5 shadow-lg shadow-black/20">
        <h2 className="text-2xl font-semibold text-white">Medicine Inventory</h2>
        <p className="mt-1 text-sm muted-text">Search, manage, and track medicines with a cleaner workflow.</p>
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditingId(null)
              setForm(empty)
              setError('')
              setShowForm(true)
            }}
          >
            Add Medicine
          </button>
        </div>
      )}

      {/* Search & filters */}
      <div className="card grid gap-3 md:grid-cols-4">
        <input className="input" placeholder="Search name / batch / supplier"
               value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
        <select className="input" value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input" value={filters.supplierId}
                onChange={(e) => setFilters({ ...filters, supplierId: e.target.value })}>
          <option value="">All suppliers</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input" value={filters.stockStatus}
                onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}>
          <option value="ALL">All stock</option>
          <option value="IN_STOCK">In stock</option>
          <option value="LOW">Low stock</option>
          <option value="OUT">Out of stock</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {canEdit && showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setEditingId(null); setForm(empty); setError(''); setShowForm(false) }} />
          <form onSubmit={save} className="relative z-10 w-full max-w-4xl rounded-3xl border border-white/10 bg-[rgba(8,25,23,0.98)] p-6 shadow-2xl shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">{editingId ? 'Edit medicine' : 'Add medicine'}</h3>
              <button type="button" className="btn-outline !px-3 !py-1.5" onClick={() => { setEditingId(null); setForm(empty); setError(''); setShowForm(false) }}>Close</button>
            </div>

            {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}

            <div className="grid gap-3 md:grid-cols-4">
              <div><label className="label">Name</label>
                <input className="input" value={form.name} required
                       onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">Batch number</label>
                <input className="input" value={form.batchNumber} required
                       onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} /></div>
              <div><label className="label">Category</label>
                <select className="input" value={form.categoryId}
                        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">-</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div><label className="label">Supplier</label>
                <select className="input" value={form.supplierId}
                        onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                  <option value="">-</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select></div>
              <div><label className="label">Quantity</label>
                <input className="input" type="number" min="0" value={form.quantity}
                       onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
              <div><label className="label">Low stock threshold</label>
                <input className="input" type="number" min="0" value={form.lowStockThreshold}
                       onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} /></div>
              <div><label className="label">Manufacturing date</label>
                <input className="input" type="date" value={form.manufacturingDate}
                       onChange={(e) => setForm({ ...form, manufacturingDate: e.target.value })} /></div>
              <div><label className="label">Expiry date</label>
                <input className="input" type="date" value={form.expiryDate} required
                       onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></div>
              <div><label className="label">Price</label>
                <input className="input" type="number" step="0.01" value={form.price}
                       onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => { setEditingId(null); setForm(empty); setError(''); setShowForm(false) }}>Cancel</button>
              <button className="btn-primary">{editingId ? 'Update' : 'Add'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase muted-text">
            <tr>
              <th className="py-2">Name</th><th>Batch</th><th>Category</th><th>Supplier</th>
              <th>Qty</th><th>Expiry</th><th>Price</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="py-2 font-medium">{m.name}</td>
                <td>{m.batchNumber}</td>
                <td>{m.category?.name || '-'}</td>
                <td>{m.supplier?.name || '-'}</td>
                <td>{m.quantity}</td>
                <td>{m.expiryDate}</td>
                <td>{m.price}</td>
                <td><StockBadge medicine={m} /></td>
                <td className="space-x-1 whitespace-nowrap">
                  {canAddStock && <button className="btn-outline !px-2 !py-1" onClick={() => move(m, 'in')}>Add stock</button>}
                  {hasRole('ADMIN', 'PHARMACIST', 'STAFF') && <button className="btn-outline !px-2 !py-1" onClick={() => move(m, 'out')}>-</button>}
                  {canEdit && <button className="btn-outline !px-2 !py-1" onClick={() => edit(m)}>Edit</button>}
                  {canPurchase && <button className="btn-outline !px-2 !py-1" onClick={() => { setRestockTarget(m); setRestockOpen(true) }}>Buy from supplier</button>}
                  {hasRole('ADMIN') && (
                    <button className="btn-danger !px-2 !py-1"
                            onClick={() => medicineApi.remove(m.id).then(load)}>Del</button>
                  )}
                </td>
              </tr>
            ))}
            {medicines.length === 0 && <tr><td colSpan="9" className="py-4 text-[var(--text-muted)]">No medicines found</td></tr>}
          </tbody>
        </table>
      </div>
      <RestockModal visible={restockOpen} onClose={() => setRestockOpen(false)}
                    medicine={restockTarget} suppliers={suppliers}
                    onRestocked={() => { load(); }} />
    </div>
  )
}
