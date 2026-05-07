import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function TrainingList({ teamId, onSelectTraining, user, userRole }) {
  const [trainings, setTrainings] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTraining, setEditingTraining] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', date: '', duration_minutes: '', notes: '' })
  const [showEditModal, setShowEditModal] = useState(false)

  const canEdit = user && (userRole === 'entrenador' || userRole === 'segon_entrenador')
  const canDelete = user && userRole === 'entrenador'

  const fetchTrainings = async () => {
    if (!teamId) return
    const { data, error } = await supabase
      .from('trainings')
      .select('*')
      .eq('team_id', teamId)
      .order('date', { ascending: false })
    if (error) console.error(error)
    else setTrainings(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchTrainings()
  }, [teamId])

  const createTraining = async () => {
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('trainings')
      .insert({
        team_id: teamId,
        title: `Entrenament ${new Date().toLocaleDateString('ca-ES')}`,
        date: today,
        duration_minutes: 90,
      })
      .select()
      .single()
    if (error) {
      alert('Error creant entrenament')
      return
    }
    onSelectTraining(data)
  }

  const openEditModal = (training) => {
    setEditingTraining(training)
    setEditForm({
      title: training.title || '',
      date: training.date || '',
      duration_minutes: training.duration_minutes?.toString() || '',
      notes: training.notes || '',
    })
    setShowEditModal(true)
  }

  const updateTraining = async () => {
    if (!editingTraining) return
    const updates = {
      title: editForm.title,
      date: editForm.date,
      duration_minutes: editForm.duration_minutes ? parseInt(editForm.duration_minutes) : null,
      notes: editForm.notes,
    }
    const { error } = await supabase
      .from('trainings')
      .update(updates)
      .eq('id', editingTraining.id)
    if (error) {
      alert('Error actualitzant entrenament')
    } else {
      setShowEditModal(false)
      setEditingTraining(null)
      fetchTrainings()
    }
  }

  const deleteTraining = async (trainingId) => {
    if (!confirm('Segur que vols eliminar aquest entrenament?')) return
    const { error } = await supabase
      .from('trainings')
      .delete()
      .eq('id', trainingId)
    if (error) {
      alert('Error eliminant entrenament')
    } else {
      fetchTrainings()
    }
  }

  if (loading) return <div>Carregant entrenaments...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Entrenaments</h2>
        {canEdit && (
          <button className="bg-handball-accent text-white px-4 py-2 rounded-lg text-sm" onClick={createTraining}>
            + Nou entrenament
          </button>
        )}
      </div>
      <div className="space-y-3">
        {trainings.map(t => (
          <div key={t.id} className="bg-handball-bg2 border border-handball-border rounded-xl p-3">
            <div className="flex justify-between items-start">
              <div className="flex-1 cursor-pointer hover:opacity-80" onClick={() => onSelectTraining(t)}>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-handball-text3">
                  {new Date(t.date).toLocaleDateString('ca-ES')} · {t.duration_minutes} min
                </div>
                {t.notes && <div className="text-xs text-handball-text2 mt-1">{t.notes}</div>}
                {t.plan && t.plan.length > 0 && (
                  <div className="text-xs text-handball-text3 mt-1">📋 {t.plan.length} blocs</div>
                )}
              </div>
              <div className="flex gap-2 ml-2">
                {canEdit && (
                  <button
                    onClick={() => openEditModal(t)}
                    className="text-handball-accent text-xs px-2 py-1 rounded hover:bg-handball-accent/10"
                  >
                    Editar
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => deleteTraining(t.id)}
                    className="text-handball-red text-xs px-2 py-1 rounded hover:bg-handball-red/10"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {trainings.length === 0 && (
          <div className="text-center text-handball-text3 py-8">No hi ha entrenaments. {canEdit ? "Crea'n un de nou." : ''}</div>
        )}
      </div>

      {showEditModal && canEdit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-handball-bg2 border border-handball-border2 rounded-2xl w-[90%] max-w-md">
            <div className="flex justify-between items-center border-b border-handball-border p-4">
              <h3 className="font-semibold">Editar entrenament</h3>
              <button className="text-handball-text2 hover:text-handball-text" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-handball-text3 mb-1">Títol</label>
                <input type="text" className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-handball-text3 mb-1">Data</label>
                <input type="date" className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-handball-text3 mb-1">Durada (minuts)</label>
                <input type="number" className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2" value={editForm.duration_minutes} onChange={e => setEditForm({ ...editForm, duration_minutes: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-handball-text3 mb-1">Notes</label>
                <textarea rows={3} className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
            </div>
            <div className="border-t border-handball-border p-4 flex justify-end gap-3">
              <button className="bg-handball-bg3 border border-handball-border2 px-4 py-2 rounded-lg" onClick={() => setShowEditModal(false)}>Cancel·lar</button>
              <button className="bg-handball-accent text-white px-4 py-2 rounded-lg" onClick={updateTraining}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}