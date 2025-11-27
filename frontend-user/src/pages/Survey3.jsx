import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Survey.css'

function Survey3() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [audioFinished, setAudioFinished] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    axios.get('/api/surveys/3/items').then(res => {
      setItems(res.data.items)
      setLoading(false)
    }).catch(() => {
      navigate('/')
    })
  }, [navigate])

  useEffect(() => {
    setAudioFinished(false)
    if (audioRef.current) {
      const audio = audioRef.current
      const handleEnded = () => {
        setAudioFinished(true)
      }
      audio.addEventListener('ended', handleEnded)
      return () => {
        audio.removeEventListener('ended', handleEnded)
      }
    }
  }, [currentIndex])

  const mosScores = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0]

  const handleAnswer = (answer) => {
    if (!audioFinished) return
    
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

  const submitSurvey = (finalAnswers) => {
    const answerArray = Object.keys(finalAnswers).map(index => ({
      index: parseInt(index),
      answer: finalAnswers[index]
    }))
    
    axios.post('/api/surveys/3/submit', {
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
        
        <div className="mos-info">
          <h2>MOS分数说明</h2>
          <p>MOS（Mean Opinion Score）是音频质量评判标准，分数范围1.0-5.0，分数越高表示音频质量越好。</p>
          <ul>
            <li>1.0-2.0：质量很差，几乎无法使用</li>
            <li>2.0-3.0：质量较差，有明显问题</li>
            <li>3.0-4.0：质量一般，可以接受</li>
            <li>4.0-5.0：质量很好，接近完美</li>
          </ul>
        </div>
        
        <div className="audio-section">
          <h2>请听音频，选择对应的MOS分数</h2>
          <audio 
            ref={audioRef}
            src={currentItem.audio} 
            controls 
            className="audio-player"
          />
        </div>

        <div className="mos-section">
          <div className="mos-grid">
            {mosScores.map(score => (
              <button
                key={score}
                className={`mos-btn ${answers[currentIndex] === score.toString() ? 'selected' : ''}`}
                onClick={() => handleAnswer(score.toString())}
                disabled={!audioFinished}
                style={{ opacity: audioFinished ? 1 : 0.5, cursor: audioFinished ? 'pointer' : 'not-allowed' }}
              >
                {score}
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

export default Survey3
