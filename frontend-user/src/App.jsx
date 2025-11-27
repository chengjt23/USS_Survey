import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from './axiosConfig'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Survey1 from './pages/Survey1'
import Survey2 from './pages/Survey2'
import Survey3 from './pages/Survey3'

function PrivateRoute({ children }) {
  const [authenticated, setAuthenticated] = useState(null)

  useEffect(() => {
    axios.get('/api/auth/check').then(res => {
      setAuthenticated(res.data.authenticated)
    }).catch(() => {
      setAuthenticated(false)
    })
  }, [])

  if (authenticated === null) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>加载中...</div>
  }

  return authenticated ? children : <Navigate to="/auth" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/survey1" element={<PrivateRoute><Survey1 /></PrivateRoute>} />
        <Route path="/survey2" element={<PrivateRoute><Survey2 /></PrivateRoute>} />
        <Route path="/survey3" element={<PrivateRoute><Survey3 /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
