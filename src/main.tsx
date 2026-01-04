import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Let CSS differentiate popup vs tab mode (bigger UI in tab mode).
try {
  const mode = new URLSearchParams(window.location.search).get('mode') === 'tab' ? 'tab' : 'popup'
  document.documentElement.dataset.mode = mode
} catch {
  document.documentElement.dataset.mode = 'popup'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
