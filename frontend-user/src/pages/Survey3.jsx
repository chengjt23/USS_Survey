import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../axiosConfig'
import './Survey.css'

function Survey3() {
  const navigate = useNavigate()
  const audioRefs = useRef({})
  const STORAGE_KEY = 'survey3_progress'
  const [phase, setPhase] = useState('intro')
  const [accessGranted, setAccessGranted] = useState(false)
  const [items, setItems] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const updateCompletionStorage = (status) => {
    try {
      sessionStorage.setItem('survey_completions', JSON.stringify(status))
    } catch {}
  }

  const markSurveyCompleted = () => {
    try {
      const stored = sessionStorage.getItem('survey_completions')
      const status = stored ? JSON.parse(stored) : {}
      status.survey3 = true
      sessionStorage.setItem('survey_completions', JSON.stringify(status))
    } catch {}
  }

  const resetAudios = () => {
    const refs = audioRefs.current[currentIndex] || {}
    Object.values(refs).forEach(audio => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    })
  }

  const setAudioRef = (questionIndex, optionId, element) => {
    if (!audioRefs.current[questionIndex]) {
      audioRefs.current[questionIndex] = {}
    }
    audioRefs.current[questionIndex][optionId] = element
  }

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
      updateCompletionStorage(status)
      if (status.survey3) {
        navigate('/')
      } else {
        setAccessGranted(true)
      }
    }).catch(() => {
      setAccessGranted(true)
    })
  }, [navigate])

  useEffect(() => {
    if (!accessGranted) {
      return
    }
    axios.get('/api/surveys/3/items').then(res => {
      const fetchedItems = res.data.items || []
      setItems(fetchedItems)
      const savedProgress = localStorage.getItem(STORAGE_KEY)
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress)
          if (progress.currentIndex !== undefined && progress.answers) {
            setCurrentIndex(progress.currentIndex)
            setAnswers(progress.answers)
            if (progress.phase === 'test') {
              setPhase('test')
            }
          }
        } catch (e) {
          console.error('恢复进度失败:', e)
        }
      }
      setLoading(false)
    }).catch(() => {
      navigate('/')
    })
  }, [accessGranted, navigate])

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentIndex,
        answers,
        phase
      }))
    }
  }, [currentIndex, answers, items.length, phase])

  const handleBack = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentIndex,
      answers,
      phase
    }))
    navigate('/')
  }

  const startTest = () => {
    if (items.length === 0) {
      return
    }
    setPhase('test')
  }

  const handleAnswer = (answer) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: answer }))
  }

  const handleNext = () => {
    if (!answers[currentIndex]) {
      return
    }
    if (currentIndex < items.length - 1) {
      resetAudios()
      setCurrentIndex(currentIndex + 1)
    } else {
      submitSurvey(answers)
    }
  }

  const handlePrevious = () => {
    if (currentIndex === 0) {
      return
    }
    resetAudios()
    setCurrentIndex(currentIndex - 1)
  }

  const submitSurvey = (finalAnswers) => {
    if (submitting) {
      return
    }
    setSubmitting(true)
    const answerArray = Object.keys(finalAnswers).map(index => ({
      index: parseInt(index, 10),
      answer: finalAnswers[index]
    })).sort((a, b) => a.index - b.index)
    
    const name = sessionStorage.getItem('user_name')
    const email = sessionStorage.getItem('user_email')
    const studentId = sessionStorage.getItem('user_student_id')
    
    axios.post('/api/surveys/3/submit', {
      answers: answerArray,
      name: name,
      email: email,
      student_id: studentId
    }).then(() => {
      localStorage.removeItem(STORAGE_KEY)
      markSurveyCompleted()
      setPhase('completed')
      setTimeout(() => {
        navigate('/')
      }, 2000)
    }).catch(() => {
      setSubmitting(false)
      setErrorMessage('提交失败，请稍后再试。')
    })
  }

  const renderIntro = () => (
    <div className="intro-section">
      <h1>问卷三：音频对比测试</h1>
      <p>本问卷包含 25 道题，每题会给出一对音频，请认真聆听两个音频后，选择你认为音质更好的那一个。</p>
      <ul className="intro-list">
        <li>每道题仅可选择一个音频。</li>
      </ul>
      {loading ? (
        <div className="loading">题目加载中...</div>
      ) : (
        <div className="intro-actions">
          <button className="next-btn" onClick={startTest} disabled={items.length === 0}>
            开始测试
          </button>
        </div>
      )}
    </div>
  )

  const renderTestStage = () => {
    if (loading) {
      return <div className="loading">加载中...</div>
    }
    if (items.length === 0) {
      return <div className="loading">暂无题目</div>
    }
    const currentItem = items[currentIndex]
    const options = currentItem.options || []
    const isLast = currentIndex === items.length - 1
    const isFirst = currentIndex === 0
    const progressWidth = `${((currentIndex + 1) / items.length) * 100}%`
    return (
      <>
        <div className="progress-bar">
          <div className="progress" style={{ width: progressWidth }}></div>
        </div>
        <div className="question-info">
          题目 {currentIndex + 1} / {items.length}
        </div>
        <div className="pair-instruction">
          请先聆听两个音频，再选择你认为音质更好的那个。
        </div>
        <div className="pair-options">
          {options.map((option, idx) => (
            <div
              key={option.id}
              className={`pair-option ${answers[currentIndex] === option.id ? 'selected' : ''}`}
            >
              <div className="pair-label">音频 {idx + 1}</div>
              <audio
                ref={(el) => setAudioRef(currentIndex, option.id, el)}
                src={option.audio}
                controls
                className="pair-audio"
              />
              <button
                className="pair-select-btn"
                onClick={() => handleAnswer(option.id)}
              >
                选择此音频更好
              </button>
            </div>
          ))}
        </div>
        <div className="navigation-buttons">
          <button
            onClick={handlePrevious}
            className="previous-btn"
            disabled={isFirst}
          >
            上一题
          </button>
          <button
            onClick={handleNext}
            className="next-btn"
            disabled={!answers[currentIndex] || submitting}
          >
            {submitting ? '提交中...' : (isLast ? '提交' : '下一题')}
          </button>
        </div>
      </>
    )
  }

  const renderCompleted = () => (
    <div className="completion-message">
      感谢参与对比测试，结果已保存，页面即将跳转...
    </div>
  )

  return (
    <div className="survey-container">
      <button onClick={handleBack} className="back-survey-btn">返回主页</button>
      <div className="survey-content">
        {errorMessage && <div className="error-box">{errorMessage}</div>}
        {phase === 'intro' && renderIntro()}
        {phase === 'test' && renderTestStage()}
        {phase === 'completed' && renderCompleted()}
      </div>
    </div>
  )
}

export default Survey3
