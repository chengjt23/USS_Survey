import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Survey1 from './pages/Survey1'
import Survey2 from './pages/Survey2'
import Survey3 from './pages/Survey3'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Home />} />
        <Route path="/survey1" element={<Survey1 />} />
        <Route path="/survey2" element={<Survey2 />} />
        <Route path="/survey3" element={<Survey3 />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
