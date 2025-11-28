import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({})
  const [status, setStatus] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    Promise.all([
      axios.get('/api/admin/stats'),
      axios.get('/api/surveys/status')
    ]).then(([statsRes, statusRes]) => {
      setStats(statsRes.data)
      setStatus(statusRes.data)
      setLoading(false)
    })
  }

  const toggleSurvey = (surveyType) => {
    axios.post(`/api/admin/survey/${surveyType}/toggle`).then(() => {
      loadData()
    })
  }

  const exportData = (surveyType) => {
    axios.get(`/api/admin/export?survey_type=${surveyType}`).then(res => {
      const dataStr = JSON.stringify(res.data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `survey${surveyType}_data.json`
      link.click()
    })
  }

  const resetSurvey = (surveyType) => {
    if (!window.confirm(`确定要重置问卷${surveyType}的所有数据吗？此操作将删除所有音频文件和收集的答案数据，且无法恢复！`)) {
      return
    }
    
    axios.post(`/api/admin/survey/${surveyType}/reset`).then(() => {
      alert('重置成功')
      loadData()
    }).catch((err) => {
      const errorMsg = err.response?.data?.error || '重置失败'
      alert(errorMsg)
    })
  }

  if (loading) {
    return <div className="dashboard"><div className="loading">加载中...</div></div>
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  return (
    <div className="dashboard">
      <div className="container">
        <h1>问卷管理后台</h1>
        
        <div className="surveys-overview">
          {[1, 2, 3].map(type => {
            const surveyKey = `survey${type}`
            const surveyStats = stats[surveyKey] || { user_count: 0, answers: {} }
            const isActive = status[surveyKey]
            
            return (
              <div key={type} className="survey-card">
                <div className="card-header">
                  <h2>问卷{type}</h2>
                  <div className="card-actions">
                    <button 
                      className={`toggle-btn ${isActive ? 'active' : 'inactive'}`}
                      onClick={() => toggleSurvey(type)}
                    >
                      {isActive ? '暂停' : '开启'}
                    </button>
                    <button 
                      className="manage-btn"
                      onClick={() => navigate(`/manage/${type}`)}
                    >
                      上传数据
                    </button>
                    <button 
                      className="reset-btn"
                      onClick={() => resetSurvey(type)}
                    >
                      重置
                    </button>
                    <button 
                      className="export-btn"
                      onClick={() => exportData(type)}
                    >
                      导出JSON
                    </button>
                  </div>
                </div>
                
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-label">填写人数</div>
                    <div className="stat-value">{surveyStats.user_count}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">题目数量</div>
                    <div className="stat-value">{Object.keys(surveyStats.answers || {}).length}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">状态</div>
                    <div className={`stat-value ${isActive ? 'active' : 'inactive'}`}>
                      {isActive ? '进行中' : '已暂停'}
                    </div>
                  </div>
                </div>

                {Object.keys(surveyStats.answers || {}).length > 0 && (
                  <div className="chart-section">
                    <h3>答案分布统计</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={Object.entries(surveyStats.answers).map(([item, answers]) => ({
                        item: `题目${item}`,
                        ...Object.entries(answers).reduce((acc, [key, value]) => {
                          acc[key] = value
                          return acc
                        }, {})
                      })).slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="item" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {Object.keys(surveyStats.answers[Object.keys(surveyStats.answers)[0]] || {}).map((key, idx) => (
                          <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} maxBarSize={80} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
