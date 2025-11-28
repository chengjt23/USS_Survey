import { useRef, useState, useEffect } from 'react'
import './SignaturePad.css'

function SignaturePad({ onSignatureChange }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      }
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const coords = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!isDrawing) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const coords = getCoordinates(e)
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
    updateSignature()
  }

  const stopDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(false)
    updateSignature()
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    updateSignature()
  }

  const updateSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    let hasContent = false
    
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) {
        hasContent = true
        break
      }
    }

    const svgData = canvasToSVG(canvas)
    if (onSignatureChange) {
      onSignatureChange(svgData, hasContent)
    }
  }

  const canvasToSVG = (canvas) => {
    const dataURL = canvas.toDataURL('image/png')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvas.width}" height="${canvas.height}">
      <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataURL}"/>
    </svg>`
    return svg
  }

  return (
    <div className="signature-pad-container">
      <label className="signature-label">签名</label>
      <div className="signature-wrapper">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="signature-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <button
          type="button"
          onClick={clearSignature}
          className="clear-signature-btn"
        >
          清除
        </button>
      </div>
    </div>
  )
}

export default SignaturePad
