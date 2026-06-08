import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { UnitProvider } from './contexts/UnitContext.tsx'
import { GlycemiaTargetProvider } from './contexts/GlycemiaTargetContext.tsx'
import { ThemeProvider } from './contexts/ThemeProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <UnitProvider>
          <GlycemiaTargetProvider>
            <App />
          </GlycemiaTargetProvider>
        </UnitProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
