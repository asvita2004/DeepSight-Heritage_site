import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Intro from './components/Intro'
import Home from './components/Home'
import Sidebar from './components/Sidebar'
import SidebarImageOverlay from './components/SidebarImageOverlay'
import CanvasCursorComponent from './components/CanvasCursorComponent'
import RightSidebar from './components/RightSidebar'
import LanguageDropdown from './components/LanguageDropdown'
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Intro />} />
      <Route path="/home" element={<Home />} />
      <Route path="/p3" element={<Sidebar />} />
      <Route path="/p4" element={<SidebarImageOverlay />} />
      <Route path="/p5" element={<CanvasCursorComponent />} />
      <Route path="/p6" element={<RightSidebar />} />
      <Route path="/p7" element={<LanguageDropdown/>} />
      {/* Add more routes as needed */}
    </Routes>
  )
}
