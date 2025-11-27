import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Survey.css'

function Survey1() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const audioRef = useRef(null)

  useEffect(() => {
    axios.get('/api/surveys/1/items').then(res => {
      setItems(res.data.items)
      setLoading(false)
    }).catch(() => {
      navigate('/')
    })
  }, [navigate])

  const handleAnswer = (answer) => {
    const newAnswers = { ...answers, [currentIndex]: answer }
    setAnswers(newAnswers)
    
    if (currentIndex < items.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1)
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        }
      }, 300)
    } else {
      submitSurvey(newAnswers)
    }
  }

  const submitSurvey = (finalAnswers) => {
    const answerArray = Object.keys(finalAnswers).map(index => ({
      index: parseInt(index),
      answer: finalAnswers[index]
    }))
    
    axios.post('/api/surveys/1/submit', {
      answers: answerArray
    }).then(() => {
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

  return (
    <div className="survey-container">
      <div className="survey-content">
        <div className="progress-bar">
          <div className="progress" style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}></div>
        </div>
        <div className="question-info">
          题目 {currentIndex + 1} / {items.length}
        </div>
        
        <div className="audio-section">
          <h2>请听音频，判断是否只包含一个音频事件</h2>
          <audio 
            ref={audioRef}
            src={currentItem.audio} 
            controls 
            className="audio-player"
          />
        </div>

        <div className="answer-section">
          <button 
            className={`answer-btn ${answers[currentIndex] === '是' ? 'selected' : ''}`}
            onClick={() => handleAnswer('是')}
          >
            是
          </button>
          <button 
            className={`answer-btn ${answers[currentIndex] === '否' ? 'selected' : ''}`}
            onClick={() => handleAnswer('否')}
          >
            否
          </button>
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

export default Survey1
