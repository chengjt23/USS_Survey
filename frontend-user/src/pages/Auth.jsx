import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

function Auth() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gender, setGender] = useState('')
  const [age, setAge] = useState('')

  useEffect(() => {
    const pendingInfo = sessionStorage.getItem('pending_user_info')
    if (pendingInfo) {
      try {
        const info = JSON.parse(pendingInfo)
        if (info.name) setName(info.name)
        if (info.email) setEmail(info.email)
        if (info.studentId) setStudentId(info.studentId)
        if (info.gender) setGender(info.gender)
        if (info.age) setAge(String(info.age))
      } catch (e) {
        console.error('预填信息解析失败', e)
      }
    }
  }, [])

  const shapePositions = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10
    }))
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !email || !studentId || !gender || !age) {
      setError('请填写所有字段')
      return
    }

    if (!email.includes('@')) {
      setError('请输入有效的邮箱地址')
      return
    }

    const ageNumber = Number(age)
    if (!Number.isFinite(ageNumber) || ageNumber <= 0) {
      setError('请输入有效的年龄')
      return
    }

    localStorage.removeItem('survey1_progress')
    localStorage.removeItem('survey2_progress')
    localStorage.removeItem('survey3_progress')
    
    sessionStorage.setItem('user_name', name)
    sessionStorage.setItem('user_email', email)
    sessionStorage.setItem('user_student_id', studentId)
    sessionStorage.setItem('user_gender', gender)
    sessionStorage.setItem('user_age', String(ageNumber))
    sessionStorage.removeItem('pending_user_info')
    navigate('/confirm')
  }

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="floating-shapes">
          {shapePositions.map((pos, i) => (
            <div key={i} className="shape" style={{
              left: `${pos.left}%`,
              animationDelay: `${pos.delay}s`,
              animationDuration: `${pos.duration}s`
            }}></div>
          ))}
        </div>
      </div>
      
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <h1>欢迎</h1>
            <p>请填写信息以开始</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <input
                type="text"
                placeholder="姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                placeholder="学号"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="email"
                placeholder="邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <select
                className="form-input"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
              >
                <option value="" disabled>性别</option>
                <option value="male">男</option>
                <option value="female">女</option>
                <option value="other">其他/不便透露</option>
              </select>
            </div>

            <div className="form-group">
              <input
                type="number"
                min="1"
                placeholder="年龄"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="form-input"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? '处理中...' : '提交'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Auth
