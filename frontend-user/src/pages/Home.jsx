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
      localStorage.removeItem('survey1_progress')
      localStorage.removeItem('survey2_progress')
      localStorage.removeItem('survey3_progress')
      navigate('/auth')
    })
  }

  const handleDeleteAccount = () => {
    if (!window.confirm('确定要注销账户吗？此操作将永久删除您的账户和所有数据，且无法恢复！')) {
      return
    }
    
    if (!window.confirm('再次确认：注销账户后，您的所有问卷数据将被永久删除，此操作不可撤销！')) {
      return
    }
    
    axios.post('/api/auth/delete-account').then(() => {
      localStorage.removeItem('survey1_progress')
      localStorage.removeItem('survey2_progress')
      localStorage.removeItem('survey3_progress')
      alert('账户已成功注销')
      navigate('/auth')
    }).catch(err => {
      alert(err.response?.data?.error || '注销失败')
    })
  }

  return (
    <div className="home">
      <div className="container">
        <div className="header-with-logout">
          <h1>问卷系统</h1>
          <div className="user-actions">
            <button onClick={handleLogout} className="logout-btn">退出登录</button>
            <button onClick={handleDeleteAccount} className="delete-account-btn">注销账户</button>
          </div>
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
