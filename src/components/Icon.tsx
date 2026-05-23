/** @jsxImportSource preact */

interface IconProps {
  name: string
  className?: string
  size?: number
}

export default function Icon({ name, className = '', size = 16 }: IconProps) {
  return (
    <span
      class={`lucide-${name} shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  )
}
