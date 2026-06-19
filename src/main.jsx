import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import SmoothScroll from './components/SmoothScroll.jsx'
import VideoScrollBackground from './components/VideoScrollBackground.jsx'
import CursorStars from './components/CursorStars.jsx'
import Home from './pages/Home.jsx'
import ServicePage from './pages/ServicePage.jsx'

function Shell({ children }) {
  return (
    <>
      <VideoScrollBackground />
      <CursorStars />
      {children}
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SmoothScroll>
        <Routes>
          <Route
            path="/"
            element={
              <Shell>
                <Home />
              </Shell>
            }
          />
          <Route
            path="/servicios/:slug"
            element={
              <Shell>
                <ServicePage />
              </Shell>
            }
          />
        </Routes>
      </SmoothScroll>
    </BrowserRouter>
  </StrictMode>,
)
