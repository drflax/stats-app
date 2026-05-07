import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Matches({ team, matches, onUpdateMatch, showToast, user, userRole }) {
  const [editingMatch, setEditingMatch] = useState(null)
  const [form, setForm] = useState({
    rival: '',
    location: 'home',
    date: '',
    venue: '',
    round: '',
    result_home: '',
    result_away: '',
  })

  const canEdit = user && (userRole === 'entrenador' || userRole === 'segon_entrenador')
  const canDelete = user && userRole === 'entrenador'

  const openEditModal = (match) => {
    setEditingMatch(match)
    setForm({
      rival: match.rival || '',
      location: match.location || 'home',
      date: match.date || '',
      venue: match.venue || '',
      round: match.round?.toString() || '',
      result_home: match.result_home?.toString() || '',
      result_away: match.result_away?.toString() || '',
    })
  }

  const saveChanges = async () => {
    if (!editingMatch) return

    const updates = {
      rival: form.rival,
      location: form.location,
      date: form.date || null,
      venue: form.venue,
      round: form.round ? parseInt(form.round) : null,
    }

    if (!editingMatch.done) {
      const home = form.result_home ? parseInt(form.result_home) : null
      const away = form.result_away ? parseInt(form.result_away) : null
      updates.result_home = home
      updates.result_away = away
      updates.done = (home !== null && away !== null)
    }

    const { error } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', editingMatch.id)

    if (error) {
      showToast('Error en guardar els canvis', 'error')
    } else {
      showToast('Partit actualitzat correctament', 'success')
      setEditingMatch(null)
      if (onUpdateMatch) onUpdateMatch()
    }
  }

  const getResultInfo = (match) => {
    if (!match.done || match.result_home === null || match.result_away === null) {
      return { text: null, class: null, badgeText: null, badgeClass: null }
    }

    const isHome = match.location === 'home'
    const myScore = isHome ? match.result_home : match.result_away
    const opponentScore = isHome ? match.result_away : match.result_home

    let resultClass = ''
    let badgeText = ''
    let badgeClass = ''

    if (myScore > opponentScore) {
      resultClass = 'text-handball-green'
      badgeText = 'Victòria'
      badgeClass = 'bg-handball-green/15 text-handball-green'
    } else if (myScore < opponentScore) {
      resultClass = 'text-handball-red'
      badgeText = 'Derrota'
      badgeClass = 'bg-handball-red/15 text-handball-red'
    } else {
      resultClass = 'text-handball-amber'
      badgeText = 'Empat'
      badgeClass = 'bg-handball-amber/15 text-handball-amber'
    }

    const displayScore = `${match.result_home} – ${match.result_away}`
    return { text: displayScore, class: resultClass, badgeText, badgeClass }
  }

  return (
    <div className="space-y-3">
      {matches.map(m => {
        const isHome = m.location === 'home'
        const date = m.date ? new Date(m.date) : null
        const result = getResultInfo(m)

        return (
          <div
            key={m.id}
            className={`bg-handball-bg2 border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 ${!m.done ? 'border-handball-accent/30 bg-handball-accent/5' : 'border-handball-border'}`}
          >
            <div className="text-center min-w-[48px]">
              {date ? (
                <>
                  <div className="text-xl font-mono font-bold">{date.getDate()}</div>
                  <div className="text-xs text-handball-text3 uppercase">
                    {date.toLocaleString('ca-ES', { month: 'short' })}
                  </div>
                </>
              ) : (
                <div className="text-xs text-handball-text3">—</div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-1 text-sm font-medium">
                <span>{isHome ? team.name : m.rival}</span>
                <span className="text-handball-text3">vs</span>
                <span>{isHome ? m.rival : team.name}</span>
              </div>
              <div className="text-xs text-handball-text3">
                J{m.round} · {isHome ? '🏠 Casa' : '✈️ Fora'} ·{' '}
                {date ? date.toLocaleDateString('ca-ES', { weekday: 'long' }) : 'Data pendent'} · {m.venue}
              </div>
            </div>

            {result.text ? (
              <div className={`font-mono font-bold text-base min-w-[70px] text-center ${result.class}`}>
                {result.text}
              </div>
            ) : (
              <span className="text-xs text-handball-text3 italic">Pendent</span>
            )}

            {canEdit && (
              <div className="flex gap-2 self-end sm:self-center">
                <button
                  className="bg-handball-bg3 border border-handball-border2 px-3 py-1.5 rounded-lg text-sm"
                  onClick={() => openEditModal(m)}
                >
                  Editar
                </button>
                {!m.done && (
                  <button
                    className="bg-handball-accent/20 text-handball-accent border border-handball-accent/30 px-3 py-1.5 rounded-lg text-sm"
                    onClick={() => openEditModal(m)}
                  >
                    + Resultat
                  </button>
                )}
              </div>
            )}

            {m.done && result.badgeText && (
              <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${result.badgeClass}`}>
                {result.badgeText}
              </span>
            )}
          </div>
        )
      })}

      {editingMatch && canEdit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-handball-bg2 border border-handball-border2 rounded-2xl w-[90%] max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-handball-border p-4 sticky top-0 bg-handball-bg2">
              <h3 className="font-semibold">
                {editingMatch.done ? 'Editar partit' : 'Afegir resultat / Editar partit'}
              </h3>
              <button className="text-handball-text2 hover:text-handball-text" onClick={() => setEditingMatch(null)}>✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-center mb-2 text-sm font-medium">
                {editingMatch.location === 'home' ? team.name : editingMatch.rival} vs{' '}
                {editingMatch.location === 'home' ? editingMatch.rival : team.name}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-handball-text3 mb-1">Rival</label>
                  <input
                    type="text"
                    className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2 text-sm"
                    value={form.rival}
                    onChange={e => setForm({ ...form, rival: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-handball-text3 mb-1">Local / Fora</label>
                  <select
                    className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2 text-sm"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                  >
                    <option value="home">Casa</option>
                    <option value="away">Fora</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-handball-text3 mb-1">Data</label>
                  <input
                    type="date"
                    className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2 text-sm"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-handball-text3 mb-1">Jornada</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2 text-sm"
                    value={form.round}
                    onChange={e => setForm({ ...form, round: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-handball-text3 mb-1">Pavelló</label>
                <input
                  type="text"
                  className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2 text-sm"
                  value={form.venue}
                  onChange={e => setForm({ ...form, venue: e.target.value })}
                />
              </div>

              <div className="border-t border-handball-border pt-3 mt-2">
                <label className="block text-xs text-handball-text3 mb-2">Resultat</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-handball-text3 mb-1">Local</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2 text-sm"
                      value={form.result_home}
                      onChange={e => setForm({ ...form, result_home: e.target.value })}
                      disabled={editingMatch.done}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-handball-text3 mb-1">Visitant</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2 text-sm"
                      value={form.result_away}
                      onChange={e => setForm({ ...form, result_away: e.target.value })}
                      disabled={editingMatch.done}
                    />
                  </div>
                </div>
                {editingMatch.done && (
                  <p className="text-xs text-handball-text3 mt-2">El resultat no es pot modificar per a partits ja finalitzats.</p>
                )}
              </div>
            </div>
            <div className="border-t border-handball-border p-4 flex justify-end gap-3 sticky bottom-0 bg-handball-bg2">
              <button className="bg-handball-bg3 border border-handball-border2 px-4 py-2 rounded-lg" onClick={() => setEditingMatch(null)}>Cancel·lar</button>
              <button className="bg-handball-accent text-white px-4 py-2 rounded-lg" onClick={saveChanges}>Guardar canvis</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}