import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../axiosConfig'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const [status, setStatus] = useState({})
  const [completed, setCompleted] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get('/api/surveys/status'),
      axios.get('/api/surveys/completed')
    ]).then(([statusRes, completedRes]) => {
      setStatus(statusRes.data)
      setCompleted(completedRes.data.completed || [])
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  const surveys = [
    { id: 1, title: '问卷1：单事件音频判断', desc: '50个音频，每个音频判断是否只包含一个音频事件' },
    { id: 2, title: '问卷2：音频事件判断', desc: '50个音频，从标签池中选择对应的音频事件标签' },
    { id: 3, title: '问卷3：音频质量评判', desc: '100个音频，使用MOS分数评判音频质量' }
  ]

  const isSurveyActive = (surveyId) => {
    const surveyKey = `survey${surveyId}`
    if (loading || status[surveyKey] === undefined) {
      return true
    }
    return status[surveyKey] === true
  }

  const isCompleted = (surveyId) => {
    return completed.includes(surveyId)
  }

  const handleLogout = () => {
    axios.post('/api/auth/logout').then(() => {
      navigate('/auth')
    })
  }

  return (
    <div className="home">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>问卷系统</h1>
          <button onClick={handleLogout} className="logout-btn">退出登录</button>
        </div>
        <div className="surveys-grid">
          {surveys.map(survey => {
            const isActive = isSurveyActive(survey.id)
            const completed = isCompleted(survey.id)
            return (
              <div 
                key={survey.id} 
                className={`survey-card ${isActive && !completed ? 'active' : 'disabled'} ${completed ? 'completed' : ''}`}
                onClick={() => isActive && !completed && navigate(`/survey${survey.id}`)}
              >
                <h2>{survey.title}</h2>
                <p>{survey.desc}</p>
                {!loading && !isActive && <span className="status-badge">已暂停</span>}
                {completed && <span className="status-badge completed-badge">已填写</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Home
