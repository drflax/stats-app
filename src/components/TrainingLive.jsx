import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import TrainingCanvas from './TrainingCanvas'

// Funció per dibuixar un diagrama en un canvas (per a miniatures)
function drawDiagramOnCanvas(canvas, diagram) {
  if (!canvas || !diagram) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  const type = diagram.type
  const elements = diagram.elements || []

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#e8f0e5'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1

  if (type === 'full') {
    const margin = w * 0.05
    const fieldW = w - margin * 2
    const fieldH = h - margin * 2
    const centerX = w / 2
    const centerY = h / 2
    ctx.strokeRect(margin, margin, fieldW, fieldH)
    ctx.beginPath()
    ctx.moveTo(centerX, margin)
    ctx.lineTo(centerX, h - margin)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(centerX, centerY, fieldH * 0.08, 0, 2 * Math.PI)
    ctx.stroke()
    const r6 = fieldH * 0.22
    const r9 = fieldH * 0.34
    ctx.beginPath()
    ctx.arc(margin, centerY, r6, -Math.PI / 2, Math.PI / 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(w - margin, centerY, r6, Math.PI / 2, -Math.PI / 2)
    ctx.stroke()
    ctx.setLineDash([2, 4])
    ctx.beginPath()
    ctx.arc(margin, centerY, r9, -Math.PI / 2, Math.PI / 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(w - margin, centerY, r9, Math.PI / 2, -Math.PI / 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(margin - 5, centerY - 8, 5, 16)
    ctx.fillRect(w - margin, centerY - 8, 5, 16)
  } else if (type === 'halfAttack') {
    const margin = w * 0.05
    const fieldW = w - margin * 2
    const fieldH = h - margin * 2
    const centerX = w / 2
    const topY = margin
    ctx.strokeRect(margin, margin, fieldW, fieldH)
    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(centerX - 12, topY - 4, 24, 4)
    ctx.strokeRect(centerX - 12, topY - 4, 24, 4)
    const r6 = fieldH * 0.28
    ctx.beginPath()
    ctx.arc(centerX, topY, r6, 0, Math.PI)
    ctx.stroke()
    ctx.setLineDash([2, 4])
    const r9 = fieldH * 0.43
    ctx.beginPath()
    ctx.arc(centerX, topY, r9, 0, Math.PI)
    ctx.stroke()
    ctx.setLineDash([])
  } else if (type === 'halfDefense') {
    const margin = w * 0.05
    const fieldW = w - margin * 2
    const fieldH = h - margin * 2
    const centerX = w / 2
    const bottomY = h - margin
    ctx.strokeRect(margin, margin, fieldW, fieldH)
    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(centerX - 12, bottomY, 24, 4)
    ctx.strokeRect(centerX - 12, bottomY, 24, 4)
    const r6 = fieldH * 0.28
    ctx.beginPath()
    ctx.arc(centerX, bottomY, r6, Math.PI, 0)
    ctx.stroke()
    ctx.setLineDash([2, 4])
    const r9 = fieldH * 0.43
    ctx.beginPath()
    ctx.arc(centerX, bottomY, r9, Math.PI, 0)
    ctx.stroke()
    ctx.setLineDash([])
  }

  const scaleX = w / 900
  const scaleY = h / 450
  const SYMBOLS = {
    attacker: { icon: '○', color: '#2c7da0' },
    attackerBall: { icon: '●', color: '#2c7da0' },
    defender: { icon: '△', color: '#d62828' },
    pass: { icon: '→', color: '#2c7da0' },
    shot: { icon: '⟶', color: '#e9c46a' },
    fakePass: { icon: '⇢', color: '#2c7da0' },
    fakeShot: { icon: '⇢', color: '#e9c46a' },
    block: { icon: '▯', color: '#d62828' },
    screen: { icon: '▭', color: '#d62828' },
    movement: { icon: '⤹', color: '#2c7da0' },
  }
  for (const el of elements) {
    const sym = SYMBOLS[el.type] || SYMBOLS.attacker
    ctx.save()
    ctx.translate(el.x * scaleX, el.y * scaleY)
    if (el.rotation) ctx.rotate(el.rotation * Math.PI / 180)
    ctx.font = `${Math.max(8, sym.size * 0.55)}px "Segoe UI", system-ui`
    ctx.fillStyle = sym.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(sym.icon, 0, 0)
    ctx.restore()
  }
}

export default function TrainingLive({ training, team, players, onFinish, showToast, user, userRole }) {
  const [blocks, setBlocks] = useState(training?.plan || [])
  const [editBlock, setEditBlock] = useState(null)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [canvasOpen, setCanvasOpen] = useState(false)
  const [currentBlockIndex, setCurrentBlockIndex] = useState(null)
  const [attendance, setAttendance] = useState({})
  const [events, setEvents] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const thumbnailRefs = useRef({})

  const canEdit = user && (userRole === 'entrenador' || userRole === 'segon_entrenador')
  const goalkeepers = players.filter(p => p.pos === 'PO')
  const playersMap = new Map(players.map(p => [p.id, p.name]))

  // Carregar assistència existent
  useEffect(() => {
    async function fetchAttendance() {
      const { data } = await supabase
        .from('training_attendance')
        .select('player_id, present')
        .eq('training_id', training.id)
      if (data) {
        const att = {}
        data.forEach(a => { att[a.player_id] = a.present })
        setAttendance(att)
      }
    }
    fetchAttendance()
  }, [training.id])

  // Dibuixar miniatures quan canvien els blocs
  useEffect(() => {
    Object.entries(thumbnailRefs.current).forEach(([idx, canvas]) => {
      const block = blocks[parseInt(idx)]
      if (block && block.diagram && canvas) {
        drawDiagramOnCanvas(canvas, block.diagram)
      } else if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#e8f0e5'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    })
  }, [blocks])

  const toggleAttendance = (playerId) => {
    if (!canEdit) return
    setAttendance(prev => ({ ...prev, [playerId]: !prev[playerId] }))
  }

  const addEvent = (eventType, label) => {
    if (!canEdit) return
    if (!selectedPlayer) {
      showToast('Selecciona un porter primer', 'error')
      return
    }
    const player = players.find(p => p.id === selectedPlayer)
    if (player.pos !== 'PO') {
      showToast('Només es poden registrar accions per a porters', 'error')
      return
    }
    setEvents(prev => [...prev, {
      id: Date.now(),
      playerId: selectedPlayer,
      playerName: player.name,
      type: eventType,
      label,
    }])
    showToast(`${label}: ${player.name}`, 'success')
  }

  const saveTraining = async () => {
    if (!canEdit) return
    setSaving(true)
    try {
      // Guardar assistència
      await supabase.from('training_attendance').delete().eq('training_id', training.id)
      const attendanceRows = Object.entries(attendance).map(([pid, present]) => ({
        training_id: training.id,
        player_id: parseInt(pid),
        present,
      }))
      if (attendanceRows.length) {
        const { error } = await supabase.from('training_attendance').insert(attendanceRows)
        if (error) throw error
      }

      // Agregar accions
      const aggregated = {}
      for (const ev of events) {
        const key = `${ev.playerId}_${ev.type}`
        aggregated[key] = aggregated[key] || { player_id: ev.playerId, event_type: ev.type, quantity: 0 }
        aggregated[key].quantity += 1
      }
      await supabase.from('training_events').delete().eq('training_id', training.id)
      const eventsToInsert = Object.values(aggregated).map(e => ({
        training_id: training.id,
        player_id: e.player_id,
        event_type: e.event_type,
        quantity: e.quantity,
      }))
      if (eventsToInsert.length) {
        const { error } = await supabase.from('training_events').insert(eventsToInsert)
        if (error) throw error
      }

      // Guardar el pla actualitzat
      const { error: planError } = await supabase
        .from('trainings')
        .update({ plan: blocks })
        .eq('id', training.id)
      if (planError) throw planError

      showToast('Entrenament guardat correctament', 'success')
      onFinish()
    } catch (err) {
      console.error(err)
      showToast('Error guardant entrenament', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Gestió de blocs
  const addBlock = () => {
    if (!canEdit) return
    setEditBlock({ order: blocks.length + 1, title: '', duration: '', description: '', diagram: null })
    setShowBlockModal(true)
  }

  const editBlockHandler = (block, idx) => {
    if (!canEdit) return
    setEditBlock({ ...block, originalIndex: idx })
    setShowBlockModal(true)
  }

  const saveBlock = () => {
    if (!canEdit) return
    if (editBlock.originalIndex !== undefined) {
      const newBlocks = [...blocks]
      newBlocks[editBlock.originalIndex] = {
        order: editBlock.order,
        title: editBlock.title,
        duration: editBlock.duration,
        description: editBlock.description,
        diagram: editBlock.diagram,
      }
      setBlocks(newBlocks)
    } else {
      setBlocks([...blocks, {
        order: blocks.length + 1,
        title: editBlock.title,
        duration: editBlock.duration,
        description: editBlock.description,
        diagram: editBlock.diagram,
      }])
    }
    setShowBlockModal(false)
    setEditBlock(null)
  }

  const deleteBlock = (idx) => {
    if (!canEdit) return
    if (confirm('Eliminar aquest bloc?')) {
      const newBlocks = blocks.filter((_, i) => i !== idx)
      setBlocks(newBlocks.map((b, i) => ({ ...b, order: i + 1 })))
    }
  }

  const moveBlockUp = (idx) => {
    if (!canEdit) return
    if (idx === 0) return
    const newBlocks = [...blocks]
    ;[newBlocks[idx - 1], newBlocks[idx]] = [newBlocks[idx], newBlocks[idx - 1]]
    newBlocks.forEach((b, i) => (b.order = i + 1))
    setBlocks(newBlocks)
  }

  const moveBlockDown = (idx) => {
    if (!canEdit) return
    if (idx === blocks.length - 1) return
    const newBlocks = [...blocks]
    ;[newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]]
    newBlocks.forEach((b, i) => (b.order = i + 1))
    setBlocks(newBlocks)
  }

  // Exportació a PDF (visible per a tothom)
  const exportTraining = () => {
    setExporting(true)
    setTimeout(() => {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        showToast('No s\'ha pogut obrir la finestra d\'impressió', 'error')
        setExporting(false)
        return
      }

      const escapeHtml = (str) => {
        if (!str) return ''
        return str.replace(/[&<>]/g, (m) => {
          if (m === '&') return '&amp;'
          if (m === '<') return '&lt;'
          if (m === '>') return '&gt;'
          return m
        })
      }

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Entrenament ${escapeHtml(training.title)}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: white; color: black; }
          h1 { font-size: 1.8rem; }
          .meta { color: #555; margin-bottom: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; }
          .section-title { font-size: 1.4rem; font-weight: bold; margin: 1rem 0 0.5rem; border-left: 4px solid #2c7da0; padding-left: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
          th { background: #f0f0f0; }
          .present { background-color: #e8f0e5; }
          .absent { background-color: #ffe6e6; }
          .block-item { margin-bottom: 12px; padding: 8px; background: #f9f9f9; border-left: 3px solid #2c7da0; }
          .block-title { font-weight: bold; }
          .block-diagram img { max-width: 100%; height: auto; border: 1px solid #ccc; margin-top: 6px; }
          @media print { body { margin: 0; padding: 15px; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(training.title)}</h1>
        <div class="meta">📅 ${new Date(training.date).toLocaleDateString('ca-ES')} · ⏱️ ${training.duration_minutes || '?'} minuts</div>

        <div class="section-title">📋 Pla de la sessió</div>
        ${blocks.map((blk, idx) => `
          <div class="block-item">
            <div class="block-title">${idx + 1}. ${escapeHtml(blk.title || `Bloc ${blk.order}`)}</div>
            <div class="block-duration">⏱️ Durada: ${blk.duration || '—'}</div>
            <div>${escapeHtml(blk.description || 'Sense descripció').replace(/\n/g, '<br>')}</div>
            ${blk.diagram ? `<div class="block-diagram" id="diagram-${idx}"></div>` : ''}
          </div>
        `).join('')}

        <div class="section-title">👥 Assistència</div>
        <div class="attendance-grid">
          ${players.map(p => `
            <div class="${attendance[p.id] !== false ? 'present' : 'absent'}" style="padding: 4px 8px; border-bottom: 1px solid #eee;">
              ${attendance[p.id] !== false ? '✅' : '❌'} ${escapeHtml(p.name)} ${p.pos === 'PO' ? '(POR)' : ''}
            </div>
          `).join('')}
        </div>

        <div class="section-title">🧤 Accions de porters</div>
        <table>
          <thead><tr><th>Porter</th><th>Acció</th><th>Quantitat</th></tr></thead>
          <tbody>
            ${(() => {
              const agg = {}
              for (const ev of events) {
                const key = `${ev.playerName}_${ev.label}`
                agg[key] = agg[key] || { name: ev.playerName, label: ev.label, qty: 0 }
                agg[key].qty += 1
              }
              return Object.values(agg).map(a => `<tr><td>${escapeHtml(a.name)}</td><td>${a.label}</td><td>${a.qty}</td></tr>`).join('')
            })()}
          </tbody>
        </table>

        <script>
          function drawDiagram(canvas, diagram) {
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            ctx.fillStyle = '#e8f0e5';
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            if (diagram.type === 'full') {
              const margin = w * 0.05;
              const fieldW = w - margin*2, fieldH = h - margin*2;
              const cx = w/2, cy = h/2;
              ctx.strokeRect(margin, margin, fieldW, fieldH);
              ctx.beginPath(); ctx.moveTo(cx, margin); ctx.lineTo(cx, h-margin); ctx.stroke();
              ctx.beginPath(); ctx.arc(cx, cy, fieldH*0.08, 0, 2*Math.PI); ctx.stroke();
              const r6 = fieldH*0.22, r9 = fieldH*0.34;
              ctx.beginPath(); ctx.arc(margin, cy, r6, -Math.PI/2, Math.PI/2); ctx.stroke();
              ctx.beginPath(); ctx.arc(w-margin, cy, r6, Math.PI/2, -Math.PI/2); ctx.stroke();
              ctx.setLineDash([2,4]);
              ctx.beginPath(); ctx.arc(margin, cy, r9, -Math.PI/2, Math.PI/2); ctx.stroke();
              ctx.beginPath(); ctx.arc(w-margin, cy, r9, Math.PI/2, -Math.PI/2); ctx.stroke();
              ctx.setLineDash([]);
              ctx.fillStyle = 'rgba(0,0,0,0.1)';
              ctx.fillRect(margin-5, cy-8, 5, 16);
              ctx.fillRect(w-margin, cy-8, 5, 16);
            } else if (diagram.type === 'halfAttack') {
              const margin = w*0.05;
              const fieldW = w-margin*2, fieldH = h-margin*2;
              const cx = w/2, topY = margin;
              ctx.strokeRect(margin, margin, fieldW, fieldH);
              ctx.fillRect(cx-12, topY-4, 24, 4);
              ctx.strokeRect(cx-12, topY-4, 24, 4);
              const r6 = fieldH*0.28;
              ctx.beginPath(); ctx.arc(cx, topY, r6, 0, Math.PI); ctx.stroke();
              ctx.setLineDash([2,4]);
              const r9 = fieldH*0.43;
              ctx.beginPath(); ctx.arc(cx, topY, r9, 0, Math.PI); ctx.stroke();
              ctx.setLineDash([]);
            } else if (diagram.type === 'halfDefense') {
              const margin = w*0.05;
              const fieldW = w-margin*2, fieldH = h-margin*2;
              const cx = w/2, bottomY = h-margin;
              ctx.strokeRect(margin, margin, fieldW, fieldH);
              ctx.fillRect(cx-12, bottomY, 24, 4);
              ctx.strokeRect(cx-12, bottomY, 24, 4);
              const r6 = fieldH*0.28;
              ctx.beginPath(); ctx.arc(cx, bottomY, r6, Math.PI, 0); ctx.stroke();
              ctx.setLineDash([2,4]);
              const r9 = fieldH*0.43;
              ctx.beginPath(); ctx.arc(cx, bottomY, r9, Math.PI, 0); ctx.stroke();
              ctx.setLineDash([]);
            }
            const scaleX = w / 900, scaleY = h / 450;
            const sym = { attacker:'○', attackerBall:'●', defender:'△', pass:'→', shot:'⟶', fakePass:'⇢', fakeShot:'⇢', block:'▯', screen:'▭', movement:'⤹' };
            for (const el of diagram.elements) {
              ctx.save();
              ctx.translate(el.x * scaleX, el.y * scaleY);
              if (el.rotation) ctx.rotate(el.rotation * Math.PI/180);
              ctx.font = '14px "Segoe UI"';
              ctx.fillStyle = el.type==='defender'? '#d62828' : '#2c7da0';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(sym[el.type] || '○', 0, 0);
              ctx.restore();
            }
          }
          const diagrams = ${JSON.stringify(blocks.map(b => b.diagram))};
          diagrams.forEach((diag, idx) => {
            if (!diag) return;
            const container = document.getElementById('diagram-' + idx);
            if (!container) return;
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 200;
            container.appendChild(canvas);
            drawDiagram(canvas, diag);
          });
        </script>
      </body>
      </html>
      `
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.print()
      setExporting(false)
    }, 100)
  }

  return (
    <div className="relative">
      <div className="flex justify-end mb-4">
        <button
          onClick={exportTraining}
          disabled={exporting}
          className="bg-handball-accent text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {exporting ? 'Generant...' : '📄 Exportar entrenament (PDF)'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Columna esquerra: Pla de l'entrenament */}
        <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">Pla de la sessió</h3>
            {canEdit && (
              <button
                className="bg-handball-accent text-white px-2 py-1 rounded-md text-xs"
                onClick={addBlock}
              >
                + Bloc
              </button>
            )}
          </div>
          {blocks.length === 0 && (
            <div className="text-center py-6 text-handball-text3 text-sm">No hi ha cap bloc definit. Crea'n un!</div>
          )}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {blocks.map((blk, idx) => (
              <div key={idx} className="border border-handball-border rounded-lg p-2 relative">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{blk.title || `Bloc ${blk.order}`}</div>
                    <div className="text-xs text-handball-text3">Duració: {blk.duration || '—'}</div>
                    <div className="text-sm mt-1 whitespace-pre-wrap">{blk.description}</div>
                    {blk.diagram && (
                      <div className="mt-2 flex items-start gap-2">
                        <canvas
                          ref={el => { if (el) thumbnailRefs.current[idx] = el }}
                          width={100}
                          height={60}
                          className="border border-handball-border2 rounded bg-white"
                          style={{ width: '100px', height: '60px' }}
                        />
                        <span className="text-xs text-handball-text3">
                          Diagrama {blk.diagram.type === 'full' ? 'complet' : blk.diagram.type === 'halfAttack' ? 'mitja atac' : 'mitja defensa'} · {blk.diagram.elements.length} elements
                        </span>
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 ml-2">
                      <button onClick={() => moveBlockUp(idx)} className="text-handball-text2 hover:text-handball-text">▲</button>
                      <button onClick={() => moveBlockDown(idx)} className="text-handball-text2 hover:text-handball-text">▼</button>
                      <button onClick={() => editBlockHandler(blk, idx)} className="text-handball-accent">✏️</button>
                      <button onClick={() => deleteBlock(idx)} className="text-handball-red">🗑️</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna dreta: Assistència i accions de porters */}
        <div className="space-y-6">
          <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
            <h3 className="font-semibold text-lg mb-2">Assistència</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {players.map(p => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={attendance[p.id] !== false}
                    onChange={() => toggleAttendance(p.id)}
                    disabled={!canEdit}
                  />
                  <span>{p.name} {p.pos === 'PO' && '(POR)'}</span>
                </label>
              ))}
            </div>
            {!canEdit && <p className="text-xs text-handball-text3 mt-2">Sense permisos per modificar l'assistència</p>}
          </div>

          <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
            <h3 className="font-semibold text-lg mb-2">Accions de porter</h3>
            <div className="mb-3">
              <div className="font-medium text-sm mb-1">Selecciona porter</div>
              <div className="flex flex-wrap gap-2">
                {goalkeepers.map(p => (
                  <button
                    key={p.id}
                    className={`px-3 py-1 rounded-md text-sm ${selectedPlayer === p.id ? 'bg-handball-accent text-white' : 'bg-handball-bg3 border border-handball-border2'} ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => canEdit && setSelectedPlayer(p.id)}
                    disabled={!canEdit}
                  >
                    #{p.number} {p.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {canEdit && (
              <>
                <div className="mb-3">
                  <div className="font-medium text-sm mb-1">Registrar</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="bg-handball-green/15 text-handball-green border border-handball-green/30 py-2 rounded-lg" onClick={() => addEvent('save', 'Parada')}>🧤 Parada</button>
                    <button className="bg-handball-red/15 text-handball-red border border-handball-red/30 py-2 rounded-lg" onClick={() => addEvent('conceded', 'Gol rebut')}>❗ Gol rebut</button>
                    <button className="bg-handball-amber/15 text-handball-amber border border-handball-amber/30 py-2 rounded-lg" onClick={() => addEvent('foul', 'Falta')}>⚠️ Falta</button>
                    <button className="bg-handball-purple/15 text-handball-purple border border-handball-purple/30 py-2 rounded-lg" onClick={() => addEvent('2min', '2 minuts')}>⏱️ 2 min</button>
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="font-medium text-sm mb-1">Accions registrades</div>
              <div className="max-h-40 overflow-y-auto border border-handball-border rounded-lg p-2">
                {events.length === 0 && <div className="text-center text-handball-text3 py-2">Sense accions</div>}
                {events.map(ev => (
                  <div key={ev.id} className="flex justify-between py-1 border-b border-handball-border last:border-0 text-sm">
                    <span><b>{ev.playerName}</b> — {ev.label}</span>
                    {canEdit && (
                      <button className="text-red-400 text-xs" onClick={() => setEvents(prev => prev.filter(e => e.id !== ev.id))}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {!canEdit && <p className="text-xs text-handball-text3 mt-2">Sense permisos per registrar accions</p>}
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="mt-6">
          <button
            className="w-full bg-handball-green text-white py-2 rounded-lg font-medium disabled:opacity-50"
            onClick={saveTraining}
            disabled={saving}
          >
            {saving ? 'Guardant...' : 'Guardar entrenament'}
          </button>
        </div>
      )}

      {/* Modal per editar/afegir bloc (només si canEdit) */}
      {showBlockModal && canEdit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-handball-bg2 border border-handball-border2 rounded-2xl w-[90%] max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-handball-border p-4">
              <h3 className="font-semibold">{editBlock?.originalIndex !== undefined ? 'Editar bloc' : 'Nou bloc'}</h3>
              <button className="text-handball-text2 hover:text-handball-text" onClick={() => setShowBlockModal(false)}>✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-handball-text3 mb-1">Títol</label>
                <input
                  type="text"
                  className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2"
                  value={editBlock?.title || ''}
                  onChange={e => setEditBlock({ ...editBlock, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-handball-text3 mb-1">Duració</label>
                <input
                  type="text"
                  className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2"
                  value={editBlock?.duration || ''}
                  onChange={e => setEditBlock({ ...editBlock, duration: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-handball-text3 mb-1">Descripció</label>
                <textarea
                  rows={3}
                  className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2"
                  value={editBlock?.description || ''}
                  onChange={e => setEditBlock({ ...editBlock, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-handball-text3 mb-1">Diagrama tàctic</label>
                <button
                  type="button"
                  className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2 text-sm"
                  onClick={() => {
                    setCurrentBlockIndex(editBlock?.originalIndex !== undefined ? editBlock.originalIndex : blocks.length)
                    setCanvasOpen(true)
                  }}
                >
                  {editBlock?.diagram ? 'Editar diagrama' : 'Crear diagrama'}
                </button>
                {editBlock?.diagram && (
                  <div className="mt-1 text-xs text-handball-text3">
                    {editBlock.diagram.type === 'full' ? 'Complet' : editBlock.diagram.type === 'halfAttack' ? 'Mitja (atac)' : 'Mitja (defensa)'} · {editBlock.diagram.elements.length} elements
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-handball-border p-4 flex justify-end gap-3">
              <button className="bg-handball-bg3 border border-handball-border2 px-4 py-2 rounded-lg" onClick={() => setShowBlockModal(false)}>Cancel·lar</button>
              <button className="bg-handball-accent text-white px-4 py-2 rounded-lg" onClick={saveBlock}>Guardar bloc</button>
            </div>
          </div>
        </div>
      )}

      {/* Editor de canvas */}
      {canvasOpen && canEdit && (
        <TrainingCanvas
          diagram={editBlock?.diagram}
          onSave={(data) => {
            setEditBlock({ ...editBlock, diagram: data })
            setCanvasOpen(false)
          }}
          onClose={() => setCanvasOpen(false)}
        />
      )}
    </div>
  )
}