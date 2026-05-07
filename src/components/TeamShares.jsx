import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function TeamShares({ team, user }) {
  const [shares, setShares] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('view')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const fetchShares = async () => {
    if (!team || !user) return
    setLoading(true)

    const { data, error } = await supabase
      .from('team_shares')
      .select(`
        id,
        user_id,
        role,
        created_at,
        profiles (
          email
        )
      `)
      .eq('team_id', team.id)

    if (error) {
      console.error('Error carregant permisos:', error)
    } else {
      setShares(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchShares()
  }, [team])

  const addShare = async () => {
    if (!email) return
    setAdding(true)
    try {
      const { data, error } = await supabase.functions.invoke('team-share', {
        body: { email, team_id: team.id, role }
      })
      if (error) throw new Error(error.message)
      if (data.error) throw new Error(data.error)
      setEmail('')
      await fetchShares()
    } catch (err) {
      alert('Error compartint: ' + err.message)
    } finally {
      setAdding(false)
    }
  }

  const removeShare = async (shareId) => {
    await supabase.from('team_shares').delete().eq('id', shareId)
    fetchShares()
  }

  if (loading) return <div className="text-sm text-handball-text2">Carregant permisos...</div>

  return (
    <div className="mt-4 border-t border-handball-border pt-3">
      <h4 className="font-medium text-sm mb-2">Compartir equip</h4>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="email"
          placeholder="correu@exemple.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="flex-1 min-w-[180px] bg-handball-bg3 border border-handball-border2 rounded-lg p-2 text-sm"
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="bg-handball-bg3 border border-handball-border2 rounded-lg p-2 text-sm"
          >
          <option value="segon_entrenador">📋 Segon entrenador</option>
          <option value="jugador">👤 Jugador</option>
        </select>
        <button
          onClick={addShare}
          disabled={adding}
          className="bg-handball-accent text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {adding ? 'Compartint...' : '+ Compartir'}
        </button>
      </div>
      {shares.length === 0 && (
        <p className="text-xs text-handball-text3">No hi ha usuaris amb accés a aquest equip.</p>
      )}
      <div className="space-y-2 mt-2">
        {shares.map(s => (
          <div key={s.id} className="flex justify-between items-center bg-handball-bg3 p-2 rounded-lg text-sm">
            <span className="truncate">
              {s.profiles?.email ?? s.user_id.substring(0, 8) + '...'}
            </span>
            <span className="text-handball-accent font-mono text-xs">
              {s.role === 'segon_entrenador' ? '📋 Segon entrenador' : '👤 Jugador'}
            </span>
            <button
              onClick={() => removeShare(s.id)}
              className="text-handball-red hover:underline"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}