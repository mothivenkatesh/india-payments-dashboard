/** @jsxImportSource preact */

interface SparklineProps {
  data: number[]
  color: string
  width?: number
  height?: number
}

export default function Sparkline({ data, color, width = 80, height = 28 }: SparklineProps) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 2

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2)
    const y = pad + (1 - (v - min) / range) * (height - pad * 2)
    return [x, y] as [number, number]
  })

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${pts[pts.length-1][0].toFixed(1)},${height} L ${pts[0][0].toFixed(1)},${height} Z`

  // Parse hex color to rgb for gradient
  const hex = color.startsWith('#') ? color : '#3B82F6'
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  const gradId = `sg-${r}-${g}-${b}`

  const lastVal = pts[pts.length - 1]
  const trend = data[data.length - 1] > data[0]

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgba(${r},${g},${b},0.35)`} />
          <stop offset="100%" stopColor={`rgba(${r},${g},${b},0)`} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      <circle cx={lastVal[0]} cy={lastVal[1]} r="2.5" fill={trend ? '#10B981' : '#F87171'} />
    </svg>
  )
}
