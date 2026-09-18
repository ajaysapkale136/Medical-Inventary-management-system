import { useEffect, useState } from 'react'
import { userApi } from '../api/services'

export default function Profile() {
  const [profile, setProfile] = useState({ fullName: '', phone: '', email: '', role: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [message, setMessage] = useState('')
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [settings, setSettings] = useState({
    darkMode: false,
    compactMode: false,
    emailAlerts: true,
    autoSave: true,
  })

  useEffect(() => {
    userApi.me().then(({ data }) => setProfile(data))

    const saved = localStorage.getItem('medistock-settings')
    if (saved) {
      try {
        setSettings((prev) => ({ ...prev, ...JSON.parse(saved) }))
      } catch (err) {
        console.error('Invalid saved settings', err)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('medistock-settings', JSON.stringify(settings))
    document.documentElement.dataset.theme = settings.darkMode ? 'dark' : 'light'
    document.body.classList.toggle('compact-mode', settings.compactMode)
  }, [settings])

  const saveProfile = async (e) => {
    e.preventDefault()
    await userApi.updateProfile({ fullName: profile.fullName, phone: profile.phone })
    setMessage('Profile updated')
  }

  const savePassword = async (e) => {
    e.preventDefault()
    try {
      await userApi.changePassword(passwords)
      setMessage('Password changed')
      setPasswords({ currentPassword: '', newPassword: '' })
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not change password')
    }
  }

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="w-full space-y-5">
      <h2 className="text-xl font-bold">Settings</h2>
      {message && <p className="text-sm text-[var(--accent)]">{message}</p>}

      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Settings</h3>
          <button type="button" className="btn-outline !px-3 !py-1.5" onClick={() => setShowPasswordDialog(true)}>
            Change password
          </button>
        </div>

        <div className="space-y-3">
          {[
            { key: 'darkMode', label: 'Dark mode', description: 'Switch between dark and light appearance' },
            { key: 'compactMode', label: 'Compact view', description: 'Reduce spacing for a denser layout' },
            { key: 'emailAlerts', label: 'Email alerts', description: 'Receive important medicine and stock notifications' },
            { key: 'autoSave', label: 'Auto-save profile', description: 'Automatically save profile changes while editing' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-3">
              <div>
                <div className="font-medium text-white">{item.label}</div>
                <div className="text-xs text-[var(--text-muted)]">{item.description}</div>
              </div>

              <button
                type="button"
                onClick={() => toggleSetting(item.key)}
                className={`toggle ${settings[item.key] ? 'on' : ''}`}
                aria-label={item.label}
              >
                <span className="toggle-thumb" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={saveProfile} className="card space-y-3">
        <div><label className="label">Full name</label>
          <input className="input" value={profile.fullName || ''}
                 onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} /></div>
        <div><label className="label">Phone</label>
          <input className="input" value={profile.phone || ''}
                 onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
        <p className="text-xs text-[var(--text-muted)]">Email: {profile.email} - Role: {profile.role}</p>
        <button className="btn-primary">Save profile</button>
      </form>

      {showPasswordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPasswordDialog(false)} />
          <form onSubmit={(e) => { savePassword(e); setShowPasswordDialog(false) }} className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[rgba(8,25,23,0.98)] p-6 shadow-2xl shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Change password</h3>
              <button type="button" className="btn-outline !px-3 !py-1.5" onClick={() => setShowPasswordDialog(false)}>Close</button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-3">
                <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Account</div>
                <div className="mt-1 font-medium text-white">{profile.fullName || 'User'}</div>
                <div className="text-sm text-[var(--text-muted)]">{profile.phone || 'Phone not added'}</div>
              </div>

              <div>
                <label className="label">Current password</label>
                <input className="input" type="password" value={passwords.currentPassword}
                       onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
              </div>
              <div>
                <label className="label">New password</label>
                <input className="input" type="password" minLength={6} value={passwords.newPassword}
                       onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setShowPasswordDialog(false)}>Cancel</button>
              <button className="btn-primary">Update password</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
