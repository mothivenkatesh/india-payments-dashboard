import { render } from 'preact'
import { Router } from 'wouter-preact'
import App from './App'
import './index.css'

render(
  <Router>
    <App />
  </Router>,
  document.getElementById('root')!
)
