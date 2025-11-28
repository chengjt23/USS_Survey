import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../axiosConfig'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const name = localStorage.getItem('user_name')
    const email = localStorage.getItem('user_email')
    
    if (!name || !email) {
      navigate('/auth')
      return
    }
    
    setLoading(false)
  }, [navigate])

  const surveys = [
    { id: 1, title: '问卷1：单事件音频判断', desc: '50个音频，每个音频判断是否只包含一个音频事件' },
    { id: 2, title: '问卷2：音频事件判断', desc: '50个音频，从标签池中选择对应的音频事件标签' },
    { id: 3, title: '问卷3：音频质量评判', desc: '100个音频，使用MOS分数评判音频质量' }
  ]

  if (loading) {
    return <div className="home"><div className="container"><div className="loading">加载中...</div></div></div>
  }

  return (
    <div className="home">
      <div className="container">
        <h1>问卷系统</h1>
        <div className="surveys-grid">
          {surveys.map(survey => {
            return (
              <div 
                key={survey.id} 
                className="survey-card active"
                onClick={() => navigate(`/survey${survey.id}`)}
              >
                <h2>{survey.title}</h2>
                <p>{survey.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Home
