import { useEffect, useState } from 'react'
import { medicineApi } from '../api/services'

export default function RestockModal({ visible, onClose, medicine, suppliers = [], initialSupplierId, onRestocked }) {
  const [quantity, setQuantity] = useState(1)
  const [supplierId, setSupplierId] = useState(medicine?.supplier?.id || '')
  const [totalCost, setTotalCost] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (medicine) {
      setSupplierId(initialSupplierId || medicine.supplier?.id || '')
      setQuantity(1)
      setTotalCost('')
      setNote('')
      setError('')
    }
  }, [medicine, visible, initialSupplierId])

  if (!visible || !medicine) return null

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await medicineApi.restock(medicine.id, {
        supplierId: supplierId || null,
        quantity: Number(quantity),
        totalCost: totalCost ? Number(totalCost) : null,
        note,
      })
      onRestocked && onRestocked()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restock')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <form className="relative z-10 w-full max-w-md card" onSubmit={submit}>
        <h3 className="font-semibold">Restock: {medicine.name}</h3>
        {error && <p className="text-rose-600">{error}</p>}
        <div className="grid gap-2 mt-2">
          <label className="label">Quantity</label>
          <input className="input" type="number" min="1" value={quantity}
                 onChange={(e) => setQuantity(e.target.value)} required />

          <label className="label">Supplier</label>
          <select className="input" value={supplierId || ''}
                  onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">Use medicine supplier</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <label className="label">Total cost (optional)</label>
          <input className="input" type="number" step="0.01" value={totalCost}
                 onChange={(e) => setTotalCost(e.target.value)} />

          <label className="label">Note (optional)</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-primary" disabled={loading}>{loading ? 'Restocking...' : 'Restock'}</button>
        </div>
      </form>
    </div>
  )
}
