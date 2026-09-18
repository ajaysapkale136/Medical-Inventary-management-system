import { useEffect, useState } from 'react'
import { medicineApi, supplierApi } from '../api/services'
import { useAuth } from '../context/AuthContext'

const empty = { name: '', contactNumber: '', email: '', address: '', rating: 5 }

export default function Suppliers() {
  const { hasRole } = useAuth()
  const canEdit = hasRole('ADMIN', 'PHARMACIST')
  const canAddStock = hasRole('SUPPLIER')
  const [suppliers, setSuppliers] = useState([])
  const [keyword, setKeyword] = useState('')
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [medicines, setMedicines] = useState([])
  const [cart, setCart] = useState([])
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const { data } = await supplierApi.list(keyword)
      setSuppliers(data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load suppliers')
    }
  }
  useEffect(() => { load() }, [keyword])

  const save = async (e) => {
    e.preventDefault()
    try {
      if (editingId) await supplierApi.update(editingId, form)
      else await supplierApi.create(form)
      setForm(empty)
      setEditingId(null)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save supplier')
    }
  }

  const showMedicines = async (supplier) => {
    try {
      const { data } = await medicineApi.list()
      setSelectedSupplier(supplier)
      setMedicines(data)
      setCart([])
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load medicines')
    }
  }

  const addStock = async (medicine) => {
    const quantity = Number(window.prompt(`Delivered quantity for ${medicine.name}`, '1'))
    if (!quantity || quantity < 1) return
    try {
      await medicineApi.addStock(medicine.id, { quantity, note: `Delivered through ${selectedSupplier.name}` })
      await showMedicines(selectedSupplier)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add stock')
    }
  }

  const addToCart = (medicine) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === medicine.id)
      if (existing) {
        return current.map((item) => item.id === medicine.id
          ? { ...item, quantity: item.quantity + 1 }
          : item)
      }
      return [...current, {
        id: medicine.id,
        name: medicine.name,
        batchNumber: medicine.batchNumber,
        quantity: 1,
        unitCost: Number(medicine.price) || 0,
      }]
    })
  }

  const updateCartItem = (id, field, value) => {
    const numericValue = Number(value)
    setCart((current) => current.map((item) => item.id === id
      ? { ...item, [field]: numericValue }
      : item))
  }

  const removeCartItem = (id) => setCart((current) => current.filter((item) => item.id !== id))

  const cartTotal = cart.reduce((total, item) => total + (item.quantity * item.unitCost), 0)

  const checkout = async () => {
    if (!selectedSupplier || cart.length === 0) return
    if (cart.some((item) => !item.quantity || item.quantity < 1 || item.unitCost < 0)) {
      setError('Each cart item needs a quantity of at least 1 and a valid unit cost.')
      return
    }
    if (!window.confirm(`Buy ${cart.length} medicine type(s) from ${selectedSupplier.name} for Rs ${cartTotal.toFixed(2)}?`)) return

    setCheckingOut(true)
    setError('')
    try {
      for (const item of cart) {
        await medicineApi.restock(item.id, {
          supplierId: selectedSupplier.id,
          quantity: item.quantity,
          totalCost: item.quantity * item.unitCost,
          note: `Purchased from ${selectedSupplier.name}`,
        })
      }
      setCart([])
      await showMedicines(selectedSupplier)
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout could not be completed. Any completed purchases were saved.')
    } finally {
      setCheckingOut(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this supplier?')) return
    try {
      await supplierApi.remove(id)
      if (selectedSupplier?.id === id) {
        setSelectedSupplier(null)
        setMedicines([])
        setCart([])
      }
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete supplier')
    }
  }

  return (
    <div className="space-y-5">
<div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(52,211,153,0.18),rgba(8,25,23,0.95))] p-5 shadow-lg shadow-black/20">
      <h2 className="text-2xl font-semibold text-white">Suppliers</h2>
      <p className="mt-1 text-sm muted-text">Track supplier performance and view the medicines they provide.</p>
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
            Add Supplier
          </button>
        </div>
      )}

      <input className="input max-w-sm" placeholder="Search supplier"
             value={keyword} onChange={(e) => setKeyword(e.target.value)} />

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

      {canEdit && showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setEditingId(null); setForm(empty); setError(''); setShowForm(false) }} />
          <form onSubmit={save} className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-[rgba(8,25,23,0.98)] p-6 shadow-2xl shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">{editingId ? 'Edit supplier' : 'Add supplier'}</h3>
              <button type="button" className="btn-outline !px-3 !py-1.5" onClick={() => { setEditingId(null); setForm(empty); setError(''); setShowForm(false) }}>Close</button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="label">Name</label>
                <input className="input" required value={form.name}
                       onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">Contact number</label>
                <input className="input" value={form.contactNumber}
                       onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} /></div>
              <div><label className="label">Email</label>
                <input className="input" type="email" value={form.email}
                       onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="label">Address</label>
                <input className="input" value={form.address}
                       onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => { setEditingId(null); setForm(empty); setError(''); setShowForm(false) }}>Cancel</button>
              <button className="btn-primary">{editingId ? 'Update' : 'Add'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase muted-text">
            <tr><th className="py-2">Name</th><th>Contact</th><th>Email</th><th>Address</th><th>Rating</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-t align-top">
                <td className="py-2 font-medium">{s.name}
                </td>
                <td>{s.contactNumber}</td><td>{s.email}</td><td>{s.address}</td><td>{s.rating}/5</td>
                <td className="space-x-1 whitespace-nowrap">
                  <button className="btn-outline !px-2 !py-1" onClick={() => showMedicines(s)}>Medicines</button>
                  {canEdit && <button className="btn-outline !px-2 !py-1"
                    onClick={() => { setEditingId(s.id); setForm(s); setShowForm(true) }}>Edit</button>}
                  {hasRole('ADMIN') && <button className="btn-danger !px-2 !py-1"
                    onClick={() => remove(s.id)}>Del</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSupplier && (
        <div className="card overflow-x-auto">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">All medicines</h3>
              <p className="text-sm muted-text">Choose a medicine to add delivered stock or buy from {selectedSupplier.name}.</p>
            </div>
            <button className="btn-outline !px-2 !py-1" onClick={() => { setSelectedSupplier(null); setMedicines([]); setCart([]) }}>Close</button>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase muted-text">
              <tr><th className="py-2">Medicine</th><th>Batch</th><th>In stock</th><th>Price</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {medicines.map((medicine) => (
                <tr key={medicine.id} className="border-t">
                  <td className="py-2 font-medium">{medicine.name}</td>
                  <td>{medicine.batchNumber}</td><td>{medicine.quantity}</td><td>{medicine.price}</td>
                  <td className="space-x-1 whitespace-nowrap">
                    {canAddStock && <button className="btn-outline !px-2 !py-1" onClick={() => addStock(medicine)}>Add stock</button>}
                    {canEdit && <button className="btn-primary !px-2 !py-1" onClick={() => addToCart(medicine)}>Add to cart</button>}
                  </td>
                </tr>
              ))}
              {medicines.length === 0 && <tr><td colSpan="5" className="py-4 muted-text">No medicines found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && selectedSupplier && cart.length > 0 && (
        <div className="card overflow-x-auto">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Purchase cart</h3>
              <p className="text-sm muted-text">Bill for {selectedSupplier.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm muted-text">Total bill</p>
              <p className="text-xl font-semibold">Rs {cartTotal.toFixed(2)}</p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase muted-text">
              <tr><th className="py-2">Medicine</th><th>Batch</th><th>Quantity</th><th>Unit cost</th><th>Total</th><th></th></tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="py-2 font-medium">{item.name}</td><td>{item.batchNumber}</td>
                  <td><input className="input !w-20 !py-1" type="number" min="1" value={item.quantity}
                             onChange={(e) => updateCartItem(item.id, 'quantity', e.target.value)} /></td>
                  <td><input className="input !w-28 !py-1" type="number" min="0" step="0.01" value={item.unitCost}
                             onChange={(e) => updateCartItem(item.id, 'unitCost', e.target.value)} /></td>
                  <td>Rs {(item.quantity * item.unitCost).toFixed(2)}</td>
                  <td><button className="btn-danger !px-2 !py-1" onClick={() => removeCartItem(item.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <button className="btn-primary" onClick={checkout} disabled={checkingOut}>
              {checkingOut ? 'Processing purchase...' : `Buy now — Rs ${cartTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
