import { render, screen } from '@testing-library/react'
import StockBadge from '../components/StockBadge'

// React Testing Library example test
test('shows Low stock when quantity is below threshold', () => {
  render(<StockBadge medicine={{ quantity: 5, lowStockThreshold: 10, expiryDate: '2099-01-01' }} />)
  expect(screen.getByText('Low stock')).toBeTruthy()
})

test('shows Expired for a past expiry date', () => {
  render(<StockBadge medicine={{ quantity: 5, lowStockThreshold: 10, expiryDate: '2000-01-01' }} />)
  expect(screen.getByText('Expired')).toBeTruthy()
})
