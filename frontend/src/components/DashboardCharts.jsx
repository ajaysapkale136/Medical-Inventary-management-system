const palette = ['#159b68', '#6abf9d', '#e5a72f', '#dd6b62', '#6687b8']

export function DonutChart({ items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const radius = 48
  const circumference = 2 * Math.PI * radius
  let offset = 0

  if (!total) {
    return (
      <div className="flex h-32 w-32 items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(12,38,36,0.7)] text-sm text-[var(--text-muted)]">
        No data
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <svg viewBox="0 0 140 140" className="h-32 w-32 -rotate-90">
        <circle cx="70" cy="70" r={radius} stroke="#1e293b" strokeWidth="18" fill="none" />
        {items.map((item, index) => {
          const length = (item.value / total) * circumference
          const circle = (
            <circle
              key={item.label}
              cx="70"
              cy="70"
              r={radius}
              stroke={item.color || palette[index % palette.length]}
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${length} ${circumference}`}
              strokeDashoffset={-offset}
            />
          )
          offset += length
          return circle
        })}
      </svg>
      <ul className="space-y-2 text-sm text-[var(--text-muted)]">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color || palette[index % palette.length] }} />
              {item.label}
            </span>
            <span className="font-semibold text-white">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BarChart({ items }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm muted-text">
            <span>{item.label}</span>
            <span className="font-semibold text-white">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${Math.max(10, (item.value / maxValue) * 100)}%`,
                background: item.color || palette[index % palette.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function LineChart({ items, color = '#159b68' }) {
  if (!items || items.length === 0) {
    return <div className="flex h-48 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.08)] text-sm text-[var(--text-muted)]">No trend data</div>
  }

  const width = 420
  const height = 180
  const maxValue = Math.max(...items.map((item) => item.value), 1)
  const minValue = Math.min(...items.map((item) => item.value), 0)
  const range = maxValue - minValue || 1

  const points = items.map((item, index) => {
    const x = (index / (items.length - 1)) * width
    const y = height - ((item.value - minValue) / range) * (height - 20) - 10
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(8,25,23,0.7)] p-2">
        {[0, 1, 2, 3].map((step) => {
          const y = 10 + (step / 3) * (height - 20)
          return <line key={step} x1="0" y1={y} x2={width} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
        })}
        <polyline fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={points} />
        {items.map((item, index) => {
          const x = (index / (items.length - 1)) * width
          const y = height - ((item.value - minValue) / range) * (height - 20) - 10
          return (
            <g key={item.label}>
              <circle cx={x} cy={y} r="4" fill={color} />
              <text x={x} y={height - 2} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.7)">{item.label}</text>
            </g>
          )
        })}
      </svg>
      <div className="flex justify-between text-xs text-[var(--text-muted)]">
        {items.map((item) => (
          <span key={item.label}>{item.label}</span>
        ))}
      </div>
    </div>
  )
}
