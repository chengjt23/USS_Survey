import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const [status, setStatus] = useState({})

  useEffect(() => {
    axios.get('/api/surveys/status').then(res => {
      setStatus(res.data)
    })
  }, [])

  const surveys = [
    { id: 1, title: '问卷1：单事件音频判断', desc: '50个音频，每个音频判断是否只包含一个音频事件' },
    { id: 2, title: '问卷2：音频事件判断', desc: '50个音频，从标签池中选择对应的音频事件标签' },
    { id: 3, title: '问卷3：音频质量评判', desc: '100个音频，使用MOS分数评判音频质量' }
  ]

  return (
    <div className="home">
      <div className="container">
        <h1>问卷系统</h1>
        <div className="surveys-grid">
          {surveys.map(survey => (
            <div 
              key={survey.id} 
              className={`survey-card ${status[`survey${survey.id}`] ? 'active' : 'disabled'}`}
              onClick={() => status[`survey${survey.id}`] && navigate(`/survey${survey.id}`)}
            >
              <h2>{survey.title}</h2>
              <p>{survey.desc}</p>
              {!status[`survey${survey.id}`] && <span className="status-badge">已暂停</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
