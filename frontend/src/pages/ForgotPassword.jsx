import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/services'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await authApi.forgotPassword(email)
      setMessage(data.message)
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.18),_rgba(8,25,23,0.95)_70%)] px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-[rgba(8,25,23,0.92)] p-8 shadow-2xl shadow-black/30">
        <h2 className="mb-4 text-lg font-bold text-white">Forgot password</h2>
        <label className="label">Your email</label>
        <input className="input mb-4" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button className="btn-primary w-full justify-center">Send reset link</button>
        {message && <p className="mt-3 break-all text-xs text-[var(--text-muted)]">{message}</p>}
        <Link to="/login" className="mt-4 block text-center text-xs accent-link">Back to login</Link>
      </form>
    </div>
  )
}
