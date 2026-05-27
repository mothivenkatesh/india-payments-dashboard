// CommonJS config — required because "type": "module" in package.json
// makes .js files ESM, but Tailwind's jiti loader works best with CJS.
// We use .cjs so require() is available and extensionless imports resolve.

const plugin = require('tailwindcss/plugin')
const fs = require('fs')
const path = require('path')

// ── Load color tokens from local copy (no frappe-ui package needed) ────────
const colorsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/styles/frappe-colors.json'), 'utf8'))

// ── Resolve a themedVariable reference like "darkMode/gray/50" → hex ──────
function resolveColor(ref) {
  if (!ref) return null
  const parts = ref.split('/')
  const [mode, color, shade] = parts
  if (mode === 'lightMode') return colorsData.lightMode[color]?.[shade] ?? null
  if (mode === 'darkMode')  return colorsData.darkMode[color]?.[shade] ?? null
  if (mode === 'neutral')   return colorsData.neutral[color] ?? null
  if (mode === 'overlay')   return colorsData.overlay[color]?.[shade] ?? null
  return null
}

// ── Generate :root and [data-theme="dark"] CSS variable objects ───────────
function generateCSSVariables() {
  const root = {}
  const dark = {}
  const tv = colorsData.themedVariables

  for (const category of Object.keys(tv.light)) {
    for (const name of Object.keys(tv.light[category])) {
      root[`--${category}-${name}`] = resolveColor(tv.light[category][name])
    }
  }
  for (const category of Object.keys(tv.dark)) {
    for (const name of Object.keys(tv.dark[category])) {
      dark[`--${category}-${name}`] = resolveColor(tv.dark[category][name])
    }
  }

  // Raw color shades as CSS vars (--gray-50, --dark-gray-50, etc.)
  for (const [color, shades] of Object.entries(colorsData.lightMode)) {
    for (const [shade, val] of Object.entries(shades)) {
      root[`--${color}-${shade}`] = val
    }
  }
  for (const [color, shades] of Object.entries(colorsData.darkMode)) {
    for (const [shade, val] of Object.entries(shades)) {
      dark[`--dark-${color}-${shade}`] = val
    }
  }

  return { ':root': root, '[data-theme="dark"]': dark }
}

// ── Generate semantic color map for Tailwind extend ───────────────────────
function generateSemanticColors() {
  const out = { outline: {}, surface: {}, ink: {} }
  const tv = colorsData.themedVariables
  for (const category of Object.keys(tv.light)) {
    for (const name of Object.keys(tv.light[category])) {
      const fallback = resolveColor(tv.light[category][name])
      out[category][name] = `var(--${category}-${name}, ${fallback})`
    }
  }
  return out
}

// ── Generate full color palette ───────────────────────────────────────────
function generateColorPalette() {
  const pal = {
    inherit: 'inherit', current: 'currentColor', transparent: 'transparent',
    black: '#000000', white: '#FFFFFF',
  }
  for (const [color, shades] of Object.entries(colorsData.lightMode)) {
    pal[color] = { ...shades }
  }
  for (const [color, shades] of Object.entries(colorsData.darkMode)) {
    pal[`dark-${color}`] = { ...shades }
  }
  pal['white-overlay'] = { ...colorsData.overlay.white }
  pal['black-overlay'] = { ...colorsData.overlay.black }
  return pal
}

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

// ── Main Frappe theme plugin ──────────────────────────────────────────────
const cssVariables = generateCSSVariables()
const semanticColors = generateSemanticColors()

const frappePlugin = plugin(
  function ({ addBase, theme }) {
    addBase({
      html: {
        'font-family': `'Bricolage Grotesque Variable', 'Bricolage Grotesque', ${theme('fontFamily.sans')}`,
        'font-optical-sizing': 'auto',
      },
      'html, body, button, p, span, div': {
        'font-variation-settings': "'opsz' 14, 'wdth' 100",
        '-webkit-font-smoothing': 'antialiased',
        '-moz-osx-font-smoothing': 'grayscale',
      },
      ...cssVariables,
    })
  },
  {
    theme: {
      colors: generateColorPalette(),
      borderRadius: {
        none: '0px', sm: '0.25rem', DEFAULT: '0.5rem',
        md: '0.625rem', lg: '0.75rem', xl: '1rem',
        '2xl': '1.25rem', full: '9999px',
      },
      boxShadow: {
        sm: '0px 1px 2px rgba(0,0,0,0.1)',
        DEFAULT: '0px 0px 1px rgba(0,0,0,0.45), 0px 1px 2px rgba(0,0,0,0.1)',
        md: '0px 0px 1px rgba(0,0,0,0.12), 0px 0.5px 2px rgba(0,0,0,0.15), 0px 2px 3px rgba(0,0,0,0.16)',
        lg: '0px 0px 1px rgba(0,0,0,0.35), 0px 6px 8px -4px rgba(0,0,0,0.1)',
        xl: '0px 0px 1px rgba(0,0,0,0.19), 0px 1px 2px rgba(0,0,0,0.07), 0px 6px 15px -5px rgba(0,0,0,0.11)',
        '2xl': '0px 0px 1px rgba(0,0,0,0.2), 0px 1px 3px rgba(0,0,0,0.05), 0px 10px 24px -3px rgba(0,0,0,0.1)',
        none: 'none',
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.15', letterSpacing: '0.01em', fontWeight: '420' }],
        xs:    ['12px', { lineHeight: '1.15', letterSpacing: '0.02em', fontWeight: '420' }],
        sm:    ['13px', { lineHeight: '1.15', letterSpacing: '0.02em', fontWeight: '420' }],
        base:  ['14px', { lineHeight: '1.15', letterSpacing: '0.02em', fontWeight: '420' }],
        lg:    ['16px', { lineHeight: '1.15', letterSpacing: '0.02em', fontWeight: '400' }],
        xl:    ['18px', { lineHeight: '1.15', letterSpacing: '0.01em', fontWeight: '400' }],
        '2xl': ['20px', { lineHeight: '1.15', letterSpacing: '0.01em', fontWeight: '400' }],
        '3xl': ['24px', { lineHeight: '1.15', letterSpacing: '0.005em', fontWeight: '400' }],
      },
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
      extend: {
        textColor: { ink: semanticColors.ink },
        backgroundColor: { surface: semanticColors.surface },
        borderColor: () => ({
          DEFAULT: 'var(--outline-gray-1)',
          outline: semanticColors.outline,
        }),
        fill:   { ink: semanticColors.ink, surface: semanticColors.surface },
        stroke: { ink: semanticColors.ink },
        placeholderColor: { ink: semanticColors.ink },
        ringColor: { outline: semanticColors.outline },
        spacing: {
          4.5: '1.125rem', 5.5: '1.375rem', 6.5: '1.625rem',
          7.5: '1.875rem', 8.5: '2.125rem', 9.5: '2.375rem',
        },
      },
    },
  },
)

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
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
  ],
  safelist: USED_ICONS.map(name => `lucide-${name}`),
  darkMode: ['selector', '[data-theme="dark"]'],
  plugins: [frappePlugin, lucidePlugin],
}
