import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Confirm.css'

function Confirm() {
  const navigate = useNavigate()
  const [flowChecked, setFlowChecked] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const [loading, setLoading] = useState(false)

  const name = sessionStorage.getItem('user_name') || ''
  const email = sessionStorage.getItem('user_email') || ''
  const studentId = sessionStorage.getItem('user_student_id') || ''
  const gender = sessionStorage.getItem('user_gender') || ''
  const age = sessionStorage.getItem('user_age') || ''

  useEffect(() => {
    if (!name || !email || !studentId || !gender || !age) {
      navigate('/auth', { replace: true })
    }
  }, [name, email, studentId, gender, age, navigate])

  const handleConfirm = () => {
    if (!flowChecked || !privacyChecked || loading) {
      return
    }
    setLoading(true)
    navigate('/', { replace: true })
  }

  return (
    <div className="confirm-wrapper">
      <div className="confirm-card">
        <header className="confirm-header">
          <p className="confirm-badge">Bee-Pipeline问卷实验</p>
          <h1>问卷说明与隐私确认</h1>
          <p>请在进入问卷前，先了解任务内容并确认隐私条款。</p>
        </header>

        <section className="confirm-user-info">
          <h2>已登记个人信息</h2>
          <div className="info-grid">
            <div>
              <span>姓名</span>
              <p>{name}</p>
            </div>
            <div>
              <span>学号</span>
              <p>{studentId}</p>
            </div>
            <div>
              <span>邮箱</span>
              <p>{email}</p>
            </div>
            <div>
              <span>性别</span>
              <p>{gender === 'male' ? '男' : gender === 'female' ? '女' : '其他/不便透露'}</p>
            </div>
            <div>
              <span>年龄</span>
              <p>{age}</p>
            </div>
          </div>
        </section>

        <section className="confirm-section">
          <h2>任务概览</h2>
          <ul>
            <li>问卷一：听 25 段约 10 秒的音频，判断是否仅包含一个音频事件。</li>
            <li>问卷二：听 25 段音频，并在四个事件标签中选择最恰当的选项。</li>
            <li>问卷三：听 50 段音频（25 对），比较每对音频的质量。</li>
            <li>需要在 1 小时内完成全部问卷并登记学号等真实信息，方可获得 80 元奖励。</li>
          </ul>
        </section>

        <section className="confirm-section">
          <h2>隐私与数据使用说明</h2>
          <ul>
            <li>问卷数据仅用于科研、教学或学术发表，可能以匿名形式对外公开。</li>
            <li>姓名、学号、邮箱仅用于核验和发放奖励，不会出现在任何公开材料中。</li>
            <li>实验为线上进行，不会对您造成身体或心理影响，您可随时退出。</li>
          </ul>
        </section>

        <section className="confirm-checklist">
          <label>
            <input
              type="checkbox"
              checked={flowChecked}
              onChange={(e) => setFlowChecked(e.target.checked)}
            />
            <span>我已了解全部问卷内容以及需要完整完成三个问卷的要求。</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={privacyChecked}
              onChange={(e) => setPrivacyChecked(e.target.checked)}
            />
            <span>我同意数据仅用于科研与教学目的，并授权使用匿名化结果。</span>
          </label>
        </section>

        <button
          className="confirm-btn"
          onClick={handleConfirm}
          disabled={!flowChecked || !privacyChecked || loading}
        >
          {loading ? '正在进入...' : '确认并进入问卷列表'}
        </button>
      </div>
    </div>
  )
}

export default Confirm
