import * as React from 'react'
import { createRoot } from 'react-dom/client'
import './shared/i18n/config'
import './index.css'
import { App } from './app'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <App />
)
