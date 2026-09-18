import { useEffect, useState } from 'react'
import { purchaseApi, saleApi } from '../api/services'

export default function SalesAdmin() {
  const [sales, setSales] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [salesResponse, purchasesResponse] = await Promise.all([
        saleApi.listAdmin(),
        purchaseApi.list(),
      ])
      setSales(salesResponse.data)
      setPurchases(purchasesResponse.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const downloadBill = async (saleId) => {
    const res = await saleApi.downloadPdf(saleId)
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bill-${saleId}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Sales & Purchase History</h2>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="muted-text">Loading sales...</p>
        ) : sales.length === 0 ? (
          <p className="muted-text">No sales recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase muted-text">
              <tr>
                <th className="py-2">Bill</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Sold By</th>
                <th>Total</th>
                <th>Date</th>
                <th>Items</th>
                <th>More</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.saleId} className="border-t">
                  <td>#{sale.saleId}</td>
                  <td>{sale.customerName || '-'}</td>
                  <td>{sale.customerPhone || '-'}</td>
                  <td>{sale.soldBy || '-'}</td>
                  <td>{Number(sale.total || 0).toFixed(2)}</td>
                  <td>{sale.createdAt ? new Date(sale.createdAt).toLocaleString() : '-'}</td>
                  <td>{sale.items?.length || 0}</td>
                  <td>
                    <button className="btn-outline !px-2 !py-1" onClick={() => setSelectedBill(sale)}>
                      Bill
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card overflow-x-auto">
        <div className="mb-4">
          <h3 className="font-semibold">Medicines bought from suppliers</h3>
          <p className="text-sm muted-text">All supplier purchases that were added to inventory.</p>
        </div>
        {loading ? (
          <p className="muted-text">Loading purchases...</p>
        ) : purchases.length === 0 ? (
          <p className="muted-text">No supplier purchases recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase muted-text">
              <tr><th className="py-2">Medicine</th><th>Batch</th><th>Supplier</th><th>Quantity</th><th>Total cost</th><th>Purchase date</th></tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="border-t">
                  <td className="py-2 font-medium">{purchase.medicine?.name || '-'}</td>
                  <td>{purchase.medicine?.batchNumber || '-'}</td>
                  <td>{purchase.supplier?.name || '-'}</td>
                  <td>{purchase.quantity}</td>
                  <td>Rs {Number(purchase.totalCost || 0).toFixed(2)}</td>
                  <td>{purchase.purchaseDate ? new Date(`${purchase.purchaseDate}T00:00:00`).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedBill(null)} />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-[rgba(8,25,23,0.98)] p-6 shadow-2xl shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Bill #{selectedBill.saleId}</h3>
              <button type="button" className="btn-outline !px-3 !py-1.5" onClick={() => setSelectedBill(null)}>Close</button>
            </div>

            <div className="space-y-2 text-sm text-[var(--text-muted)]">
              <div>Created: {selectedBill.createdAt ? new Date(selectedBill.createdAt).toLocaleString() : '-'}</div>
              <div>Customer: {selectedBill.customerName || '-'} {selectedBill.customerPhone && `• ${selectedBill.customerPhone}`}</div>
              <div>Sold By: {selectedBill.soldBy || '-'}</div>
            </div>

            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-xs uppercase muted-text"><tr><th>Name</th><th>Qty</th><th>Unit</th><th>Line</th></tr></thead>
              <tbody>
                {(selectedBill.items || []).map((item, index) => (
                  <tr key={index} className="border-t">
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unitPrice}</td>
                    <td>{item.lineTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-5 flex items-center justify-between">
              <div className="text-lg font-semibold text-white">Total: {Number(selectedBill.total || 0).toFixed(2)}</div>
              <div className="flex gap-2">
                <button type="button" className="btn-outline" onClick={() => setSelectedBill(null)}>Done</button>
                <button type="button" className="btn-primary" onClick={() => downloadBill(selectedBill.saleId)}>Download PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
