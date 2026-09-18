import { useEffect, useState } from 'react'
import { userApi } from '../api/services'
import { useAuth } from '../context/AuthContext'

/**
 * ROLE HIERARCHY IN THE UI:
 *  Admin      -> can create ADMIN, PHARMACIST, STAFF and SUPPLIER
 *  Pharmacist -> can create STAFF only
 */
export default function Users() {
  const { user } = useAuth()
  const allowedRoles = user.role === 'ADMIN' ? ['ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER'] : ['STAFF']

  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', role: allowedRoles[0] })
  const [error, setError] = useState('')

  const load = () => userApi.all().then(({ data }) => setUsers(data))
  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault(); setError('')
    try {
      await userApi.create(form)
      setForm({ fullName: '', email: '', password: '', phone: '', role: allowedRoles[0] })
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create user')
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold">User Management</h2>

      <form onSubmit={save} className="card grid gap-3 md:grid-cols-5">
        <h3 className="md:col-span-5 font-semibold">Add a new user</h3>
        {error && <p className="md:col-span-5 text-sm text-rose-600">{error}</p>}
        <div><label className="label">Full name</label>
          <input className="input" required value={form.fullName}
                 onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
        <div><label className="label">Email</label>
          <input className="input" type="email" required value={form.email}
                 onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><label className="label">Password</label>
          <input className="input" type="password" required minLength={6} value={form.password}
                 onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <div><label className="label">Role</label>
          <select className="input" value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {allowedRoles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select></div>
        <div className="flex items-end"><button className="btn-primary">Create user</button></div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase muted-text">
            <tr><th className="py-2">Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="py-2">{u.fullName}</td><td>{u.email}</td>
                <td><span className="badge bg-[rgba(52,211,153,0.12)] text-[var(--accent)]">{u.role}</span></td>
                <td>{u.active ? 'Active' : 'Disabled'}</td>
                <td className="space-x-1">
                  {user.role === 'ADMIN' && u.role !== 'ADMIN' && (
                    <>
                      <button className="btn-outline !px-2 !py-1"
                              onClick={() => userApi.toggleActive(u.id).then(load)}>Toggle</button>
                      <button className="btn-danger !px-2 !py-1"
                              onClick={() => userApi.remove(u.id).then(load)}>Del</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
