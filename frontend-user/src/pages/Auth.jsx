import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../axiosConfig'
import './Auth.css'

function Auth() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const shapePositions = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10
    }))
  }, [])

  useEffect(() => {
    axios.get('/api/auth/check').then(res => {
      if (res.data.authenticated) {
        navigate('/')
      }
    })
  }, [navigate])

  const sendCode = () => {
    if (!email || !email.includes('@')) {
      setError('请输入有效的邮箱地址')
      return
    }

    setLoading(true)
    setError('')
    axios.post('/api/auth/send-code', { email }).then(res => {
      if (res.data.success) {
        setCodeSent(true)
        setCountdown(60)
        if (res.data.code) {
          alert(`验证码：${res.data.code}\n${res.data.message || ''}`)
        } else {
          alert(res.data.message || '验证码已发送到您的邮箱，请查收')
        }
      } else {
        setError(res.data.error || '发送失败')
        setLoading(false)
      }
    }).catch(err => {
      const errorMsg = err.response?.data?.error || err.message || '发送失败，请稍后重试'
      setError(errorMsg)
      setLoading(false)
    })
  }

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleRegister = (e) => {
    e.preventDefault()
    if (!email || !password || !code) {
      setError('请填写所有字段')
      return
    }

    setLoading(true)
    axios.post('/api/auth/register', { email, password, code }).then(() => {
      setIsLogin(true)
      setCode('')
      setCodeSent(false)
      setError('')
      alert('注册成功，请登录')
    }).catch(err => {
      setError(err.response?.data?.error || '注册失败')
    }).finally(() => {
      setLoading(false)
    })
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('请填写邮箱和密码')
      return
    }

    setLoading(true)
    axios.post('/api/auth/login', { email, password }).then(() => {
      navigate('/')
    }).catch(err => {
      setError(err.response?.data?.error || '登录失败')
    }).finally(() => {
      setLoading(false)
    })
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
            <h1>{isLogin ? '欢迎回来' : '创建账号'}</h1>
            <p>{isLogin ? '登录以继续' : '注册新账号开始使用'}</p>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="auth-form">
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
              <input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
                minLength={6}
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <div className="code-input-group">
                  <input
                    type="text"
                    placeholder="验证码"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="form-input code-input"
                    required
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={(codeSent && countdown > 0) || loading}
                    className="send-code-btn"
                  >
                    {countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
                  </button>
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
            </button>
          </form>

          <div className="auth-footer">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setCode('')
                setCodeSent(false)
                setCountdown(0)
              }}
              className="switch-btn"
            >
              {isLogin ? '还没有账号？立即注册' : '已有账号？立即登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Auth
