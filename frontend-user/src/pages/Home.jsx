import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from '../axiosConfig'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const [completions, setCompletions] = useState({
    survey1: false,
    survey2: false,
    survey3: false
  })

  useEffect(() => {
    localStorage.removeItem('survey1_progress')
    localStorage.removeItem('survey2_progress')
    localStorage.removeItem('survey3_progress')
  }, [])

  useEffect(() => {
    const stored = sessionStorage.getItem('survey_completions')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setCompletions(prev => ({
          ...prev,
          ...parsed
        }))
      } catch {}
    }
  }, [])

  useEffect(() => {
    const studentId = sessionStorage.getItem('user_student_id')
    if (!studentId) {
      navigate('/auth')
      return
    }
    axios.get('/api/surveys/completions', {
      params: { student_id: studentId }
    }).then(res => {
      const status = {
        survey1: !!res.data?.survey1,
        survey2: !!res.data?.survey2,
        survey3: !!res.data?.survey3
      }
      setCompletions(status)
      sessionStorage.setItem('survey_completions', JSON.stringify(status))
    }).catch(() => {
      // ignore errors
    })
  }, [navigate])

  const surveys = [
    { id: 1, key: 'survey1', title: '问卷1：单事件音频判断', desc: '25个音频，每个音频判断是否只包含一个音频事件' },
    { id: 2, key: 'survey2', title: '问卷2：音频事件判断', desc: '25个音频，从标签池中选择对应的音频事件标签' },
    { id: 3, key: 'survey3', title: '问卷3：音频质量评判', desc: '25对音频，选择音质更好的音频' }
  ]

  const handleEnterSurvey = (surveyId, surveyKey) => {
    if (completions[surveyKey]) {
      return
    }
    navigate(`/survey${surveyId}`)
  }

  return (
    <div className="home">
      <div className="container">
        <h1>问卷系统</h1>
        <div className="surveys-grid">
          {surveys.map(survey => {
            const isCompleted = completions[survey.key]
            return (
              <div 
                key={survey.id} 
                className={`survey-card ${isCompleted ? 'disabled' : 'active'}`}
                onClick={() => handleEnterSurvey(survey.id, survey.key)}
              >
                <h2>{survey.title}</h2>
                <p>{survey.desc}</p>
                {isCompleted && <span className="completed-tag">已完成</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Home
