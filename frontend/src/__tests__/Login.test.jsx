import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Login from '../pages/Login'

const { mockLogin } = vi.hoisted(() => ({ mockLogin: vi.fn() }))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

test('shows a friendly error for invalid credentials returned by the API', async () => {
  mockLogin.mockRejectedValueOnce({
    response: {
      data: {
        error: 'Bad credentials',
      },
    },
  })

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )

  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

  expect(await screen.findByText('Bad credentials')).toBeTruthy()
})
