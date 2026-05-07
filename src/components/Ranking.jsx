import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Ranking({ teamId }) {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [competition, setCompetition] = useState('')

  useEffect(() => {
    async function fetchRanking() {
      if (!teamId) return
      setLoading(true)
      const { data, error } = await supabase
        .from('rankings')
        .select('data, competition')
        .eq('team_id', teamId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error carregant classificació:', error)
      } else if (data) {
        setRanking(data.data || [])
        setCompetition(data.competition || '')
      }
      setLoading(false)
    }
    fetchRanking()
  }, [teamId])

  if (loading) return <div className="text-center py-8 text-handball-text2">Carregant classificació...</div>
  if (!ranking.length) return <div className="text-center py-8 text-handball-text2">No hi ha dades de classificació disponibles</div>

  return (
    <div className="bg-handball-bg2 border border-handball-border rounded-xl overflow-hidden">
      <div className="border-b border-handball-border px-4 py-3">
        <div className="font-semibold text-sm md:text-base">Classificació</div>
        <div className="text-xs text-handball-text3">{competition}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-handball-text3 text-xs uppercase border-b border-handball-border">
             <tr>
              <th className="p-2 text-left">Pos</th>
              <th className="p-2 text-left">Equip</th>
              <th className="p-2 text-center">Pts</th>
              <th className="p-2 text-center">J</th>
              <th className="p-2 text-center">G</th>
              <th className="p-2 text-center">E</th>
              <th className="p-2 text-center">P</th>
              <th className="p-2 text-center">GF</th>
              <th className="p-2 text-center">GC</th>
              <th className="p-2 text-center">Dif</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b border-handball-border last:border-0 hover:bg-white/5 ${
                  row.mine ? 'bg-handball-accent/5' : ''
                }`}
              >
                <td className="p-2 font-mono font-semibold text-xs md:text-sm">{row.pos}</td>
                <td className="p-2 font-medium text-xs md:text-sm">
                  {row.name}
                  {row.mine && <span className="ml-2 text-[10px] text-handball-accent">(equip)</span>}
                </td>
                <td className="p-2 text-center font-mono font-semibold text-handball-accent text-xs md:text-sm">{row.pts}</td>
                <td className="p-2 text-center text-handball-text2 text-xs md:text-sm">{row.jug}</td>
                <td className="p-2 text-center text-handball-green text-xs md:text-sm">{row.gan}</td>
                <td className="p-2 text-center text-handball-text2 text-xs md:text-sm">{row.emp}</td>
                <td className="p-2 text-center text-handball-red text-xs md:text-sm">{row.per}</td>
                <td className="p-2 text-center font-mono text-xs md:text-sm">{row.gf}</td>
                <td className="p-2 text-center font-mono text-xs md:text-sm">{row.gc}</td>
                <td className={`p-2 text-center font-mono text-xs md:text-sm ${row.dif >= 0 ? 'text-handball-green' : 'text-handball-red'}`}>
                  {row.dif >= 0 ? `+${row.dif}` : row.dif}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}