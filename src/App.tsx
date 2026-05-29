/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks'
import { Switch, Route } from 'wouter-preact'
import NavBar from './components/NavBar'
import FeedbackModal from './components/FeedbackModal'
import WelcomeTour from './components/WelcomeTour'
import { useFirstVisit } from './hooks/useFirstVisit'
import Pulse from './pages/pulse/Pulse'
import MarketHealth from './pages/ecosystem/MarketHealth'
import Growth from './pages/ecosystem/Growth'
import Players from './pages/ecosystem/Players'
import RailWar from './pages/insights/RailWar'
import YearReview from './pages/year/YearReview'
import Data from './pages/data/Data'
import MyRail from './pages/myrail/MyRail'

export default function App() {
  const [isFeedbackOpen, setFeedbackOpen] = useState(false)
  const [isTourOpen, setTourOpen] = useState(false)
  const [isNavOpen, setNavOpen] = useState(false)
  const { firstVisit, markSeen } = useFirstVisit()

  // Auto-open the tour for first-time visitors
  useEffect(() => {
    if (firstVisit) setTourOpen(true)
  }, [firstVisit])

  // Close the mobile drawer on route changes (handled via window popstate)
  useEffect(() => {
    const onNav = () => setNavOpen(false)
    window.addEventListener('popstate', onNav)
    return () => window.removeEventListener('popstate', onNav)
  }, [])

  const closeTour = () => { setTourOpen(false); markSeen() }

  return (
    <div class="flex h-screen bg-surface-white overflow-hidden">
      {/* Mobile drawer backdrop */}
      {isNavOpen && (
        <div
          class="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}
      <NavBar
        onFeedbackClick={() => { setFeedbackOpen(true); setNavOpen(false) }}
        onTourClick={() => { setTourOpen(true); setNavOpen(false) }}
        mobileOpen={isNavOpen}
        onMobileNavigate={() => setNavOpen(false)}
      />
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 xl:p-10 2xl:p-12">
        {/* Mobile top bar — visible below lg */}
        <div class="lg:hidden flex items-center justify-between mb-4 -mt-1">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            class="flex items-center justify-center w-9 h-9 rounded-lg border border-outline-gray-2 bg-surface-white hover:bg-surface-gray-2 transition-colors cursor-pointer"
            aria-label="Open navigation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-md bg-surface-blue-1 border border-outline-blue-1 flex items-center justify-center">
              <span class="text-2xs font-bold text-ink-blue-2">IP</span>
            </span>
            <span class="text-xs font-semibold text-ink-gray-9">India Payments</span>
          </div>
          <span class="w-9" aria-hidden="true" />
        </div>
        <Switch>
          <Route path="/"         component={Pulse}        />
          <Route path="/market"   component={MarketHealth} />
          <Route path="/growth"   component={Growth}       />
          <Route path="/players"  component={Players}      />
          <Route path="/insights" component={RailWar}      />
          <Route path="/year"     component={YearReview}   />
          <Route path="/data"     component={Data}         />
          <Route path="/myrail"   component={MyRail}       />
        </Switch>
      </main>
      <FeedbackModal open={isFeedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <WelcomeTour open={isTourOpen} onClose={closeTour} />
    </div>
  )
}
