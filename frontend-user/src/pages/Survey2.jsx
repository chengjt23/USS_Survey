import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../axiosConfig'
import './Survey.css'

function Survey2() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const audioRef = useRef(null)
  const STORAGE_KEY = 'survey2_progress'

  useEffect(() => {
    axios.get('/api/surveys/2/items').then(res => {
      if (res.data.has_completed) {
        localStorage.removeItem(STORAGE_KEY)
        navigate('/')
        return
      }
      setItems(res.data.items)
      
      const savedProgress = localStorage.getItem(STORAGE_KEY)
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress)
          if (progress.currentIndex !== undefined && progress.answers) {
            setCurrentIndex(progress.currentIndex)
            setAnswers(progress.answers)
          }
        } catch (e) {
          console.error('恢复进度失败:', e)
        }
      }
      
      setLoading(false)
    }).catch(() => {
      navigate('/')
    })
  }, [navigate])

  useEffect(() => {
    if (items.length > 0 && Object.keys(answers).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentIndex,
        answers
      }))
    }
  }, [currentIndex, answers, items.length])

  const handleAnswer = (answer) => {
    const newAnswers = { ...answers, [currentIndex]: answer }
    setAnswers(newAnswers)
    
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    } else {
      submitSurvey(newAnswers)
    }
  }

  const handleBack = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentIndex,
      answers
    }))
    navigate('/')
  }

  const submitSurvey = (finalAnswers) => {
    const answerArray = Object.keys(finalAnswers).map(index => ({
      index: parseInt(index),
      answer: finalAnswers[index]
    }))
    
    axios.post('/api/surveys/2/submit', {
      answers: answerArray
    }).then(() => {
      localStorage.removeItem(STORAGE_KEY)
      setTimeout(() => {
        navigate('/')
      }, 2000)
    })
  }

  if (loading) {
    return <div className="survey-container"><div className="loading">加载中...</div></div>
  }

  if (items.length === 0) {
    return <div className="survey-container"><div className="loading">暂无题目</div></div>
  }

  const currentItem = items[currentIndex]
  const isLast = currentIndex === items.length - 1
  const tags = currentItem.tags || []

  return (
    <div className="survey-container">
      <button onClick={handleBack} className="back-survey-btn">返回主页</button>
      <div className="survey-content">
        <div className="progress-bar">
          <div className="progress" style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}></div>
        </div>
        <div className="question-info">
          题目 {currentIndex + 1} / {items.length}
        </div>
        
        <div className="audio-section">
          <h2>请听音频，从标签池中选择对应的音频事件</h2>
          <audio 
            ref={audioRef}
            src={currentItem.audio} 
            controls 
            className="audio-player"
          />
        </div>

        <div className="tags-section">
          <div className="tags-grid">
            {tags.map((tag, idx) => (
              <button
                key={idx}
                className={`tag-btn ${answers[currentIndex] === tag ? 'selected' : ''}`}
                onClick={() => handleAnswer(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {isLast && answers[currentIndex] && (
          <div className="completion-message">
            问卷已完成！正在提交...
          </div>
        )}
      </div>
    </div>
  )
}

export default Survey2
