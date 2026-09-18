import { Link } from 'react-router-dom'

export default function Landing() {
  const modules = [
    {
      title: 'Secure access',
      description: 'JWT authentication, role-based permissions, and password recovery for admins, pharmacists, and staff.',
      accent: 'Authentication & roles',
    },
    {
      title: 'Medicine inventory',
      description: 'Add, update, search, and manage stock across categories, batches, and suppliers with full history.',
      accent: 'Inventory control',
    },
    {
      title: 'Supplier management',
      description: 'Track supplier details, contact information, purchases, and performance in one place.',
      accent: 'Supplier workflow',
    },
    {
      title: 'Expiry & alerts',
      description: 'Monitor near-expiry and expired products with low-stock and stock movement notifications.',
      accent: 'Risk prevention',
    },
    {
      title: 'Dashboard analytics',
      description: 'Visualize stock health, purchase summaries, and inventory insights for quick decision-making.',
      accent: 'Analytics',
    },
    {
      title: 'Reports & exports',
      description: 'Generate purchase, expiry, and inventory reports for PDF or Excel export.',
      accent: 'Reporting',
    },
  ]

  const stats = [
    { label: 'Real-time stock updates', value: '24/7' },
    { label: 'Expiry monitoring', value: 'Instant' },
    { label: 'Inventory visibility', value: 'Full' },
  ]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#f6faf8,_#d8e4e1_72%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <header className="flex items-center justify-between rounded-full border border-white/10 px-4 py-3 backdrop-blur navbar-surface sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)] text-white shadow-sm" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold">MediStock</p>
              <p className="text-xs muted-text">Medical inventory management platform</p>
            </div>
          </div>
          <Link
            to="/login"
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0f8056]"
          >
            Sign in
          </Link>
        </header>

        <main className="space-y-10">
          <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.1)] px-3 py-1 text-sm text-[var(--accent)]">
                Full-stack inventory management for pharmacies and hospitals
              </div>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Keep medicine stock, suppliers, and expiry data in one smart workspace.
              </h1>
              <p className="mt-5 max-w-xl text-lg muted-text sm:text-xl">
                MediStock helps teams manage inventory, prevent shortages, and act on expiring stock with clear dashboards and alerts.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="rounded-2xl bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:bg-[#0f8056]"
                >
                  Get started
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[rgba(8,25,23,0.75)] p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="grid gap-3 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(8,25,23,0.55)] p-4 text-center">
                    <p className="text-2xl font-semibold text-[var(--accent)]">{stat.value}</p>
                    <p className="mt-1 text-sm muted-text">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="mb-6 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Platform modules</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Everything needed for modern inventory operations</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => (
                <div key={module.title} className="rounded-3xl border border-white/10 bg-[rgba(8,25,23,0.75)] p-6 shadow-lg shadow-black/20">
                  <p className="text-sm font-medium text-[var(--accent)]">{module.accent}</p>
                  <h3 className="mt-3 text-xl font-semibold text-white">{module.title}</h3>
                  <p className="mt-2 text-sm leading-6 muted-text">{module.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.1)] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Built for</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Pharmacies, hospitals, and healthcare teams</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 bg-[rgba(8,25,23,0.3)] px-3 py-2 text-sm text-[var(--text-main)]">Admin</span>
                <span className="rounded-full border border-white/10 bg-[rgba(8,25,23,0.3)] px-3 py-2 text-sm text-[var(--text-main)]">Pharmacist</span>
                <span className="rounded-full border border-white/10 bg-[rgba(8,25,23,0.3)] px-3 py-2 text-sm text-[var(--text-main)]">Staff</span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
