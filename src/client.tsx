import React from 'react'
import ReactDOM from 'react-dom/client'
import { StartClient } from '@tanstack/react-start'
import './styles.css'

const rootEl = document.getElementById('root')
if (rootEl) {
  if (rootEl.innerHTML.trim()) {
    ReactDOM.hydrateRoot(
      rootEl,
      <React.StrictMode>
        <StartClient />
      </React.StrictMode>,
    )
  } else {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <StartClient />
      </React.StrictMode>,
    )
  }
}
