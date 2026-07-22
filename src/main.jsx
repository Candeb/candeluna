import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import SmoothScroll from './components/SmoothScroll.jsx'
import VideoScrollBackground from './components/VideoScrollBackground.jsx'
import CursorStars from './components/CursorStars.jsx'
import Home from './pages/Home.jsx'
import ServicePage from './pages/ServicePage.jsx'

function AppShell() {
  return (
    <>
      <VideoScrollBackground />
      <CursorStars />
      {/* El universo lunar permanece montado: el servicio se abre por encima */}
      <Home />
      <Routes>
        <Route path="/servicios/:slug" element={<ServicePage />} />
        <Route path="*" element={null} />
      </Routes>
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SmoothScroll>
        <AppShell />
      </SmoothScroll>
    </BrowserRouter>
  </StrictMode>,
)
