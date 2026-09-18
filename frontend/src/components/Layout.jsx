import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

function NavIcon({ type }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  }

  const icons = {
    dashboard: (
      <svg {...common}><path d="M3 11.5V5.5A1.5 1.5 0 0 1 4.5 4H9l3 3h7.5A1.5 1.5 0 0 1 21 8.5v3M3 11.5h18M5 19h14a2 2 0 0 0 2-2v-5H3v5a2 2 0 0 0 2 2Z" /></svg>
    ),
    inventory: (
      <svg {...common}><path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5v-9Z" /><path d="M12 4v16M4 7.5l8 3.5 8-3.5" /></svg>
    ),
    sale: (
      <svg {...common}><path d="M8 5h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /><path d="M9 9h6M9 13h6M9 17h4" /></svg>
    ),
    suppliers: (
      <svg {...common}><path d="M5 18V7.5A1.5 1.5 0 0 1 6.5 6H17.5A1.5 1.5 0 0 1 19 7.5V18" /><path d="M9 10h6M9 14h6M7 18h10" /></svg>
    ),
    expiry: (
      <svg {...common}><path d="M12 7v5l3 2" /><path d="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" /></svg>
    ),
    reports: (
      <svg {...common}><path d="M6 19V9m6 10V5m6 14v-8" /><path d="M4 19h16" /></svg>
    ),
    history: (
      <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5M12 7v5l3.5 2" /></svg>
    ),
    notifications: (
      <svg {...common}><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
    ),
    users: (
      <svg {...common}><path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" /><circle cx="10" cy="7" r="3" /><path d="M20 19v-1a4 4 0 0 0-3-3.87" /><path d="M16 4.13a4 4 0 0 1 0 7.74" /></svg>
    ),
    profile: (
      <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M5 19a7 7 0 0 1 14 0" /></svg>
    ),
  }

  return icons[type] || icons.dashboard
}

function PharmacyLogo({ className = '' }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-md bg-[var(--accent)] text-white shadow-sm ${className}`} aria-hidden="true">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </span>
  )
}

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER'] },
  { to: '/inventory', label: 'Inventory', icon: 'inventory', roles: ['ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER'] },
  { to: '/sell', label: 'New Sale', icon: 'sale', roles: ['ADMIN', 'PHARMACIST', 'STAFF'] },
  { to: '/suppliers', label: 'Suppliers', icon: 'suppliers', roles: ['ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER'] },
  { to: '/expiry', label: 'Expiry Tracking', icon: 'expiry', roles: ['ADMIN', 'PHARMACIST', 'STAFF'] },
  { to: '/reports', label: 'Reports', icon: 'reports', roles: ['ADMIN', 'PHARMACIST'] },
  { to: '/sales-admin', label: 'Sale History', icon: 'history', roles: ['ADMIN'] },
  { to: '/notifications', label: 'Notifications', icon: 'notifications', roles: ['ADMIN', 'PHARMACIST', 'STAFF'] },
  { to: '/users', label: 'Users', icon: 'users', roles: ['ADMIN', 'PHARMACIST'] },
  { to: '/settings', label: 'Settings', icon: 'profile', roles: ['ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER'] },
]

/** Sidebar + top bar shared by every page. */
export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(204, 222, 217, 0.72), transparent 36%), linear-gradient(135deg, #e9f0ee 0%, #d5e1de 100%)' }}>
      <aside className="fixed top-0 left-0 bottom-0 z-50 w-64 border-r border-white/10 p-5 backdrop-blur overflow-auto sidebar-surface">
        <div className="mb-6 rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)] p-3">
          <div className="flex items-center gap-2">
            <PharmacyLogo className="h-7 w-7" />
            <h1 className="text-xl font-bold text-white">MediStock</h1>
          </div>
          <p className="mt-1 text-sm text-[#b9d0ca]">Inventory management</p>
        </div>
        <nav className="space-y-1">
          {links.filter((l) => l.roles.includes(user?.role)).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${isActive ? 'bg-[rgba(21,155,104,0.28)] text-white shadow-lg shadow-black/10' : 'text-[#b9d0ca] hover:bg-[rgba(255,255,255,0.10)] hover:text-white'}`
              }
            >
              <span className="flex h-4 w-4 items-center justify-center text-[var(--accent)]">
                <NavIcon type={l.icon} />
              </span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 ml-64">
        <header className="fixed top-0 left-64 right-0 z-40 flex items-center justify-between border-b border-white/10 px-6 py-3 backdrop-blur navbar-surface">
          <span className="text-sm muted-text">Medical Inventory Management Platform</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--text-main)]">{user?.fullName}</span>
            <span className="rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.15)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">{user?.role}</span>
            <button className="rounded-lg border border-[rgba(21,155,104,0.22)] bg-white px-3 py-2 text-sm text-[var(--text-main)] transition hover:border-[rgba(21,155,104,0.55)] hover:text-[var(--accent)]" onClick={() => { logout(); navigate('/login') }}>Logout</button>
          </div>
        </header>

        <motion.main
          className="p-6 pt-24"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  )
}
