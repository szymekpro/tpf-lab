import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UnitProvider } from './contexts/UnitContext.tsx'
import { GlycemiaTargetProvider } from './contexts/GlycemiaTargetContext.tsx'
import { ThemeProvider } from './contexts/ThemeProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <UnitProvider>
        <GlycemiaTargetProvider>
          <App />
        </GlycemiaTargetProvider>
      </UnitProvider>
    </ThemeProvider>
  </StrictMode>,
)
