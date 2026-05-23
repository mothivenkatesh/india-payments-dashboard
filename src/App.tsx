/** @jsxImportSource preact */
import { Switch, Route } from 'wouter-preact'
import NavBar from './components/NavBar'
import Pulse from './pages/pulse/Pulse'
import MarketHealth from './pages/ecosystem/MarketHealth'
import Growth from './pages/ecosystem/Growth'
import Players from './pages/ecosystem/Players'
import RailWar from './pages/insights/RailWar'
import MyRail from './pages/myrail/MyRail'

export default function App() {
  return (
    <div class="flex h-screen bg-surface-white overflow-hidden">
      <NavBar />
      <main class="flex-1 overflow-y-auto p-6">
        <Switch>
          <Route path="/"         component={Pulse}        />
          <Route path="/market"   component={MarketHealth} />
          <Route path="/growth"   component={Growth}       />
          <Route path="/players"  component={Players}      />
          <Route path="/insights" component={RailWar}      />
          <Route path="/myrail"   component={MyRail}       />
        </Switch>
      </main>
    </div>
  )
}
