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
  const { firstVisit, markSeen } = useFirstVisit()

  // Auto-open the tour for first-time visitors
  useEffect(() => {
    if (firstVisit) setTourOpen(true)
  }, [firstVisit])

  const closeTour = () => { setTourOpen(false); markSeen() }

  return (
    <div class="flex h-screen bg-surface-white overflow-hidden">
      <NavBar
        onFeedbackClick={() => setFeedbackOpen(true)}
        onTourClick={() => setTourOpen(true)}
      />
      <main class="flex-1 overflow-y-auto p-6">
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
