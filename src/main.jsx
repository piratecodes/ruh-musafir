import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from '@/App.jsx'
import '@/styles/App.css' // (Or global.css, whatever you named your theme file)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Global floating elements go here perfectly! */}
    <Toaster position="top-right" />
    <App />
  </StrictMode>,
)