import { motion } from 'framer-motion'

/** Small metric tile used on the dashboards. */
export default function StatCard({ label, value, tone = 'teal', subtitle }) {
  const tones = {
    teal: 'text-[var(--accent)]',
    amber: 'text-amber-300',
    rose: 'text-rose-300',
    slate: 'text-[var(--text-main)]',
    emerald: 'text-[var(--text-link)]',
  }
  return (
    <motion.div
      className="card rounded-2xl border border-[rgba(18,56,47,0.08)] bg-[var(--card-bg)] p-5 shadow-lg shadow-[#15352e]/[0.08]"
      whileHover={{ y: -3, scale: 1.01 }}
    >
      <p className="text-xs uppercase tracking-[0.25em] muted-text">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${tones[tone]}`}>{value}</p>
      {subtitle && <p className="mt-2 text-sm muted-text">{subtitle}</p>}
    </motion.div>
  )
}
