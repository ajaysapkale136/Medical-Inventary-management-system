import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const savedSettings = localStorage.getItem('medistock-settings')
if (savedSettings) {
  try {
    const { darkMode, compactMode } = JSON.parse(savedSettings)
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    document.body.classList.toggle('compact-mode', Boolean(compactMode))
  } catch {
    document.documentElement.dataset.theme = 'light'
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
