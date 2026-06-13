/** @jsxImportSource preact */

// Phosphor regular - One UI suite canonical icon set (matches Agentic + GTMstack).
// The regular stylesheet is loaded in index.html. Legacy Lucide names map to their
// Phosphor equivalent so existing call sites keep working.
const PH: Record<string, string> = {
  activity: 'pulse',
  'alert-circle': 'warning-circle',
  'arrow-left': 'arrow-left',
  award: 'medal',
  'bar-chart': 'chart-bar',
  'bar-chart-2': 'chart-bar',
  briefcase: 'briefcase',
  check: 'check',
  circle: 'circle',
  'credit-card': 'credit-card',
  'dollar-sign': 'currency-dollar',
  'edit-2': 'pencil-simple',
  'external-link': 'arrow-square-out',
  'file-text': 'file-text',
  grid: 'squares-four',
  plus: 'plus',
  'refresh-cw': 'arrows-clockwise',
  repeat: 'repeat',
  'share-2': 'share-network',
  'shopping-bag': 'shopping-bag',
  shuffle: 'shuffle',
  sliders: 'sliders-horizontal',
  'trending-up': 'trend-up',
  user: 'user',
  wifi: 'wifi-high',
  zap: 'lightning',
}

interface IconProps {
  name: string
  className?: string
  size?: number
}

export default function Icon({ name, className = '', size = 16 }: IconProps) {
  const glyph = PH[name] || name
  return (
    <i
      class={`ph ph-${glyph} shrink-0 ${className}`}
      aria-hidden="true"
      /* one-ui-allow: icon glyph sized from the size prop */
      style={{ fontSize: `${size}px`, lineHeight: 1 }}
    />
  )
}
