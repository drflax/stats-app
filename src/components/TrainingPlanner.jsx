import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import TrainingCanvas from './TrainingCanvas'

export default function TrainingPlanner({ training, onUpdate, user }) {
  const [blocks, setBlocks] = useState(training?.plan || [])
  const [editBlock, setEditBlock] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showCanvas, setShowCanvas] = useState(false)
  const [currentBlockIndex, setCurrentBlockIndex] = useState(null)

  const savePlan = async () => {
    const { error } = await supabase
      .from('trainings')
      .update({ plan: blocks })
      .eq('id', training.id)
    if (error) {
      alert('Error guardant el pla')
    } else {
      alert('Pla guardat!')
      if (onUpdate) onUpdate()
    }
  }

  const addBlock = () => {
    const newBlock = {
      order: blocks.length + 1,
      title: '',
      duration: '',
      description: '',
      diagram: null,
    }
    setEditBlock(newBlock)
    setShowModal(true)
  }

  const editBlockHandler = (block, idx) => {
    setEditBlock({ ...block, originalIndex: idx })
    setShowModal(true)
  }

  const saveBlock = () => {
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
    setShowModal(false)
    setEditBlock(null)
  }

  const deleteBlock = (idx) => {
    if (confirm('Eliminar aquest bloc?')) {
      const newBlocks = blocks.filter((_, i) => i !== idx)
      setBlocks(newBlocks.map((b, i) => ({ ...b, order: i + 1 })))
    }
  }

  const moveUp = (idx) => {
    if (idx === 0) return
    const newBlocks = [...blocks]
    ;[newBlocks[idx - 1], newBlocks[idx]] = [newBlocks[idx], newBlocks[idx - 1]]
    newBlocks.forEach((b, i) => (b.order = i + 1))
    setBlocks(newBlocks)
  }

  const moveDown = (idx) => {
    if (idx === blocks.length - 1) return
    const newBlocks = [...blocks]
    ;[newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]]
    newBlocks.forEach((b, i) => (b.order = i + 1))
    setBlocks(newBlocks)
  }

  const openCanvas = (index) => {
    setCurrentBlockIndex(index)
    setShowCanvas(true)
  }

  const saveDiagram = (dataURL) => {
    if (currentBlockIndex !== null) {
      const newBlocks = [...blocks]
      newBlocks[currentBlockIndex].diagram = dataURL
      setBlocks(newBlocks)
      // Si el bloc s'està editant, actualitzar també editBlock
      if (editBlock && editBlock.originalIndex === currentBlockIndex) {
        setEditBlock({ ...editBlock, diagram: dataURL })
      }
    }
    setShowCanvas(false)
    setCurrentBlockIndex(null)
  }

  return (
    <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Preparació de la sessió</h3>
        <button className="bg-handball-accent text-white px-3 py-1 rounded-md text-sm" onClick={savePlan}>
          Guardar canvis
        </button>
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-8 text-handball-text3">No hi ha cap bloc definit. Crea'n un!</div>
      )}

      <div className="space-y-3">
        {blocks.map((blk, idx) => (
          <div key={idx} className="border border-handball-border rounded-lg p-3 relative">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{blk.title || `Bloc ${blk.order}`}</div>
                <div className="text-xs text-handball-text3">Duració: {blk.duration || '—'}</div>
                <div className="text-sm mt-1 whitespace-pre-wrap">{blk.description}</div>
                {blk.diagram && (
                  <div className="mt-2">
                    <img src={blk.diagram} alt="diagrama" className="max-h-32 border border-handball-border rounded" />
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => moveUp(idx)} className="text-handball-text2 hover:text-handball-text">▲</button>
                <button onClick={() => moveDown(idx)} className="text-handball-text2 hover:text-handball-text">▼</button>
                <button onClick={() => editBlockHandler(blk, idx)} className="text-handball-accent">✏️</button>
                <button onClick={() => deleteBlock(idx)} className="text-handball-red">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full bg-handball-bg3 border border-handball-border2 py-2 rounded-lg text-sm" onClick={addBlock}>
        + Afegir bloc
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-handball-bg2 border border-handball-border2 rounded-2xl w-[90%] max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-handball-border p-4">
              <h3 className="font-semibold">{editBlock?.originalIndex !== undefined ? 'Editar bloc' : 'Nou bloc'}</h3>
              <button className="text-handball-text2 hover:text-handball-text" onClick={() => setShowModal(false)}>✕</button>
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
                <label className="block text-xs text-handball-text3 mb-1">Duració (ex: 0:10, 15 min)</label>
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
                  rows={4}
                  className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2"
                  value={editBlock?.description || ''}
                  onChange={e => setEditBlock({ ...editBlock, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-handball-text3 mb-1">Diagrama tàctic</label>
                <button
                  type="button"
                  className="bg-handball-bg3 border border-handball-border2 rounded-lg p-2 text-sm w-full"
                  onClick={() => openCanvas(editBlock?.originalIndex !== undefined ? editBlock.originalIndex : blocks.length)}
                >
                  {editBlock?.diagram ? 'Editar diagrama' : 'Dibuixa'}
                </button>
                {editBlock?.diagram && (
                  <img src={editBlock.diagram} alt="diagram" className="mt-2 max-h-32 border border-handball-border rounded w-full object-contain" />
                )}
              </div>
            </div>
            <div className="border-t border-handball-border p-4 flex justify-end gap-3">
              <button className="bg-handball-bg3 border border-handball-border2 px-4 py-2 rounded-lg" onClick={() => setShowModal(false)}>Cancel·lar</button>
              <button className="bg-handball-accent text-white px-4 py-2 rounded-lg" onClick={saveBlock}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showCanvas && (
        <TrainingCanvas
          diagram={editBlock?.originalIndex !== undefined && blocks[currentBlockIndex]?.diagram}
          onSave={saveDiagram}
          onClose={() => setShowCanvas(false)}
        />
      )}
    </div>
  )
}