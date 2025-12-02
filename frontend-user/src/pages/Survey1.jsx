import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../axiosConfig'
import './Survey.css'

function Survey1() {
  const navigate = useNavigate()
  const audioRef = useRef(null)
  const [phase, setPhase] = useState('intro')
  const [guideItems, setGuideItems] = useState([])
  const [guideIndex, setGuideIndex] = useState(0)
  const [guideAnswers, setGuideAnswers] = useState({})
  const [guideLoading, setGuideLoading] = useState(true)
  const [guideSubmitting, setGuideSubmitting] = useState(false)
  const [guideResult, setGuideResult] = useState(null)
  const [testItems, setTestItems] = useState([])
  const [testIndex, setTestIndex] = useState(0)
  const [testAnswers, setTestAnswers] = useState({})
  const [testLoading, setTestLoading] = useState(false)
  const [testSubmitting, setTestSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  const fetchGuideItems = () => {
    setGuideLoading(true)
    setErrorMessage('')
    axios.get('/api/surveys/1/items', { params: { stage: 'guide' } })
      .then(res => {
        setGuideItems(res.data.items || [])
        setGuideIndex(0)
        setGuideAnswers({})
      })
      .catch(() => {
        setErrorMessage('引导题目加载失败，请稍后再试。')
      })
      .finally(() => {
        setGuideLoading(false)
      })
  }

  const fetchTestItems = (enterAfterLoad = false) => {
    setTestLoading(true)
    setErrorMessage('')
    axios.get('/api/surveys/1/items', { params: { stage: 'test' } })
      .then(res => {
        setTestItems(res.data.items || [])
        setTestIndex(0)
        setTestAnswers({})
        if (enterAfterLoad) {
          setPhase('test')
          resetAudio()
        }
      })
      .catch(() => {
        setErrorMessage('正式题目加载失败，请稍后再试。')
      })
      .finally(() => {
        setTestLoading(false)
      })
  }

  useEffect(() => {
    fetchGuideItems()
  }, [])

  const handleBack = () => {
    navigate('/')
  }

  const handleGuideAnswer = (answer) => {
    setGuideAnswers(prev => ({ ...prev, [guideIndex]: answer }))
  }

  const startGuide = () => {
    if (guideItems.length === 0 || guideLoading) {
      return
    }
    setGuideIndex(0)
    setGuideAnswers({})
    setPhase('guide')
    resetAudio()
  }

  const handleGuideNext = () => {
    if (!guideAnswers[guideIndex]) {
      return
    }
    if (guideIndex < guideItems.length - 1) {
      setGuideIndex(guideIndex + 1)
      resetAudio()
    } else {
      submitGuide()
    }
  }

  const handleGuidePrevious = () => {
    if (guideIndex === 0) {
      return
    }
    setGuideIndex(guideIndex - 1)
    resetAudio()
  }

  const submitGuide = () => {
    if (guideSubmitting) {
      return
    }
    setGuideSubmitting(true)
    const answerArray = Object.keys(guideAnswers).map(index => ({
      index: parseInt(index, 10),
      answer: guideAnswers[index]
    })).sort((a, b) => a.index - b.index)
    const name = sessionStorage.getItem('user_name')
    const email = sessionStorage.getItem('user_email')
    const studentId = sessionStorage.getItem('user_student_id')
    axios.post('/api/surveys/1/submit', {
      answers: answerArray,
      name: name,
      email: email,
      student_id: studentId,
      stage: 'guide'
    }).then(res => {
      setGuideSubmitting(false)
      setGuideResult({
        passed: res.data?.passed,
        accuracy: res.data?.accuracy,
        correct_count: res.data?.correct_count,
        total: res.data?.total
      })
      setPhase('guide_result')
      resetAudio()
    }).catch(() => {
      setGuideSubmitting(false)
      setErrorMessage('引导结果提交失败，请稍后重新尝试。')
    })
  }

  const retryGuide = () => {
    setGuideResult(null)
    setGuideAnswers({})
    fetchGuideItems()
    setPhase('guide')
    resetAudio()
  }

  const handleStartTest = () => {
    if (testItems.length === 0) {
      fetchTestItems(true)
    } else {
      setTestIndex(0)
      setTestAnswers({})
      setPhase('test')
      resetAudio()
    }
  }

  const handleTestAnswer = (answer) => {
    setTestAnswers(prev => ({ ...prev, [testIndex]: answer }))
  }

  const handleTestNext = () => {
    if (!testAnswers[testIndex]) {
      return
    }
    if (testIndex < testItems.length - 1) {
      setTestIndex(testIndex + 1)
      resetAudio()
    } else {
      submitTest()
    }
  }

  const handleTestPrevious = () => {
    if (testIndex === 0) {
      return
    }
    setTestIndex(testIndex - 1)
    resetAudio()
  }

  const submitTest = () => {
    if (testSubmitting) {
      return
    }
    setTestSubmitting(true)
    const answerArray = Object.keys(testAnswers).map(index => ({
      index: parseInt(index, 10),
      answer: testAnswers[index]
    })).sort((a, b) => a.index - b.index)
    const name = sessionStorage.getItem('user_name')
    const email = sessionStorage.getItem('user_email')
    const studentId = sessionStorage.getItem('user_student_id')
    axios.post('/api/surveys/1/submit', {
      answers: answerArray,
      name: name,
      email: email,
      student_id: studentId,
      stage: 'test'
    }).then(() => {
      setTestSubmitting(false)
      setPhase('completed')
      resetAudio()
      setTimeout(() => {
        navigate('/')
      }, 2000)
    }).catch(() => {
      setTestSubmitting(false)
      setErrorMessage('正式测试提交失败，请稍后重试。')
    })
  }

  const renderStage = (items, currentIndex, answers, onAnswer, onNext, onPrevious, submitting, title, submitLabel) => {
    if (items.length === 0) {
      return <div className="loading">暂无题目</div>
    }
    const currentItem = items[currentIndex]
    const isLast = currentIndex === items.length - 1
    const isFirst = currentIndex === 0
    const progressWidth = `${((currentIndex + 1) / items.length) * 100}%`
    const buttonLabel = submitting ? '提交中...' : (isLast ? submitLabel : '下一题')
    return (
      <>
        <div className="progress-bar">
          <div className="progress" style={{ width: progressWidth }}></div>
        </div>
        <div className="question-info">
          {title} {currentIndex + 1} / {items.length}
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
            onClick={() => onAnswer('是')}
          >
            是
          </button>
          <button
            className={`answer-btn ${answers[currentIndex] === '否' ? 'selected' : ''}`}
            onClick={() => onAnswer('否')}
          >
            否
          </button>
        </div>
        <div className="navigation-buttons">
          <button
            onClick={onPrevious}
            className="previous-btn"
            disabled={isFirst}
          >
            上一题
          </button>
          <button
            onClick={onNext}
            className="next-btn"
            disabled={!answers[currentIndex] || submitting}
          >
            {buttonLabel}
          </button>
        </div>
      </>
    )
  }

  const renderIntro = () => (
    <div className="intro-section">
      <h1>问卷一：单音频事件判断</h1>
      <p>本问卷用于评估你区分音频中单一事件与复合事件的能力。完整流程包含 5 道引导练习题与 20 道正式测试题。</p>
      <ul className="intro-list">
        <li>引导练习需全部完成并达到 60% 正确率才可进入正式测试。</li>
        <li>引导题有标准答案，正式题与之前的提交逻辑保持一致。</li>
        <li>每题只需要判断音频内是否仅包含一个音频事件。</li>
      </ul>
      <div className="intro-guide">
        <h2>什么是“单音频事件”?</h2>
        <p>同一种声音连续出现，算作同一个音频事件。例如两个男人交谈，都属于“Man Speaking”。</p>
        <p>不同类型的声音同时存在则属于不同事件。例如一个男人和一个女人对话，是“Man Speaking”与“Woman Speaking”两个事件；人声和歌声同现，也被视为两个独立事件。</p>
      </div>
      {guideLoading ? (
        <div className="loading">引导题目加载中...</div>
      ) : (
        <div className="intro-actions">
          <button
            className="next-btn"
            onClick={startGuide}
            disabled={guideItems.length === 0}
          >
            我已了解，开始引导练习
          </button>
        </div>
      )}
    </div>
  )

  const renderGuideResult = () => {
    if (!guideResult) {
      return null
    }
    const accuracyText = guideResult.accuracy !== undefined
      ? `${Math.round((guideResult.accuracy || 0) * 100)}%`
      : '--'
    return (
      <div className="guide-result-card">
        <h2>{guideResult.passed ? '引导练习通过' : '引导练习未通过'}</h2>
        <p>正确率：{accuracyText}（{guideResult.correct_count || 0} / {guideResult.total || 0}）</p>
        {guideResult.passed ? (
          <>
            <p>恭喜通过引导练习，现在可以进入 20 题正式测试。</p>
            <button className="next-btn" onClick={handleStartTest} disabled={testLoading}>
              {testLoading ? '加载正式题目...' : '进入正式测试'}
            </button>
          </>
        ) : (
          <>
            <p>正确率不足 60%，请重新练习以确保理解题目要求。</p>
            <button className="next-btn" onClick={retryGuide} disabled={guideLoading}>
              {guideLoading ? '重新加载中...' : '重新练习'}
            </button>
          </>
        )}
      </div>
    )
  }

  const renderCompleted = () => (
    <div className="completion-message">
      正式测试已完成，感谢你的参与！页面即将跳转...
    </div>
  )

  return (
    <div className="survey-container">
      <button onClick={handleBack} className="back-survey-btn">返回主页</button>
      <div className="survey-content">
        {errorMessage && <div className="error-box">{errorMessage}</div>}
        {phase === 'intro' && renderIntro()}
        {phase === 'guide' && (
          guideLoading
            ? <div className="loading">引导题目加载中...</div>
            : renderStage(
                guideItems,
                guideIndex,
                guideAnswers,
                handleGuideAnswer,
                handleGuideNext,
                handleGuidePrevious,
                guideSubmitting,
                '引导题',
                '提交引导结果'
              )
        )}
        {phase === 'guide_result' && renderGuideResult()}
        {phase === 'test' && (
          testLoading
            ? <div className="loading">正式题目加载中...</div>
            : renderStage(
                testItems,
                testIndex,
                testAnswers,
                handleTestAnswer,
                handleTestNext,
                handleTestPrevious,
                testSubmitting,
                '正式题',
                '提交正式结果'
              )
        )}
        {phase === 'completed' && renderCompleted()}
      </div>
    </div>
  )
}

export default Survey1
