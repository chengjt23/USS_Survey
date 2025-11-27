import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './SurveyManage.css'

function SurveyManage() {
  const { surveyType } = useParams()
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [tags, setTags] = useState({})
  const [uploading, setUploading] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles(selectedFiles)
    
    const newTags = {}
    selectedFiles.forEach((file, idx) => {
      if (surveyType === '2') {
        newTags[idx] = []
      }
    })
    setTags(newTags)
  }

  const handleTagChange = (idx, value) => {
    if (surveyType === '2') {
      const tagList = value.split(',').map(t => t.trim()).filter(t => t)
      setTags({ ...tags, [idx]: tagList })
    }
  }

  const handleUpload = () => {
    if (files.length === 0) {
      alert('请选择文件')
      return
    }

    if (surveyType === '2') {
      const missingTags = files.findIndex((_, idx) => !tags[idx] || tags[idx].length === 0)
      if (missingTags !== -1) {
        alert(`请为第${missingTags + 1}个文件添加标签`)
        return
      }
    }

    setUploading(true)
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    formData.append('tags', JSON.stringify(tags))

    axios.post(`/api/admin/survey/${surveyType}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(() => {
      alert('上传成功')
      setFiles([])
      setTags({})
      setTagInput('')
    }).catch(() => {
      alert('上传失败')
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
          <h2>上传音频文件</h2>
          <div className="upload-area">
            <input
              type="file"
              id="file-input"
              multiple
              accept="audio/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-input" className="file-label">
              选择音频文件
            </label>
            {files.length > 0 && (
              <div className="files-list">
                <p>已选择 {files.length} 个文件：</p>
                {files.map((file, idx) => (
                  <div key={idx} className="file-item">
                    <span>{file.name}</span>
                    {surveyType === '2' && (
                      <div className="tags-input-wrapper">
                        <input
                          type="text"
                          placeholder="输入标签，用逗号分隔"
                          value={(tags[idx] || []).join(', ')}
                          onChange={(e) => handleTagChange(idx, e.target.value)}
                          className="tags-input"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {files.length > 0 && (
            <button 
              className="upload-btn" 
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? '上传中...' : '开始上传'}
            </button>
          )}

          {surveyType === '2' && (
            <div className="info-box">
              <p>提示：问卷2需要为每个音频文件设置标签池，请在文件列表中为每个文件输入标签，多个标签用逗号分隔。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SurveyManage
