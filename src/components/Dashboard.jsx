import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

function Dashboard({ team, players, matches }) {
  const [rankingData, setRankingData] = useState(null)
  const [loadingRanking, setLoadingRanking] = useState(true)

  // Carregar classificació oficial de l'equip (per obtenir estadístiques globals)
  useEffect(() => {
    async function fetchRanking() {
      if (!team?.id) return
      setLoadingRanking(true)
      const { data, error } = await supabase
        .from('rankings')
        .select('data')
        .eq('team_id', team.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (!error && data && data.data) {
        const teamEntry = data.data.find(entry => entry.name === team.name)
        setRankingData(teamEntry)
      } else {
        setRankingData(null)
      }
      setLoadingRanking(false)
    }
    fetchRanking()
  }, [team?.id, team?.name])

  // Partits finalitzats per al càlcul de resultats recents (no per a totals globals)
  const doneMatches = useMemo(() => matches.filter(m => m.done && m.result_home !== null), [matches])
  const recentMatches = [...doneMatches]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)

  const nextMatch = matches.find(m => !m.done)

  // Estadístiques de l'equip a partir de la classificació oficial (si existeix)
  const officialStats = rankingData
  const stats = officialStats || null

  // Càlcul de les estadístiques d'eficàcia i atur (sempre de l'app)
  const totalGoalsApp = players.reduce((sum, p) => sum + (p.goles || 0), 0)
  const totalShots = players.reduce((sum, p) => sum + (p.lanz_total || 0), 0)
  const efficiency = totalShots > 0 ? Math.round((totalGoalsApp / totalShots) * 100) : 0

  const goalkeepers = players.filter(p => p.pos === 'PO')
  const totalSaves = goalkeepers.reduce((sum, g) => sum + (g.parades || 0), 0)
  const totalConceded = goalkeepers.reduce((sum, g) => sum + (g.gols_rebuts || 0), 0)
  const savePercent = totalSaves + totalConceded > 0 ? Math.round((totalSaves / (totalSaves + totalConceded)) * 100) : 0

  // Màxims golejadors: mostrem tant gols oficials com gols de l'app
  const topScorers = [...players]
    .filter(p => p.pos !== 'PO')
    .sort((a, b) => (b.official_goles || 0) - (a.official_goles || 0)) // ordenem per oficials, però mostrem els dos
    .slice(0, 6)

  if (loadingRanking) {
    return <div className="text-center py-8 text-handball-text2">Carregant estadístiques...</div>
  }

  return (
    <div>
      {stats && (
        <div className="bg-handball-accent/10 border border-handball-accent/30 rounded-xl p-3 mb-4 text-xs text-handball-text2">
          ⚡ Les dades globals (punts, partits, gols) són les oficials de la classificació de la competició.
        </div>
      )}

      {nextMatch && (
        <div className="bg-handball-accent/10 border border-handball-accent/30 rounded-xl p-5 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs uppercase tracking-wide text-handball-text3">
                Proper partit
              </div>
              <div className="text-base font-semibold">
                {nextMatch.location === 'home'
                  ? `${team.name} vs ${nextMatch.rival}`
                  : `${nextMatch.rival} vs ${team.name}`}
              </div>
              <div className="text-xs text-handball-text3 mt-1">
                {nextMatch.location === 'home' ? '🏠 Casa' : '✈️ Fora'} ·{' '}
                {nextMatch.date
                  ? new Date(nextMatch.date).toLocaleDateString('ca-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })
                  : 'Data per confirmar'}
              </div>
            </div>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-handball-accent/20 text-handball-accent">
              Pròxim
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
          <div className="text-xs uppercase text-handball-text3">Punts</div>
          <div className="text-2xl font-mono font-semibold text-handball-accent">
            {stats?.pts || (() => {
              const wins = doneMatches.filter(m =>
                (m.location === 'home' && m.result_home > m.result_away) ||
                (m.location === 'away' && m.result_away > m.result_home)
              ).length
              const draws = doneMatches.filter(m => m.result_home === m.result_away).length
              return wins * 2 + draws
            })()}
          </div>
          <div className="text-xs text-handball-text3 mt-1">
            {stats ? `${stats.jug} partits` : `${doneMatches.length} partits`}
          </div>
        </div>
        <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
          <div className="text-xs uppercase text-handball-text3">Victòries</div>
          <div className="text-2xl font-mono font-semibold text-handball-green">
            {stats?.gan || doneMatches.filter(m =>
              (m.location === 'home' && m.result_home > m.result_away) ||
              (m.location === 'away' && m.result_away > m.result_home)
            ).length}
          </div>
          <div className="text-xs text-handball-text3">
            {stats?.emp || doneMatches.filter(m => m.result_home === m.result_away).length} empats ·{' '}
            {stats?.per || doneMatches.filter(m =>
              (m.location === 'home' && m.result_home < m.result_away) ||
              (m.location === 'away' && m.result_away < m.result_home)
            ).length} derrotes
          </div>
        </div>
        <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
          <div className="text-xs uppercase text-handball-text3">Gols marcats</div>
          <div className="text-2xl font-mono font-semibold">{stats?.gf || doneMatches.reduce((sum, m) => sum + (m.location === 'home' ? m.result_home : m.result_away), 0)}</div>
          <div className="text-xs text-handball-text3">
            Avg {(stats ? stats.gf / stats.jug : doneMatches.length ? (doneMatches.reduce((sum, m) => sum + (m.location === 'home' ? m.result_home : m.result_away), 0) / doneMatches.length).toFixed(1) : 0)}/partit
          </div>
        </div>
        <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
          <div className="text-xs uppercase text-handball-text3">Gols rebuts</div>
          <div className="text-2xl font-mono font-semibold text-handball-red">{stats?.gc || doneMatches.reduce((sum, m) => sum + (m.location === 'home' ? m.result_away : m.result_home), 0)}</div>
          <div className="text-xs text-handball-text3">
            Dif: {((stats?.gf || 0) - (stats?.gc || 0)) > 0 ? '+' : ''}{((stats?.gf || 0) - (stats?.gc || 0))}
          </div>
        </div>
        <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
          <div className="text-xs uppercase text-handball-text3">Eficàcia llançam.</div>
          <div className="text-2xl font-mono font-semibold text-handball-amber">{efficiency}%</div>
          <div className="text-xs text-handball-text3">{totalGoalsApp}/{totalShots} llançaments</div>
        </div>
        <div className="bg-handball-bg2 border border-handball-border rounded-xl p-4">
          <div className="text-xs uppercase text-handball-text3">Atur porter</div>
          <div className="text-2xl font-mono font-semibold">{savePercent}%</div>
          <div className="text-xs text-handball-text3">{totalSaves} parades</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Màxims golejadors amb dos tipus de gols */}
        <div className="bg-handball-bg2 border border-handball-border rounded-xl">
          <div className="border-b border-handball-border px-5 py-3">
            <h3 className="font-semibold">Màxims golejadors</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-handball-text3 text-xs uppercase border-b border-handball-border">
                <tr>
                  <th className="p-3 text-left">Jugador</th>
                  <th className="p-3 text-left">Pos</th>
                  <th className="p-3 text-left">Gols FCH</th>
                  <th className="p-3 text-left">Gols app</th>
                  <th className="p-3 text-left">Eff%</th>
                </tr>
              </thead>
              <tbody>
                {topScorers.map(p => {
                  const eff = p.lanz_total > 0 ? Math.round((p.goles / p.lanz_total) * 100) : 0
                  return (
                    <tr key={p.id} className="border-b border-handball-border last:border-0">
                      <td className="p-3">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-handball-text3">#{p.number}</div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-handball-accent/15 text-handball-accent`}>
                          {p.pos}
                        </span>
                      </td>
                      <td className="p-3 text-handball-green font-mono font-semibold">{p.official_goles || 0}</td>
                      <td className="p-3 font-mono">{p.goles}</td>
                      <td className="p-3 font-mono">{eff}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resultats recents */}
        <div className="bg-handball-bg2 border border-handball-border rounded-xl">
          <div className="border-b border-handball-border px-5 py-3">
            <h3 className="font-semibold">Resultats recents</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-handball-text3 text-xs uppercase border-b border-handball-border">
                <tr>
                  <th className="p-3 text-left">Rival</th>
                  <th className="p-3 text-left">Loc</th>
                  <th className="p-3 text-left">Resultat</th>
                </tr>
              </thead>
              <tbody>
                {recentMatches.map(m => {
                  const isHome = m.location === 'home'
                  const myGoals = isHome ? m.result_home : m.result_away
                  const theirGoals = isHome ? m.result_away : m.result_home
                  const resultClass = myGoals > theirGoals ? 'text-handball-green' : myGoals < theirGoals ? 'text-handball-red' : 'text-handball-amber'
                  return (
                    <tr key={m.id} className="border-b border-handball-border last:border-0">
                      <td className="p-3 font-medium text-sm">{m.rival}</td>
                      <td className="p-3">{isHome ? '🏠' : '✈️'}</td>
                      <td className={`p-3 font-mono font-semibold ${resultClass}`}>
                        {isHome ? `${m.result_home}-${m.result_away}` : `${m.result_away}-${m.result_home}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard