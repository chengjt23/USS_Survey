import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Auth from './pages/Auth'
import Confirm from './pages/Confirm'
import Home from './pages/Home'
import Survey1 from './pages/Survey1'
import Survey2 from './pages/Survey2'
import Survey3 from './pages/Survey3'

function PrivateRoute({ children }) {
  const name = sessionStorage.getItem('user_name')
  const email = sessionStorage.getItem('user_email')
  const studentId = sessionStorage.getItem('user_student_id')
  const gender = sessionStorage.getItem('user_gender')
  const age = sessionStorage.getItem('user_age')

  if (!name || !email || !studentId || !gender || !age) {
    return <Navigate to="/auth" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/confirm" element={<PrivateRoute><Confirm /></PrivateRoute>} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/survey1" element={<PrivateRoute><Survey1 /></PrivateRoute>} />
        <Route path="/survey2" element={<PrivateRoute><Survey2 /></PrivateRoute>} />
        <Route path="/survey3" element={<PrivateRoute><Survey3 /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
