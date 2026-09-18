/** Shows IN STOCK / LOW / OUT / EXPIRED for a medicine row. */
export default function StockBadge({ medicine }) {
  const expired = new Date(medicine.expiryDate) < new Date()
  if (expired) return <span className="badge stock-badge stock-badge-danger">Expired</span>
  if (medicine.quantity === 0) return <span className="badge stock-badge stock-badge-neutral">Out of stock</span>
  if (medicine.quantity <= medicine.lowStockThreshold)
    return <span className="badge stock-badge stock-badge-warning">Low stock</span>
  return <span className="badge stock-badge stock-badge-success">In stock</span>
}
