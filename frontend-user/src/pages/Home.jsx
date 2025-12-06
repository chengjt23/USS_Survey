import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import axios from '../axiosConfig'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const [completions, setCompletions] = useState({
    survey1: false,
    survey2: false,
    survey3: false
  })
  const [showFinalModal, setShowFinalModal] = useState(false)
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    studentId: ''
  })
  const [finalError, setFinalError] = useState('')

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

  useEffect(() => {
    if (completions.survey1 && completions.survey2 && completions.survey3) {
      const name = sessionStorage.getItem('user_name') || ''
      const email = sessionStorage.getItem('user_email') || ''
      const studentId = sessionStorage.getItem('user_student_id') || ''
      setUserInfo({ name, email, studentId })
      setShowFinalModal(true)
    } else {
      setShowFinalModal(false)
    }
  }, [completions])

  const infoError = useMemo(() => {
    if (!userInfo.name || !userInfo.email || !userInfo.studentId) {
      return '请完整填写个人信息'
    }
    if (!userInfo.email.includes('@')) {
      return '邮箱格式不正确'
    }
    return ''
  }, [userInfo])

  const handleUserInfoChange = (field, value) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }))
    setFinalError('')
  }

  const handleFinalConfirm = () => {
    if (infoError) {
      setFinalError(infoError)
      return
    }
    setFinalError('')
    try {
      sessionStorage.setItem('pending_user_info', JSON.stringify(userInfo))
    } catch {}
    sessionStorage.removeItem('user_name')
    sessionStorage.removeItem('user_email')
    sessionStorage.removeItem('user_student_id')
    sessionStorage.removeItem('survey_completions')
    localStorage.removeItem('survey1_progress')
    localStorage.removeItem('survey2_progress')
    localStorage.removeItem('survey3_progress')
    setShowFinalModal(false)
    navigate('/auth')
  }

  return (
    <>
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
    {showFinalModal && (
      <div className="final-overlay">
        <div className="final-modal">
          <h2>感谢参与</h2>
          <p>你已完成全部问卷，请确认以下个人信息是否正确。</p>
          <div className="final-info">
              <label>
                <span>姓名：</span>
                <input
                  type="text"
                  value={userInfo.name}
                  onChange={(e) => handleUserInfoChange('name', e.target.value)}
                />
              </label>
              <label>
                <span>邮箱：</span>
                <input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => handleUserInfoChange('email', e.target.value)}
                />
              </label>
              <label>
                <span>学号：</span>
                <input
                  type="text"
                  value={userInfo.studentId}
                  onChange={(e) => handleUserInfoChange('studentId', e.target.value)}
                />
              </label>
          </div>
          <div className="final-actions">
            {finalError && <div className="final-error">{finalError}</div>}
            <button 
              className="final-btn" 
              onClick={handleFinalConfirm}
              disabled={!!infoError}
            >
              确认并退出
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default Home
