import { useState, useRef, useCallback } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  )
}

// Рисует кроп на canvas и возвращает Blob
function cropToBlob(image, crop, mimeType = 'image/jpeg') {
  const canvas = document.createElement('canvas')
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  // onComplete возвращает % или px в зависимости от unit — нормализуем в px
  const px = crop.unit === '%'
    ? {
        x: (crop.x / 100) * image.width,
        y: (crop.y / 100) * image.height,
        width: (crop.width / 100) * image.width,
        height: (crop.height / 100) * image.height,
      }
    : { x: crop.x, y: crop.y, width: crop.width, height: crop.height }

  const pixelCrop = {
    x: px.x * scaleX,
    y: px.y * scaleY,
    width: px.width * scaleX,
    height: px.height * scaleY,
  }

  canvas.width = Math.round(pixelCrop.width)
  canvas.height = Math.round(pixelCrop.height)

  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, canvas.width, canvas.height,
  )

  return new Promise((resolve) => canvas.toBlob(resolve, mimeType, 0.92))
}

/**
 * aspect: undefined = свободный, 1 = квадрат, 16/9 = широкий, и т.д.
 */
export function CropModal({ src, fileName, aspect, onConfirm, onCancel }) {
  const imgRef = useRef(null)
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()

  const onImageLoad = useCallback((e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget
    setCrop(aspect
      ? centerAspectCrop(w, h, aspect)
      : centerCrop({ unit: '%', width: 90, height: 90 }, w, h)
    )
  }, [aspect])

  async function handleConfirm() {
    if (!completedCrop || !imgRef.current) return
    const mime = fileName.match(/\.png$/i) ? 'image/png' : 'image/jpeg'
    const blob = await cropToBlob(imgRef.current, completedCrop, mime)
    const ext = mime === 'image/png' ? 'png' : 'jpg'
    const cropped = new File([blob], `crop_${Date.now()}.${ext}`, { type: mime })
    onConfirm(cropped)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div style={{
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        maxWidth: 680, width: '100%', maxHeight: '90vh',
        boxShadow: '0 24px 60px rgba(0,0,0,.35)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ font: '700 15px/1 var(--font-display)' }}>Обрезка фото</div>
            {aspect && (
              <div style={{ font: '500 11px/1 var(--font-display)', color: 'var(--c-ink-500)', marginTop: 4 }}>
                {aspect === 1 ? 'Квадрат 1:1' : aspect === 16/9 ? '16:9' : aspect === 4/3 ? '4:3' : `${aspect.toFixed(2)}:1`}
              </div>
            )}
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--c-ink-400)', font: '600 22px/1' }}>×</button>
        </div>

        {/* Crop area */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5f1' }}>
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            onComplete={c => setCompletedCrop(c)}
            aspect={aspect}
            minWidth={40}
            minHeight={40}
            style={{ maxHeight: '60vh' }}
          >
            <img ref={imgRef} src={src} alt="" onLoad={onImageLoad}
              style={{ maxHeight: '60vh', maxWidth: '100%', display: 'block' }} />
          </ReactCrop>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--c-line)', display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
          <span style={{ font: '500 11px/1 var(--font-display)', color: 'var(--c-ink-400)', marginRight: 'auto' }}>
            Перетащите для выбора области
          </span>
          <button className="kp-btn kp-btn--ghost" style={{ height: 38 }} onClick={onCancel}>Отмена</button>
          <button className="kp-btn kp-btn--primary" style={{ height: 38 }} onClick={handleConfirm}
            disabled={!completedCrop?.width}>
            Обрезать и загрузить
          </button>
        </div>
      </div>
    </div>
  )
}
