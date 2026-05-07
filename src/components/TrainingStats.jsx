import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function TrainingStats({ teamId }) {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!teamId) return
      const { data, error } = await supabase
        .from('training_events')
        .select(`
          player_id,
          event_type,
          quantity,
          players (name, number)
        `)
        .eq('trainings.team_id', teamId)
      if (error) console.error(error)
      else {
        const map = new Map()
        for (const ev of data) {
          const playerId = ev.player_id
          const playerName = ev.players.name
          const playerNumber = ev.players.number
          if (!map.has(playerId)) {
            map.set(playerId, { name: playerName, number: playerNumber, saves: 0, goals: 0, fouls: 0, cards: 0 })
          }
          const entry = map.get(playerId)
          if (ev.event_type === 'save') entry.saves += ev.quantity
          else if (ev.event_type === 'conceded') entry.goals += ev.quantity
          else if (ev.event_type === 'foul') entry.fouls += ev.quantity
          else if (ev.event_type === '2min') entry.cards += ev.quantity
        }
        setStats(Array.from(map.values()))
      }
      setLoading(false)
    }
    fetchStats()
  }, [teamId])

  if (loading) return <div>Carregant estadístiques...</div>

  return (
    <div className="bg-handball-bg2 border border-handball-border rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-handball-text3 text-xs uppercase border-b border-handball-border">
          <tr>
            <th className="p-3 text-left">#</th><th className="p-3 text-left">Porter</th>
            <th className="p-3 text-center">Parades</th><th className="p-3 text-center">Gols rebuts</th>
            <th className="p-3 text-center">Faltes</th><th className="p-3 text-center">Targetes</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(p => (
            <tr key={p.number} className="border-b border-handball-border last:border-0">
              <td className="p-3 font-mono">#{p.number}</td><td className="p-3 font-medium">{p.name}</td>
              <td className="p-3 text-center font-mono text-handball-accent">{p.saves}</td>
              <td className="p-3 text-center font-mono text-handball-red">{p.goals}</td>
              <td className="p-3 text-center font-mono text-handball-amber">{p.fouls}</td>
              <td className="p-3 text-center font-mono text-handball-purple">{p.cards}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}