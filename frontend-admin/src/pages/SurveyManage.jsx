import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './SurveyManage.css'

function SurveyManage() {
  const { surveyType } = useParams()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [hasData, setHasData] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`/api/admin/survey/${surveyType}/has-data`).then(res => {
      setHasData(res.data.has_data)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [surveyType])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUpload = () => {
    if (hasData) {
      alert('问卷已有数据，请先返回后台重置后再上传')
      return
    }

    if (!file) {
      alert('请选择tar文件')
      return
    }

    const fileExt = file.name.toLowerCase()
    const isTarFile = fileExt.endsWith('.tar') || fileExt.endsWith('.tar.gz') || fileExt.endsWith('.tgz')
    
    if (!isTarFile) {
      alert('请上传tar格式的文件（.tar, .tar.gz, .tgz）')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    axios.post(`/api/admin/survey/${surveyType}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then((res) => {
      alert(`上传成功！共上传 ${res.data.uploaded.length} 个音频文件`)
      setFile(null)
      setHasData(true)
      const fileInput = document.getElementById('file-input')
      if (fileInput) {
        fileInput.value = ''
      }
    }).catch((err) => {
      const errorMsg = err.response?.data?.error || '上传失败'
      alert(errorMsg)
    }).finally(() => {
      setUploading(false)
    })
  }

  const surveyNames = {
    '1': '问卷1：单事件音频判断',
    '2': '问卷2：音频事件判断',
    '3': '问卷3：音频质量评判'
  }

  return (
    <div className="survey-manage">
      <div className="container">
        <div className="header">
          <button className="back-btn" onClick={() => navigate('/')}>
            返回
          </button>
          <h1>{surveyNames[surveyType] || '问卷管理'}</h1>
        </div>

        <div className="upload-section">
          <h2>上传问卷数据</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>加载中...</div>
          ) : hasData ? (
            <div className="info-box" style={{ background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)', borderLeftColor: '#f44336' }}>
              <p style={{ color: '#c62828', fontWeight: '600' }}>
                <strong>提示：</strong>该问卷已有数据，无法再次上传。如需重新上传，请先返回后台使用"重置"功能清除所有数据。
              </p>
            </div>
          ) : (
            <>
              <div className="upload-area">
                <input
                  type="file"
                  id="file-input"
                  accept=".tar,.tar.gz,.tgz"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-input" className="file-label">
                  选择tar文件
                </label>
                {file && (
                  <div className="files-list">
                    <p>已选择文件：</p>
                    <div className="file-item">
                      <span>{file.name}</span>
                      <span style={{ color: '#666', fontSize: '0.9em' }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {file && (
                <button 
                  className="upload-btn" 
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? '上传中...' : '开始上传'}
                </button>
              )}
            </>
          )}

          <div className="info-box">
            <p><strong>上传说明：</strong></p>
            <ul style={{ marginTop: '10px', paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>请上传tar格式的文件（.tar, .tar.gz, .tgz）</li>
              <li>tar文件中应包含wav或flac格式的音频文件</li>
              {surveyType === '2' && (
                <li>问卷2需要为每个音频文件提供对应的json标签文件：</li>
              )}
              {surveyType === '2' && (
                <li style={{ marginLeft: '20px' }}>
                  音频文件名为 audio.wav，则对应的标签文件应为 audio.json
                </li>
              )}
              {surveyType === '2' && (
                <li style={{ marginLeft: '20px' }}>
                  json文件内容应为一个数组，例如：["标签1", "标签2", "标签3"]
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SurveyManage
