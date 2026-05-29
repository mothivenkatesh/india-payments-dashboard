/** @jsxImportSource preact */
import { useState } from 'preact/hooks'
import { Switch, Route } from 'wouter-preact'
import NavBar from './components/NavBar'
import FeedbackModal from './components/FeedbackModal'
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
  return (
    <div class="flex h-screen bg-surface-white overflow-hidden">
      <NavBar onFeedbackClick={() => setFeedbackOpen(true)} />
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
    </div>
  )
}
