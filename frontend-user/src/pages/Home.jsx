import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import './Home.css'

function Home() {
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.removeItem('survey1_progress')
    localStorage.removeItem('survey2_progress')
    localStorage.removeItem('survey3_progress')
  }, [])

  const surveys = [
    { id: 1, title: '问卷1：单事件音频判断', desc: '25个音频，每个音频判断是否只包含一个音频事件' },
    { id: 2, title: '问卷2：音频事件判断', desc: '25个音频，从标签池中选择对应的音频事件标签' },
    { id: 3, title: '问卷3：音频质量评判', desc: '25对音频，选择音质更好的音频' }
  ]

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
