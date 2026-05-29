// CommonJS config — required because "type": "module" in package.json
// makes .js files ESM, but Tailwind's jiti loader works best with CJS.
//
// Frappe Design System tokens (palette, semantic surface/outline/ink,
// font scale, breakpoints, shadows, radii) come from the shared preset
// at frappe-preact-ui/tailwind/preset. Everything below is project-
// specific: content paths, dynamic lucide-icon plugin, icon safelist.

const plugin = require('tailwindcss/plugin')
const fs = require('fs')
const path = require('path')
const frappePreactUI = require('frappe-preact-ui/tailwind/preset')

// ── Lucide icon plugin (reads from local src/icons/ — no lucide-static pkg) ─
const ICONS_DIR = path.join(__dirname, 'src/icons')

const svgCache = new Map()
function getIconUri(name) {
  if (svgCache.has(name)) return svgCache.get(name)
  const fp = path.join(ICONS_DIR, `${name}.svg`)
  if (!fs.existsSync(fp)) { svgCache.set(name, null); return null }
  const svg = fs.readFileSync(fp, 'utf8')
    .replace(/stroke-width="[^"]+"/, 'stroke-width="1.5"')
    .replace(/\s+/g, ' ').trim()
  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  svgCache.set(name, uri)
  return uri
}

const lucideIconNames = fs.readdirSync(ICONS_DIR)
  .filter(f => f.endsWith('.svg'))
  .map(f => f.replace(/\.svg$/, ''))

const lucidePlugin = plugin(({ matchComponents }) => {
  const values = Object.fromEntries(lucideIconNames.map(n => [n, n]))
  matchComponents(
    {
      lucide: (value) => {
        const uri = getIconUri(value)
        if (!uri) return {}
        return {
          display: 'inline-block',
          width: '1em', height: '1em',
          color: 'var(--ink-gray-6)',
          'background-color': 'currentColor',
          '-webkit-mask-image': `url("${uri}")`,
          'mask-image': `url("${uri}")`,
          '-webkit-mask-repeat': 'no-repeat', 'mask-repeat': 'no-repeat',
          '-webkit-mask-position': 'center', 'mask-position': 'center',
          '-webkit-mask-size': 'contain', 'mask-size': 'contain',
          'flex-shrink': '0',
        }
      },
    },
    { values, type: 'any' },
  )
})

// ── Font-family base (project-specific — Geist) ───────────────────────────
const fontFamilyPlugin = plugin(({ addBase, theme }) => {
  addBase({
    html: {
      'font-family': `'Geist Variable', 'Geist', ${theme('fontFamily.sans')}`,
    },
    'html, body, button, p, span, div': {
      '-webkit-font-smoothing': 'antialiased',
      '-moz-osx-font-smoothing': 'grayscale',
    },
  })
})

// ── Icon safelist (dynamic lucide-${name} usage in Icon.tsx) ─────────────
const USED_ICONS = [
  'activity', 'alert-circle', 'arrow-left', 'award',
  'bar-chart', 'bar-chart-2', 'briefcase',
  'check', 'circle', 'credit-card',
  'dollar-sign', 'edit-2', 'external-link',
  'file-text', 'grid',
  'plus',
  'refresh-cw', 'repeat',
  'share-2', 'shopping-bag', 'shuffle', 'sliders',
  'trending-up',
  'user',
  'wifi',
  'zap',
]

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [frappePreactUI],
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
  ],
  safelist: USED_ICONS.map(name => `lucide-${name}`),
  plugins: [fontFamilyPlugin, lucidePlugin],
}
