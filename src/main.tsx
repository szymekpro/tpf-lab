import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UnitProvider } from './contexts/UnitContext.tsx'
import { GlycemiaTargetProvider } from './contexts/GlycemiaTargetContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UnitProvider>
      <GlycemiaTargetProvider>
        <App />
      </GlycemiaTargetProvider>
    </UnitProvider>
  </StrictMode>,
)
