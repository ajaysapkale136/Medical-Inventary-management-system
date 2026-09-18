import { useEffect, useState } from 'react'
import { medicineApi, saleApi } from '../api/services'

export default function Sell() {
  const [catalog, setCatalog] = useState([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [selected, setSelected] = useState({ medicineId: '', quantity: 1 })
  const [customer, setCustomer] = useState({ name: '', phone: '' })
  const [bill, setBill] = useState(null)
  const [billModalOpen, setBillModalOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadCatalog() }, [])
  const loadCatalog = () => medicineApi.list().then(({ data }) => setCatalog(data))

  const addLine = (e) => {
    e.preventDefault(); setError('')
    const med = catalog.find(m => m.id === Number(selected.medicineId))
    if (!med) return setError('Select a medicine')
    if (selected.quantity <= 0) return setError('Quantity must be > 0')

    setCart([...cart, { medicineId: med.id, name: med.name, quantity: Number(selected.quantity), unitPrice: med.price }])
    setSelected({ medicineId: '', quantity: 1 })
  }

  const total = cart.reduce((s, i) => s + (Number(i.unitPrice || 0) * i.quantity), 0)
  const visibleCatalog = catalog.filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return (m.name && m.name.toLowerCase().includes(q)) ||
           (m.batchNumber && m.batchNumber.toLowerCase().includes(q))
  })

  const downloadBillPdf = async (saleId) => {
    if (!saleId) return
    const res = await saleApi.downloadPdf(saleId)
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bill-${saleId}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  const submit = async () => {
    setError('')
    if (cart.length === 0) return setError('Cart is empty')
    try {
      if (!customer.name) return setError('Customer name is required')
      const req = { items: cart.map(c => ({ medicineId: c.medicineId, quantity: c.quantity })),
                    customerName: customer.name, customerPhone: customer.phone }
      const res = await saleApi.create(req)
      setBill(res.data)
      setBillModalOpen(true)
      setCart([])
      setCustomer({ name: '', phone: '' })
      loadCatalog()
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Sale failed'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold">New Sale</h2>

      <form onSubmit={addLine} className="card grid gap-3 md:grid-cols-4">
        {error && <p className="md:col-span-4 text-sm text-rose-600">{error}</p>}
        <div>
          <label className="label">Search</label>
          <input className="input" placeholder="Search name or batch" value={search}
                 onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <label className="label">Medicine</label>
          <select className="input" value={selected.medicineId}
                  onChange={(e) => setSelected({ ...selected, medicineId: e.target.value })}>
            <option value="">-- choose --</option>
            {visibleCatalog.map(m => <option key={m.id} value={m.id}>{m.name} • {m.batchNumber} • {m.quantity} in stock</option>)}
          </select>
        </div>
        <div>
          <label className="label">Quantity</label>
          <input className="input" type="number" min={1} value={selected.quantity}
                 onChange={(e) => setSelected({ ...selected, quantity: e.target.value })} />
        </div>
        <div className="flex items-end md:col-span-2">
          <button className="btn-primary">Add to cart</button>
        </div>
      </form>

      <div className="card">
        <h3 className="font-semibold mb-2">Cart</h3>
        <div className="grid md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Customer name</label>
            <input className="input" value={customer.name}
                   onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Customer phone</label>
            <input className="input" value={customer.phone}
                   onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase muted-text"><tr><th>Name</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr></thead>
          <tbody>
            {cart.map((c, idx) => (
              <tr key={idx} className="border-t"><td>{c.name}</td><td>{c.quantity}</td><td>{c.unitPrice}</td><td>{(c.unitPrice*c.quantity).toFixed(2)}</td>
                <td><button className="btn-outline !px-2 !py-1" onClick={() => setCart(cart.filter((_,i) => i!==idx))}>Remove</button></td></tr>
            ))}
            {cart.length===0 && <tr><td colSpan={5} className="muted-text">Cart is empty</td></tr>}
          </tbody>
        </table>
        <div className="mt-3 flex justify-between items-center">
          <div className="text-lg font-semibold">Total: {total.toFixed(2)}</div>
          <div>
            <button className="btn-primary mr-2" onClick={submit}>Checkout & Generate Bill</button>
          </div>
        </div>
      </div>

      {bill && billModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setBillModalOpen(false) }} />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-[rgba(8,25,23,0.98)] p-6 shadow-2xl shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Bill</h3>
              <button type="button" className="btn-outline !px-3 !py-1.5" onClick={() => setBillModalOpen(false)}>Close</button>
            </div>

            <div className="space-y-2 text-sm text-[var(--text-muted)]">
              <div>Created: {new Date(bill.createdAt).toLocaleString()}</div>
              <div>Customer: {bill.customerName} {bill.customerPhone && `• ${bill.customerPhone}`}</div>
            </div>

            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-xs uppercase muted-text"><tr><th>Name</th><th>Qty</th><th>Unit</th><th>Line</th></tr></thead>
              <tbody>
                {bill.items.map((i,idx) => (
                  <tr key={idx} className="border-t"><td>{i.name}</td><td>{i.quantity}</td><td>{i.unitPrice}</td><td>{i.lineTotal}</td></tr>
                ))}
              </tbody>
            </table>

            <div className="mt-5 flex items-center justify-between">
              <div className="text-lg font-semibold text-white">Total: {bill.total}</div>
              <div className="flex gap-2">
                <button type="button" className="btn-outline" onClick={() => setBillModalOpen(false)}>Done</button>
                <button type="button" className="btn-primary" onClick={() => downloadBillPdf(bill.saleId)}>Download PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
