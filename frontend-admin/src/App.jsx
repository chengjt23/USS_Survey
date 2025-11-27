import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import SurveyManage from './pages/SurveyManage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/manage/:surveyType" element={<SurveyManage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
