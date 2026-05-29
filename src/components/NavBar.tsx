/** @jsxImportSource preact */
import { Link, useLocation } from 'wouter-preact'
import Icon from './Icon'
import AppLogo from './AppLogo'
import { useMode } from '../hooks/useMode'
import clsx from 'clsx'

const NAV = [
  {
    section: 'Command',
    items: [
      { to: '/',          label: 'Overview',       icon: 'zap',           desc: 'What changed this month' },
      { to: '/myrail',    label: 'Your numbers',   icon: 'user',          desc: 'Your share vs market' },
    ],
  },
  {
    section: 'Ecosystem',
    items: [
      { to: '/market',    label: 'Market',         icon: 'share-2',       desc: 'State of payments' },
      { to: '/growth',    label: 'Growth',         icon: 'trending-up',   desc: 'Accelerating vs slowing' },
      { to: '/players',   label: 'Apps & Banks',   icon: 'bar-chart-2',   desc: 'Who is winning' },
    ],
  },
  {
    section: 'Insights',
    items: [
      { to: '/insights',  label: 'Rails',          icon: 'shuffle',       desc: 'UPI vs Cards at POS' },
      { to: '/year',      label: 'Year review',    icon: 'award',         desc: 'Annual retrospective' },
      { to: '/data',      label: 'Data',           icon: 'file-text',     desc: 'Browse + download' },
    ],
  },
]

interface NavBarProps {
  onFeedbackClick?: () => void
}

export default function NavBar({ onFeedbackClick }: NavBarProps = {}) {
  const [location] = useLocation()
  const [mode, setMode] = useMode()

  return (
    <aside class="w-52 flex-shrink-0 flex flex-col bg-surface-menu-bar border-r border-outline-gray-1 h-screen sticky top-0">
      {/* Logo */}
      <div class="px-4 py-5 border-b border-outline-gray-1">
        <div class="flex items-center gap-2.5">
          <span class="w-7 h-7 rounded-lg bg-surface-blue-1 border border-outline-blue-1 flex items-center justify-center">
            <Icon name="credit-card" size={15} className="text-ink-blue-2" />
          </span>
          <div>
            <div class="text-sm font-semibold text-ink-gray-9 leading-tight">India Payments</div>
            <div class="text-2xs text-ink-gray-5 tracking-wide">Terminal</div>
          </div>
        </div>
      </div>

      {/* Global Volume / Value toggle */}
      <div class="px-3 pt-3">
        <div class="text-2xs font-semibold uppercase tracking-widest text-ink-gray-5 px-2 mb-1.5">View</div>
        <div class="flex items-center gap-1 bg-surface-gray-1 border border-outline-gray-2 rounded-lg p-0.5">
          {(['vol', 'val'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              class={clsx(
                'flex-1 px-2 py-1 text-2xs font-medium rounded transition-colors cursor-pointer',
                mode === m
                  ? 'bg-surface-white text-ink-gray-9 shadow-sm border border-outline-gray-2'
                  : 'text-ink-gray-6 hover:text-ink-gray-8'
              )}
            >
              {m === 'vol' ? 'Volume' : 'Value'}
            </button>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div class="text-2xs font-semibold uppercase tracking-widest text-ink-gray-5 px-2 mb-1.5">
              {section}
            </div>
            <div class="space-y-0.5">
              {items.map(({ to, label, icon, desc }) => {
                const active = location === to
                return (
                  <Link
                    key={to}
                    href={to}
                    class={clsx(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded text-sm transition-colors duration-150 cursor-pointer',
                      active
                        ? 'bg-surface-blue-1 text-ink-gray-9'
                        : 'text-ink-gray-6 hover:text-ink-gray-8 hover:bg-surface-gray-2'
                    )}
                  >
                    <Icon
                      name={icon}
                      size={15}
                      className={active ? 'text-ink-blue-2' : ''}
                    />
                    <div class="min-w-0 flex-1">
                      <div class="leading-tight text-sm">{label}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div class="px-4 py-3 border-t border-outline-gray-1 space-y-2">
        <div class="space-y-1.5">
          <div class="flex items-center gap-1.5">
            <AppLogo name="RBI" size={14} rounded="sm" />
            <p class="text-2xs text-ink-gray-5">CKAN · RBI historical (all rails)</p>
          </div>
          <div class="flex items-center gap-1.5">
            <AppLogo name="NPCI" size={14} rounded="sm" />
            <p class="text-2xs text-ink-gray-5">NPCI · live UPI, NACH, BBPS (~15d)</p>
          </div>
        </div>
        {onFeedbackClick && (
          <button
            type="button"
            onClick={onFeedbackClick}
            class="flex items-center gap-1.5 text-2xs text-ink-gray-6 hover:text-ink-gray-9 transition-colors cursor-pointer"
          >
            <Icon name="edit-2" size={11} />
            <span class="underline underline-offset-2">Share feedback</span>
          </button>
        )}
        <p class="text-2xs text-ink-gray-4">Designed by <a href="https://www.linkedin.com/in/mothivenkatesh/" target="_blank" rel="noopener noreferrer" class="hover:text-ink-gray-6 underline underline-offset-2 transition-colors">Mothi</a></p>
      </div>
    </aside>
  )
}
