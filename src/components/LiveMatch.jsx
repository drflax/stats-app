import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function LiveMatch({ team, players, matches, onMatchEnd, showToast, user, userRole }) {
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [isLive, setIsLive] = useState(false)
  const [minute, setMinute] = useState(0)
  const [scoreHome, setScoreHome] = useState(0)
  const [scoreAway, setScoreAway] = useState(0)
  const [half, setHalf] = useState(1)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [liveStats, setLiveStats] = useState({})
  const timerRef = useRef(null)

  const canEdit = user && (userRole === 'entrenador' || userRole === 'segon_entrenador')
  const isHome = selectedMatch?.location === 'home'
  const myScore = isHome ? scoreHome : scoreAway
  const theirScore = isHome ? scoreAway : scoreHome

  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => setMinute(m => m < 60 ? m + 1 : m), 60000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isLive])

  const addEvent = (type, label) => {
    if (!selectedPlayer) {
      showToast('Selecciona un jugador primer', 'error')
      return
    }
    const player = players.find(p => p.id === selectedPlayer)
    const event = {
      id: Date.now(),
      minute,
      type,
      player: player.name,
      num: player.number,
      label,
    }
    setTimeline(prev => [event, ...prev])

    if (type === 'goal') {
      if (isHome) setScoreHome(s => s + 1)
      else setScoreAway(s => s + 1)
    }

    setLiveStats(prev => {
      const current = prev[selectedPlayer] || {
        goles: 0, lanzTotal: 0, lanzFuera: 0, lanzBloq: 0,
        faltesCom: 0, faltesReb: 0, tarjetes2min: 0, tarjetesR: 0,
        parades: 0, golsRebuts: 0,
      }
      const updated = { ...current }
      if (type === 'goal') { updated.goles++; updated.lanzTotal++ }
      if (type === 'miss') { updated.lanzTotal++; updated.lanzFuera++ }
      if (type === 'blocked') { updated.lanzTotal++; updated.lanzBloq++ }
      if (type === 'save') updated.parades++
      if (type === 'conceded') updated.golsRebuts++
      if (type === 'foul') updated.faltesCom++
      if (type === 'fouled') updated.faltesReb++
      if (type === '2min') updated.tarjetes2min++
      if (type === 'red') updated.tarjetesR++
      return { ...prev, [selectedPlayer]: updated }
    })
    showToast(`${label}: ${player.name}`, 'success')
  }

  const endMatch = async () => {
    if (!selectedMatch) return

    const { error: matchError } = await supabase
      .from('matches')
      .update({
        done: true,
        result_home: isHome ? scoreHome : scoreAway,
        result_away: isHome ? scoreAway : scoreHome,
      })
      .eq('id', selectedMatch.id)

    if (matchError) { showToast('Error en guardar el partit', 'error'); return }

    for (const [playerId, stats] of Object.entries(liveStats)) {
      const { data: current } = await supabase.from('players').select('*').eq('id', playerId).single()
      if (!current) continue
      const newStats = {
        goles: (current.goles || 0) + (stats.goles || 0),
        lanz_total: (current.lanz_total || 0) + (stats.lanzTotal || 0),
        lanz_fuera: (current.lanz_fuera || 0) + (stats.lanzFuera || 0),
        lanz_bloq: (current.lanz_bloq || 0) + (stats.lanzBloq || 0),
        faltes_com: (current.faltes_com || 0) + (stats.faltesCom || 0),
        faltes_reb: (current.faltes_reb || 0) + (stats.faltesReb || 0),
        tarjetes_2min: (current.tarjetes_2min || 0) + (stats.tarjetes2min || 0),
        tarjetes_r: (current.tarjetes_r || 0) + (stats.tarjetesR || 0),
        parades: (current.parades || 0) + (stats.parades || 0),
        gols_rebuts: (current.gols_rebuts || 0) + (stats.golsRebuts || 0),
      }
      await supabase.from('players').update(newStats).eq('id', playerId)
    }

    showToast('Partit finalitzat i guardat', 'success')
    setIsLive(false)
    setSelectedMatch(null)
    setTimeline([])
    setLiveStats({})
    setScoreHome(0); setScoreAway(0); setMinute(0); setHalf(1)
    if (onMatchEnd) onMatchEnd()
  }

  if (!selectedMatch) {
    const pendingMatches = matches.filter(m => !m.done)
    return (
      <div>
        <div className="text-handball-text2 mb-4 text-sm">Selecciona el partit per iniciar la captura en temps real</div>
        <div className="space-y-3">
          {pendingMatches.map(m => (
            <div
              key={m.id}
              className={`bg-handball-bg2 border border-handball-border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 transition ${canEdit ? 'cursor-pointer hover:border-handball-border2' : 'opacity-60'}`}
            >
              <div className="text-center min-w-[48px]">
                <div className="text-xl font-mono font-bold">{m.date ? new Date(m.date).getDate() : '?'}</div>
                <div className="text-xs text-handball-text3 uppercase">{m.date ? new Date(m.date).toLocaleString('ca-ES', { month: 'short' }) : '---'}</div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-1 text-sm font-medium">
                  <span>{m.location === 'home' ? team.name : m.rival}</span>
                  <span className="text-handball-text3">vs</span>
                  <span>{m.location === 'home' ? m.rival : team.name}</span>
                </div>
                <div className="text-xs text-handball-text3">J{m.round} · {m.location === 'home' ? '🏠 Casa' : '✈️ Fora'}</div>
              </div>
              <button
                className={`bg-handball-accent text-white px-4 py-2 rounded-lg text-sm font-medium ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!canEdit}
                onClick={() => canEdit && setSelectedMatch(m)}
              >
                ▶ Iniciar
              </button>
            </div>
          ))}
          {pendingMatches.length === 0 && (
            <div className="text-center text-handball-text3 py-8">No hi ha partits pendents</div>
          )}
          {!canEdit && pendingMatches.length > 0 && (
            <div className="text-center text-xs text-handball-text3 mt-2">No tens permisos per iniciar partits</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-handball-accent/15 to-handball-accent/5 border border-handball-accent/30 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center text-xs text-handball-text3 mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {isLive && (
              <><div className="w-2 h-2 bg-handball-red rounded-full animate-pulse" />
              <span className="text-handball-red font-semibold">EN DIRECTE</span></>
            )}
            <span>Minut <b className="font-mono">{minute}'</b></span>
            <span>{half}a part</span>
            <span>J{selectedMatch.round}</span>
          </div>
        </div>
        <div className="flex justify-center items-center gap-4 my-3 flex-wrap">
          <div className="text-center">
            <div className="text-handball-text2 text-sm">{isHome ? team.name : selectedMatch.rival}</div>
            <div className={`text-4xl md:text-5xl font-mono font-bold ${myScore >= theirScore ? 'text-handball-green' : ''}`}>{myScore}</div>
          </div>
          <div className="text-2xl text-handball-text3">:</div>
          <div className="text-center">
            <div className="text-handball-text2 text-sm">{isHome ? selectedMatch.rival : team.name}</div>
            <div className={`text-4xl md:text-5xl font-mono font-bold ${theirScore > myScore ? 'text-handball-red' : ''}`}>{theirScore}</div>
          </div>
        </div>
        {canEdit && (
          <div className="flex justify-center gap-2 flex-wrap">
            {!isLive ? (
              <button className="bg-handball-green text-white px-4 py-2 rounded-lg text-sm font-medium" onClick={() => setIsLive(true)}>▶ Reprendre</button>
            ) : (
              <>
                <button className="bg-handball-bg3 border border-handball-border2 px-4 py-2 rounded-lg text-sm" onClick={() => { setIsLive(false); if (half < 2) setHalf(2) }}>⏸ Pausa / Descans</button>
                <button className="bg-handball-red/20 text-handball-red border border-handball-red/30 px-4 py-2 rounded-lg text-sm font-medium" onClick={endMatch}>⏹ Finalitzar</button>
              </>
            )}
            <button className="bg-handball-bg3 border border-handball-border2 px-4 py-2 rounded-lg text-sm" onClick={() => { if (isHome) setScoreAway(s => s + 1); else setScoreHome(s => s + 1) }}>+1 rival</button>
          </div>
        )}
      </div>

      {canEdit && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-handball-bg2 border border-handball-border rounded-xl">
              <div className="border-b border-handball-border px-4 py-2 font-semibold text-sm">Selecciona jugador</div>
              <div className="p-3">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {players.map(p => (
                    <button
                      key={p.id}
                      className={`p-2 rounded-lg text-center transition ${selectedPlayer === p.id ? 'border-handball-accent bg-handball-accent/15 text-handball-accent' : 'bg-handball-bg3 border border-handball-border2 text-handball-text hover:border-handball-accent'}`}
                      onClick={() => setSelectedPlayer(p.id)}
                    >
                      <div className="font-mono font-bold text-sm md:text-base">#{p.number}</div>
                      <div className="text-xs truncate">{p.name.split(' ')[0]}</div>
                      <div className="text-[10px] text-handball-text3">{p.pos}</div>
                    </button>
                  ))}
                </div>
                {selectedPlayer && (
                  <div className="text-center text-xs text-handball-accent mt-3">
                    ✓ {players.find(p => p.id === selectedPlayer)?.name}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-handball-bg2 border border-handball-border rounded-xl">
              <div className="border-b border-handball-border px-4 py-2 font-semibold text-sm">Accions</div>
              <div className="p-3">
                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                  <button className="py-2 rounded-lg bg-handball-green/15 text-handball-green border border-handball-green/30 hover:bg-handball-green/25 transition text-xs sm:text-sm" onClick={() => addEvent('goal', 'Gol')}>⚽ Gol</button>
                  <button className="py-2 rounded-lg bg-handball-red/15 text-handball-red border border-handball-red/30 hover:bg-handball-red/25 transition text-xs sm:text-sm" onClick={() => addEvent('miss', 'Fallat')}>❌ Fallat</button>
                  <button className="py-2 rounded-lg bg-handball-text3/20 text-handball-text2 border border-handball-border2 hover:bg-handball-text3/30 transition text-xs sm:text-sm" onClick={() => addEvent('blocked', 'Bloquejat')}>🧱 Bloquejat</button>
                  <button className="py-2 rounded-lg bg-handball-accent/15 text-handball-accent border border-handball-accent/30 hover:bg-handball-accent/25 transition text-xs sm:text-sm" onClick={() => addEvent('save', 'Parada')}>🧤 Parada</button>
                  <button className="py-2 rounded-lg bg-handball-red/15 text-handball-red border border-handball-red/30 hover:bg-handball-red/25 transition text-xs sm:text-sm" onClick={() => addEvent('conceded', 'Gol rebut')}>❗ Gol rebut</button>
                  <button className="py-2 rounded-lg bg-handball-amber/15 text-handball-amber border border-handball-amber/30 hover:bg-handball-amber/25 transition text-xs sm:text-sm" onClick={() => addEvent('foul', 'Falta com.')}>⚠️ Falta com.</button>
                  <button className="py-2 rounded-lg bg-handball-teal/15 text-handball-teal border border-handball-teal/30 hover:bg-handball-teal/25 transition text-xs sm:text-sm" onClick={() => addEvent('fouled', 'Falta reb.')}>🔵 Falta reb.</button>
                  <button className="py-2 rounded-lg bg-handball-purple/15 text-handball-purple border border-handball-purple/30 hover:bg-handball-purple/25 transition text-xs sm:text-sm" onClick={() => addEvent('2min', '2 minuts')}>⏱️ 2 min</button>
                  <button className="py-2 rounded-lg bg-handball-red/15 text-handball-red border border-handball-red/30 hover:bg-handball-red/25 transition text-xs sm:text-sm" onClick={() => addEvent('red', 'Targeta roja')}>🔴 T. Roja</button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-handball-bg2 border border-handball-border rounded-xl">
            <div className="border-b border-handball-border px-4 py-2 font-semibold text-sm flex justify-between">
              <span>Registre d'accions</span>
              <span className="text-handball-text3 text-xs">{timeline.length} accions</span>
            </div>
            <div className="p-3 max-h-80 overflow-y-auto">
              {timeline.length === 0 && (
                <div className="text-center text-handball-text3 py-8 text-sm">Sense accions registrades</div>
              )}
              {timeline.map(ev => (
                <div key={ev.id} className="flex items-center gap-2 py-2 border-b border-handball-border last:border-0 text-xs md:text-sm">
                  <span className="font-mono text-handball-text3 w-8">{ev.minute}'</span>
                  <span className="w-5 text-center">
                    {ev.type === 'goal' && '⚽'}{ev.type === 'miss' && '❌'}{ev.type === 'blocked' && '🧱'}
                    {ev.type === 'save' && '🧤'}{ev.type === 'conceded' && '❗'}{ev.type === 'foul' && '⚠️'}
                    {ev.type === 'fouled' && '🔵'}{ev.type === '2min' && '⏱️'}{ev.type === 'red' && '🔴'}
                  </span>
                  <div className="flex-1 text-handball-text2">
                    <strong className="text-handball-text">#{ev.num} {ev.player}</strong> — {ev.label}
                  </div>
                  <button
                    className="text-handball-text3 hover:text-handball-red text-xs"
                    onClick={() => setTimeline(prev => prev.filter(t => t.id !== ev.id))}
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!canEdit && (
        <div className="text-center text-handball-text3 py-8 bg-handball-bg2 border border-handball-border rounded-xl">
          No tens permisos per registrar accions en el partit
        </div>
      )}
    </div>
  )
}