import { useState } from 'react'
import { supabase } from '../lib/supabase'

const POSITIONS = ['PO', 'EI', 'ED', 'CI', 'CD', 'CE', 'LI', 'LD', 'PI']
const POS_LABELS = {
  PO: 'Porter', EI: 'Extrem Esq.', ED: 'Extrem Dret', CI: 'Central Esq.',
  CD: 'Central Dret', CE: 'Central', LI: 'Lateral Esq.', LD: 'Lateral Dret', PI: 'Pivot',
}

export default function Players({ team, players, onUpdatePlayer, showToast, user, userRole }) {
  const [view, setView] = useState('list')
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editPlayer, setEditPlayer] = useState(null)
  const [newPlayer, setNewPlayer] = useState({ name: '', number: '', pos: 'CE', dob: '' })

  const selectedPlayer = players.find(p => p.id === selectedPlayerId)
  const canEdit = user && (userRole === 'entrenador' || userRole === 'segon_entrenador')
  const canDelete = user && userRole === 'entrenador'

  const efficiency = (goles, lanz) => lanz > 0 ? Math.round((goles / lanz) * 100) : 0
  const savePercent = (parades, rebuts) => (parades + rebuts) > 0 ? Math.round((parades / (parades + rebuts)) * 100) : 0

  const addPlayer = async () => {
    if (!newPlayer.name || !newPlayer.number) {
      showToast('Nom i dorsal obligatoris', 'error')
      return
    }
    const playerToInsert = {
      team_id: team.id,
      name: newPlayer.name,
      number: parseInt(newPlayer.number),
      pos: newPlayer.pos,
      dob: newPlayer.dob || null,
      official_goles: 0,
      goles: 0,
      lanz_total: 0,
      lanz_fuera: 0,
      lanz_bloq: 0,
      faltes_com: 0,
      faltes_reb: 0,
      tarjetes_2min: 0,
      tarjetes_a: 0,
      tarjetes_r: 0,
      parades: 0,
      gols_rebuts: 0,
    }
    const { error } = await supabase.from('players').insert(playerToInsert)
    if (error) {
      showToast('Error en afegir jugador', 'error')
    } else {
      showToast(`${newPlayer.name} afegit`, 'success')
      setShowAdd(false)
      setNewPlayer({ name: '', number: '', pos: 'CE', dob: '' })
      if (onUpdatePlayer) onUpdatePlayer()
    }
  }

  const updatePlayer = async () => {
    if (!editPlayer) return
    const { error } = await supabase
      .from('players')
      .update({
        name: editPlayer.name,
        number: editPlayer.number,
        pos: editPlayer.pos,
        dob: editPlayer.dob || null,
        goles: editPlayer.goles,
        lanz_total: editPlayer.lanz_total,
        lanz_fuera: editPlayer.lanz_fuera,
        lanz_bloq: editPlayer.lanz_bloq,
        faltes_com: editPlayer.faltes_com,
        faltes_reb: editPlayer.faltes_reb,
        tarjetes_2min: editPlayer.tarjetes_2min,
        tarjetes_a: editPlayer.tarjetes_a,
        tarjetes_r: editPlayer.tarjetes_r,
        parades: editPlayer.parades,
        gols_rebuts: editPlayer.gols_rebuts,
      })
      .eq('id', editPlayer.id)
    if (error) {
      showToast('Error en actualitzar jugador', 'error')
    } else {
      showToast(`${editPlayer.name} actualitzat`, 'success')
      setShowEdit(false)
      setEditPlayer(null)
      if (onUpdatePlayer) onUpdatePlayer()
    }
  }

  const deletePlayer = async (playerId, playerName) => {
    if (!confirm(`Segur que vols eliminar ${playerName}?`)) return
    const { error } = await supabase.from('players').delete().eq('id', playerId)
    if (error) {
      showToast('Error en eliminar jugador', 'error')
    } else {
      showToast(`${playerName} eliminat`, 'success')
      setView('list')
      setSelectedPlayerId(null)
      if (onUpdatePlayer) onUpdatePlayer()
    }
  }

  const openEditModal = (player) => {
    setEditPlayer({ ...player })
    setShowEdit(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1 bg-handball-bg3 p-1 rounded-lg">
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${view === 'list' ? 'bg-handball-bg2 text-handball-text shadow' : 'text-handball-text2'}`}
            onClick={() => { setView('list'); setSelectedPlayerId(null) }}
          >
            Llista
          </button>
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${view === 'detail' ? 'bg-handball-bg2 text-handball-text shadow' : 'text-handball-text2'}`}
            onClick={() => view === 'detail' || selectedPlayerId ? setView('detail') : null}
          >
            Detall
          </button>
        </div>
        {canEdit && (
          <button className="bg-handball-accent text-white px-4 py-2 rounded-lg text-sm" onClick={() => setShowAdd(true)}>
            + Jugador
          </button>
        )}
      </div>

      {view === 'list' && (
        <div className="bg-handball-bg2 border border-handball-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-handball-text3 text-xs uppercase border-b border-handball-border">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Jugador</th>
                <th className="p-3 text-left">Posició</th>
                <th className="p-3 text-left">Gols FCH</th>
                <th className="p-3 text-left">Gols app</th>
                <th className="p-3 text-left">Eff%</th>
                <th className="p-3 text-left">Faltes</th>
                <th className="p-3 text-left">2min</th>
                <th className="p-3 text-left">Parades%</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => (
                <tr
                  key={p.id}
                  className="border-b border-handball-border last:border-0 cursor-pointer hover:bg-white/5"
                  onClick={() => { setSelectedPlayerId(p.id); setView('detail') }}
                >
                  <td className="p-3 font-mono font-bold text-handball-accent">#{p.number}</td>
                  <td className="p-3">
                    <div className="font-medium">{p.name}</div>
                    {p.dob && <div className="text-xs text-handball-text3">{new Date(p.dob).toLocaleDateString('ca-ES')}</div>}
                  </td>
                  <td className="p-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-handball-accent/15 text-handball-accent">
                      {p.pos} — {POS_LABELS[p.pos]}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-semibold text-handball-green">{p.official_goles || 0}</td>
                  <td className="p-3 font-mono">{p.goles}</td>
                  <td className="p-3 font-mono">{p.pos !== 'PO' ? `${efficiency(p.goles, p.lanz_total)}%` : '—'}</td>
                  <td className="p-3 font-mono">{p.faltes_com}</td>
                  <td className="p-3 font-mono text-handball-purple">{p.tarjetes_2min}</td>
                  <td className="p-3 font-mono">{p.pos === 'PO' ? `${savePercent(p.parades, p.gols_rebuts)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'detail' && selectedPlayer && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <button className="bg-handball-bg3 border border-handball-border2 px-4 py-1.5 rounded-lg text-sm" onClick={() => setView('list')}>
              ← Tornar
            </button>
            <div className="flex gap-2">
              {canEdit && (
                <button
                  className="bg-handball-accent text-white px-4 py-1.5 rounded-lg text-sm"
                  onClick={() => openEditModal(selectedPlayer)}
                >
                  Editar
                </button>
              )}
              {canDelete && (
                <button
                  className="bg-handball-red/20 text-handball-red border border-handball-red/30 px-4 py-1.5 rounded-lg text-sm"
                  onClick={() => deletePlayer(selectedPlayer.id, selectedPlayer.name)}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
          <div className="bg-handball-bg2 border border-handball-border rounded-xl p-5 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-handball-bg4 flex items-center justify-center text-2xl font-mono font-bold text-handball-accent">
                {selectedPlayer.number}
              </div>
              <div>
                <div className="text-xl font-bold">{selectedPlayer.name}</div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-handball-accent/15 text-handball-accent">
                    {selectedPlayer.pos} — {POS_LABELS[selectedPlayer.pos]}
                  </span>
                  {selectedPlayer.dob && (
                    <span className="text-xs text-handball-text3">
                      Naix. {new Date(selectedPlayer.dob).toLocaleDateString('ca-ES')}
                    </span>
                  )}
                  <span className="text-xs text-handball-green">
                    Gols oficials: {selectedPlayer.official_goles || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {selectedPlayer.pos === 'PO' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
                <div className="text-xs uppercase text-handball-text3">Parades</div>
                <div className="text-2xl font-mono font-semibold text-handball-accent">{selectedPlayer.parades}</div>
              </div>
              <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
                <div className="text-xs uppercase text-handball-text3">% Atur</div>
                <div className="text-2xl font-mono font-semibold text-handball-green">{savePercent(selectedPlayer.parades, selectedPlayer.gols_rebuts)}%</div>
                <div className="text-xs text-handball-text3">{selectedPlayer.gols_rebuts} gols rebuts</div>
              </div>
              <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
                <div className="text-xs uppercase text-handball-text3">Faltes com.</div>
                <div className="text-2xl font-mono font-semibold text-handball-amber">{selectedPlayer.faltes_com}</div>
              </div>
              <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
                <div className="text-xs uppercase text-handball-text3">2 minuts</div>
                <div className="text-2xl font-mono font-semibold text-handball-purple">{selectedPlayer.tarjetes_2min}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
                <div className="text-xs uppercase text-handball-text3">Gols app</div>
                <div className="text-2xl font-mono font-semibold text-handball-green">{selectedPlayer.goles}</div>
              </div>
              <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
                <div className="text-xs uppercase text-handball-text3">Eficàcia</div>
                <div className="text-2xl font-mono font-semibold text-handball-accent">{efficiency(selectedPlayer.goles, selectedPlayer.lanz_total)}%</div>
                <div className="text-xs text-handball-text3">{selectedPlayer.lanz_total} llançaments</div>
              </div>
              <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
                <div className="text-xs uppercase text-handball-text3">Faltes com.</div>
                <div className="text-2xl font-mono font-semibold text-handball-amber">{selectedPlayer.faltes_com}</div>
              </div>
              <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
                <div className="text-xs uppercase text-handball-text3">2 minuts</div>
                <div className="text-2xl font-mono font-semibold text-handball-purple">{selectedPlayer.tarjetes_2min}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {showAdd && canEdit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-handball-bg2 border border-handball-border2 rounded-2xl max-w-md w-full">
            <div className="flex justify-between items-center border-b border-handball-border p-5">
              <h3 className="font-semibold">Afegir jugador</h3>
              <button className="text-handball-text2 hover:text-handball-text" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-handball-text3 mb-1">Nom complet *</label>
                <input
                  className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2"
                  value={newPlayer.name}
                  onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-handball-text3 mb-1">Dorsal *</label>
                  <input
                    type="number"
                    className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2"
                    value={newPlayer.number}
                    onChange={e => setNewPlayer({ ...newPlayer, number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-handball-text3 mb-1">Posició</label>
                  <select
                    className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2"
                    value={newPlayer.pos}
                    onChange={e => setNewPlayer({ ...newPlayer, pos: e.target.value })}
                  >
                    {POSITIONS.map(p => (
                      <option key={p} value={p}>{p} — {POS_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-handball-text3 mb-1">Data de naixement</label>
                <input
                  type="date"
                  className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2"
                  value={newPlayer.dob}
                  onChange={e => setNewPlayer({ ...newPlayer, dob: e.target.value })}
                />
              </div>
            </div>
            <div className="border-t border-handball-border p-5 flex justify-end gap-3">
              <button className="bg-handball-bg3 border border-handball-border2 px-4 py-2 rounded-lg" onClick={() => setShowAdd(false)}>Cancel·lar</button>
              <button className="bg-handball-accent text-white px-4 py-2 rounded-lg" onClick={addPlayer}>Afegir</button>
            </div>
          </div>
        </div>
      )}

      {showEdit && editPlayer && canEdit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-handball-bg2 border border-handball-border2 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-handball-border p-5 sticky top-0 bg-handball-bg2">
              <h3 className="font-semibold">Editar jugador</h3>
              <button className="text-handball-text2 hover:text-handball-text" onClick={() => setShowEdit(false)}>✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-handball-text3 mb-1">Nom</label>
                  <input
                    className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2"
                    value={editPlayer.name}
                    onChange={e => setEditPlayer({ ...editPlayer, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-handball-text3 mb-1">Dorsal</label>
                  <input
                    type="number"
                    className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2"
                    value={editPlayer.number}
                    onChange={e => setEditPlayer({ ...editPlayer, number: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-handball-text3 mb-1">Posició</label>
                  <select
                    className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2"
                    value={editPlayer.pos}
                    onChange={e => setEditPlayer({ ...editPlayer, pos: e.target.value })}
                  >
                    {POSITIONS.map(p => (
                      <option key={p} value={p}>{p} — {POS_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-handball-text3 mb-1">Data naixement</label>
                  <input
                    type="date"
                    className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2"
                    value={editPlayer.dob || ''}
                    onChange={e => setEditPlayer({ ...editPlayer, dob: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t border-handball-border pt-4 mt-2">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold">Estadístiques (app)</h4>
                  <span className="text-xs text-handball-text3">Gols oficials FCH: {editPlayer.official_goles || 0}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Gols (app)', key: 'goles' },
                    { label: 'Llançaments totals', key: 'lanz_total' },
                    { label: 'Llançaments fora', key: 'lanz_fuera' },
                    { label: 'Llançaments blocats', key: 'lanz_bloq' },
                    { label: 'Faltes comeses', key: 'faltes_com' },
                    { label: 'Faltes rebudes', key: 'faltes_reb' },
                    { label: 'Targetes grogues', key: 'tarjetes_a' },
                    { label: 'Targetes 2 minuts', key: 'tarjetes_2min' },
                    { label: 'Targetes vermelles', key: 'tarjetes_r' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs text-handball-text3">{label}</label>
                      <input
                        type="number"
                        className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-1 text-sm"
                        value={editPlayer[key]}
                        onChange={e => setEditPlayer({ ...editPlayer, [key]: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  ))}
                  {editPlayer.pos === 'PO' && (
                    <>
                      <div>
                        <label className="block text-xs text-handball-text3">Parades</label>
                        <input
                          type="number"
                          className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-1 text-sm"
                          value={editPlayer.parades}
                          onChange={e => setEditPlayer({ ...editPlayer, parades: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-handball-text3">Gols rebuts</label>
                        <input
                          type="number"
                          className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-1 text-sm"
                          value={editPlayer.gols_rebuts}
                          onChange={e => setEditPlayer({ ...editPlayer, gols_rebuts: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-handball-border p-5 flex justify-end gap-3 sticky bottom-0 bg-handball-bg2">
              <button className="bg-handball-bg3 border border-handball-border2 px-4 py-2 rounded-lg" onClick={() => setShowEdit(false)}>Cancel·lar</button>
              <button className="bg-handball-accent text-white px-4 py-2 rounded-lg" onClick={updatePlayer}>Guardar canvis</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}