import { useRef, useState, useEffect } from 'react'

const SYMBOLS = {
  attacker: { name: 'Atacant', icon: '○', color: '#2c7da0', size: 16 },
  attackerBall: { name: 'Atacant amb pilota', icon: '●', color: '#2c7da0', size: 16 },
  defender: { name: 'Defensor', icon: '△', color: '#d62828', size: 16 },
  pass: { name: 'Passada', icon: '→', color: '#2c7da0', size: 20 },
  shot: { name: 'Llançament', icon: '⟶', color: '#e9c46a', size: 20 },
  fakePass: { name: 'Finta de passada', icon: '⇢', color: '#2c7da0', size: 20 },
  fakeShot: { name: 'Finta de llançament', icon: '⇢', color: '#e9c46a', size: 20 },
  block: { name: 'Bloqueig', icon: '▯', color: '#d62828', size: 16 },
  screen: { name: 'Pantalla', icon: '▭', color: '#d62828', size: 16 },
  movement: { name: 'Desplaçament', icon: '⤹', color: '#2c7da0', size: 20 },
}

export default function TrainingCanvas({ diagram, onSave, onClose }) {
  const canvasRef = useRef(null)
  const [ctx, setCtx] = useState(null)
  const [fieldType, setFieldType] = useState(diagram?.type || 'full')
  const [elements, setElements] = useState(diagram?.elements || [])
  const [selectedTool, setSelectedTool] = useState('attacker')
  const [isDragging, setIsDragging] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const CANVAS_WIDTH = 900
  const CANVAS_HEIGHT = 450

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    setCtx(context)
    drawField(context, canvas.width, canvas.height, fieldType)
    drawElements(context, elements)
  }, [fieldType, elements])

  const drawField = (ctx, w, h, type) => {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#e8f0e5'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1.5

    if (type === 'full') {
      const margin = 40
      const fieldW = w - margin * 2
      const fieldH = h - margin * 2
      const centerX = w / 2
      const centerY = h / 2

      // Proporcions: camp 40x20m
      // Radi 6m = 6/20 * (fieldH/2) * 2 = aprox 0.6 * fieldH/2
      const r6   = (fieldH / 2) * 0.62
      const r9   = (fieldH / 2) * 0.93
      const r7m  = (fieldH / 2) * 0.53
      const goalH = fieldH * 0.30
      const goalW = 10

      // Línies exteriors
      ctx.strokeRect(margin, margin, fieldW, fieldH)

      // Línia central vertical
      ctx.beginPath()
      ctx.moveTo(centerX, margin)
      ctx.lineTo(centerX, h - margin)
      ctx.stroke()

      // Cercle central
      ctx.beginPath()
      ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI)
      ctx.stroke()

      // --- COSTAT ESQUERRE ---
      // Porteria (exterior esquerre, centrada verticalment)
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(margin - goalW, centerY - goalH / 2, goalW, goalH)
      ctx.strokeRect(margin - goalW, centerY - goalH / 2, goalW, goalH)

      // Àrea 6m: semicercle cap a la dreta des del costat esquerre
      ctx.beginPath()
      ctx.arc(margin, centerY, r6, -Math.PI / 2, Math.PI / 2)
      ctx.stroke()

      // Línia de 7m
      ctx.beginPath()
      ctx.moveTo(margin + r7m, centerY - 14)
      ctx.lineTo(margin + r7m, centerY + 14)
      ctx.stroke()

      // Àrea 9m puntejada
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.arc(margin, centerY, r9, -Math.PI / 2, Math.PI / 2)
      ctx.stroke()
      ctx.setLineDash([])

      // --- COSTAT DRET ---
      // Porteria (exterior dret)
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(w - margin, centerY - goalH / 2, goalW, goalH)
      ctx.strokeRect(w - margin, centerY - goalH / 2, goalW, goalH)

      // Àrea 6m: semicercle cap a l'esquerra des del costat dret
      ctx.beginPath()
      ctx.arc(w - margin, centerY, r6, Math.PI / 2, -Math.PI / 2)
      ctx.stroke()

      // Línia de 7m
      ctx.beginPath()
      ctx.moveTo(w - margin - r7m, centerY - 14)
      ctx.lineTo(w - margin - r7m, centerY + 14)
      ctx.stroke()

      // Àrea 9m puntejada
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.arc(w - margin, centerY, r9, Math.PI / 2, -Math.PI / 2)
      ctx.stroke()
      ctx.setLineDash([])

    } else if (type === 'halfAttack') {
      // Mitja pista atac — VERTICAL, porteria a dalt
      const margin = 40
      const fieldW = w - margin * 2
      const fieldH = h - margin * 2
      const centerX = w / 2
      const topY = margin

      const goalW = fieldW * 0.30
      const goalH = 10
      const r6    = fieldH * 0.28
      const r9    = fieldH * 0.43
      const dist7m = fieldH * 0.23

      // Línies exteriors
      ctx.strokeRect(margin, margin, fieldW, fieldH)

      // Porteria (dalt, exterior)
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(centerX - goalW / 2, topY - goalH, goalW, goalH)
      ctx.strokeRect(centerX - goalW / 2, topY - goalH, goalW, goalH)

      // Àrea 6m: semicercle cap avall (des de la línia de fons dalt)
      ctx.beginPath()
      ctx.arc(centerX, topY, r6, 0, Math.PI)
      ctx.stroke()

      // Línia de 7m
      ctx.beginPath()
      ctx.moveTo(centerX - 18, topY + dist7m)
      ctx.lineTo(centerX + 18, topY + dist7m)
      ctx.stroke()

      // Àrea 9m puntejada
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.arc(centerX, topY, r9, 0, Math.PI)
      ctx.stroke()
      ctx.setLineDash([])

    } else if (type === 'halfDefense') {
      // Mitja pista defensa — VERTICAL, porteria a baix
      const margin = 40
      const fieldW = w - margin * 2
      const fieldH = h - margin * 2
      const centerX = w / 2
      const bottomY = h - margin

      const goalW = fieldW * 0.30
      const goalH = 10
      const r6    = fieldH * 0.28
      const r9    = fieldH * 0.43
      const dist7m = fieldH * 0.23

      // Línies exteriors
      ctx.strokeRect(margin, margin, fieldW, fieldH)

      // Porteria (baix, exterior)
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(centerX - goalW / 2, bottomY, goalW, goalH)
      ctx.strokeRect(centerX - goalW / 2, bottomY, goalW, goalH)

      // Àrea 6m: semicercle cap amunt (des de la línia de fons baix)
      ctx.beginPath()
      ctx.arc(centerX, bottomY, r6, Math.PI, 0)
      ctx.stroke()

      // Línia de 7m
      ctx.beginPath()
      ctx.moveTo(centerX - 18, bottomY - dist7m)
      ctx.lineTo(centerX + 18, bottomY - dist7m)
      ctx.stroke()

      // Àrea 9m puntejada
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.arc(centerX, bottomY, r9, Math.PI, 0)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  const drawElements = (ctx, elements) => {
    for (const el of elements) {
      ctx.save()
      ctx.translate(el.x, el.y)
      if (el.rotation) ctx.rotate(el.rotation * Math.PI / 180)
      ctx.font = `${SYMBOLS[el.type].size}px "Segoe UI", system-ui`
      ctx.fillStyle = SYMBOLS[el.type].color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(SYMBOLS[el.type].icon, 0, 0)
      ctx.restore()
    }
  }

  const getCanvasCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const handleCanvasClick = (e) => {
    if (isDragging) return
    const { x, y } = getCanvasCoords(e)
    // Evitar col·locar si s'ha fet clic sobre un element existent
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i]
      if (Math.abs(el.x - x) < 15 && Math.abs(el.y - y) < 15) return
    }
    const newElement = {
      id: Date.now(),
      type: selectedTool,
      x,
      y,
      rotation: 0,
    }
    setElements(prev => [...prev, newElement])
  }

  const handleMouseDown = (e) => {
    const { x, y } = getCanvasCoords(e)
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i]
      if (Math.abs(el.x - x) < 15 && Math.abs(el.y - y) < 15) {
        setIsDragging(true)
        setDragIndex(i)
        setDragStart({ x: el.x - x, y: el.y - y })
        break
      }
    }
  }

  const handleMouseMove = (e) => {
    if (!isDragging || dragIndex === null) return
    const { x, y } = getCanvasCoords(e)
    setElements(prev => {
      const updated = [...prev]
      updated[dragIndex] = {
        ...updated[dragIndex],
        x: x + dragStart.x,
        y: y + dragStart.y,
      }
      return updated
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragIndex(null)
  }

  const handleDoubleClick = (e) => {
    const { x, y } = getCanvasCoords(e)
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i]
      if (Math.abs(el.x - x) < 15 && Math.abs(el.y - y) < 15) {
        if (['pass', 'shot', 'fakePass', 'fakeShot', 'movement'].includes(el.type)) {
          setElements(prev => {
            const updated = [...prev]
            updated[i] = { ...el, rotation: (el.rotation + 45) % 360 }
            return updated
          })
        }
        break
      }
    }
  }

  // Suport tàctil
  const getTouchCoords = (e) => {
    const touch = e.touches[0] || e.changedTouches[0]
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    }
  }

  const handleTouchStart = (e) => {
    e.preventDefault()
    const { x, y } = getTouchCoords(e)
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i]
      if (Math.abs(el.x - x) < 20 && Math.abs(el.y - y) < 20) {
        setIsDragging(true)
        setDragIndex(i)
        setDragStart({ x: el.x - x, y: el.y - y })
        return
      }
    }
    // Si no ha tocat cap element, col·loca un nou
    setElements(prev => [...prev, { id: Date.now(), type: selectedTool, x, y, rotation: 0 }])
  }

  const handleTouchMove = (e) => {
    e.preventDefault()
    if (!isDragging || dragIndex === null) return
    const { x, y } = getTouchCoords(e)
    setElements(prev => {
      const updated = [...prev]
      updated[dragIndex] = {
        ...updated[dragIndex],
        x: x + dragStart.x,
        y: y + dragStart.y,
      }
      return updated
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    setDragIndex(null)
  }

  const clearCanvas = () => setElements([])
  const deleteLast = () => setElements(prev => prev.slice(0, -1))
  const saveCanvas = () => onSave({ type: fieldType, elements })

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-handball-bg2 border border-handball-border2 rounded-2xl w-[95%] max-w-6xl max-h-[90vh] overflow-y-auto">

        {/* Capçalera */}
        <div className="flex justify-between items-center border-b border-handball-border p-4">
          <h3 className="font-semibold">Editor tàctic</h3>
          <button className="text-handball-text2 hover:text-handball-text" onClick={onClose}>✕</button>
        </div>

        <div className="p-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-2 mb-4">

            {/* Tipus de camp */}
            <div className="flex gap-1 border-r border-handball-border pr-3">
              <button
                className={`px-2 py-1 rounded text-sm ${fieldType === 'full' ? 'bg-handball-accent text-white' : 'bg-handball-bg3'}`}
                onClick={() => setFieldType('full')}
              >
                🏟️ Complet
              </button>
              <button
                className={`px-2 py-1 rounded text-sm ${fieldType === 'halfAttack' ? 'bg-handball-accent text-white' : 'bg-handball-bg3'}`}
                onClick={() => setFieldType('halfAttack')}
              >
                ⚽ Mitja (atac)
              </button>
              <button
                className={`px-2 py-1 rounded text-sm ${fieldType === 'halfDefense' ? 'bg-handball-accent text-white' : 'bg-handball-bg3'}`}
                onClick={() => setFieldType('halfDefense')}
              >
                🛡️ Mitja (defensa)
              </button>
            </div>

            {/* Símbols */}
            <div className="flex gap-1 flex-wrap">
              {Object.entries(SYMBOLS).map(([key, sym]) => (
                <button
                  key={key}
                  className={`px-3 py-1 rounded text-lg ${selectedTool === key ? 'bg-handball-accent text-white' : 'bg-handball-bg3'}`}
                  onClick={() => setSelectedTool(key)}
                  title={sym.name}
                >
                  {sym.icon}
                </button>
              ))}
            </div>

            {/* Accions */}
            <div className="flex gap-1 ml-auto">
              <button
                className="bg-handball-red/20 text-handball-red px-3 py-1 rounded text-sm"
                onClick={clearCanvas}
              >
                🗑️ Netejar tot
              </button>
              <button
                className="bg-handball-amber/20 text-handball-amber px-3 py-1 rounded text-sm"
                onClick={deleteLast}
              >
                ↩️ Desfer últim
              </button>
            </div>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border border-handball-border2 rounded-lg w-full h-auto bg-white cursor-crosshair touch-none"
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          {/* Llegenda */}
          <div className="mt-3 text-xs text-handball-text3 flex justify-between flex-wrap gap-1">
            <div>🖱️ Clic: col·locar símbol &nbsp;|&nbsp; Arrossegar: moure &nbsp;|&nbsp; 🔁 Doble clic: rotar (fletxes)</div>
            <div>📌 Els símbols es guarden automàticament en guardar el bloc</div>
          </div>
        </div>

        {/* Peu */}
        <div className="border-t border-handball-border p-4 flex justify-end gap-3">
          <button
            className="bg-handball-bg3 border border-handball-border2 px-4 py-2 rounded-lg text-sm"
            onClick={onClose}
          >
            Cancel·lar
          </button>
          <button
            className="bg-handball-accent text-white px-4 py-2 rounded-lg text-sm"
            onClick={saveCanvas}
          >
            Guardar diagrama
          </button>
        </div>
      </div>
    </div>
  )
}
