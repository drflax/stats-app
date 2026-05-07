import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import TeamShares from './TeamShares'  // <-- falta afegida

// Funció per dibuixar un diagrama en un canvas (retorna una promesa amb la dataURL)
function drawDiagramToImage(diagram) {
  return new Promise((resolve) => {
    if (!diagram || !diagram.elements) return resolve(null)
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 300
    const ctx = canvas.getContext('2d')
    const type = diagram.type
    const elements = diagram.elements

    // Fons
    ctx.fillStyle = '#e8f0e5'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1.5

    if (type === 'full') {
      const margin = 20
      const w = canvas.width - margin * 2
      const h = canvas.height - margin * 2
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      ctx.strokeRect(margin, margin, w, h)
      ctx.beginPath()
      ctx.moveTo(centerX, margin)
      ctx.lineTo(centerX, canvas.height - margin)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI)
      ctx.stroke()
      const r6 = h * 0.22
      const r9 = h * 0.34
      ctx.beginPath()
      ctx.arc(margin, centerY, r6, -Math.PI/2, Math.PI/2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(canvas.width - margin, centerY, r6, Math.PI/2, -Math.PI/2)
      ctx.stroke()
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.arc(margin, centerY, r9, -Math.PI/2, Math.PI/2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(canvas.width - margin, centerY, r9, Math.PI/2, -Math.PI/2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(margin - 8, centerY - 10, 8, 20)
      ctx.fillRect(canvas.width - margin, centerY - 10, 8, 20)
    } else if (type === 'halfAttack') {
      const margin = 20
      const w = canvas.width - margin * 2
      const h = canvas.height - margin * 2
      const centerX = canvas.width / 2
      const topY = margin
      ctx.strokeRect(margin, margin, w, h)
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(centerX - 20, topY - 8, 40, 8)
      ctx.strokeRect(centerX - 20, topY - 8, 40, 8)
      const r6 = h * 0.28
      const r9 = h * 0.43
      ctx.beginPath()
      ctx.arc(centerX, topY, r6, 0, Math.PI)
      ctx.stroke()
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.arc(centerX, topY, r9, 0, Math.PI)
      ctx.stroke()
      ctx.setLineDash([])
    } else if (type === 'halfDefense') {
      const margin = 20
      const w = canvas.width - margin * 2
      const h = canvas.height - margin * 2
      const centerX = canvas.width / 2
      const bottomY = canvas.height - margin
      ctx.strokeRect(margin, margin, w, h)
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(centerX - 20, bottomY, 40, 8)
      ctx.strokeRect(centerX - 20, bottomY, 40, 8)
      const r6 = h * 0.28
      const r9 = h * 0.43
      ctx.beginPath()
      ctx.arc(centerX, bottomY, r6, Math.PI, 0)
      ctx.stroke()
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.arc(centerX, bottomY, r9, Math.PI, 0)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Símbols
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
    const scaleX = canvas.width / 900
    const scaleY = canvas.height / 450
    for (const el of elements) {
      const sym = SYMBOLS[el.type] || SYMBOLS.attacker
      ctx.save()
      ctx.translate(el.x * scaleX, el.y * scaleY)
      if (el.rotation) ctx.rotate(el.rotation * Math.PI / 180)
      ctx.font = `14px "Segoe UI", system-ui`
      ctx.fillStyle = sym.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(sym.icon, 0, 0)
      ctx.restore()
    }

    resolve(canvas.toDataURL())
  })
}

export default function TeamManagement({ user, onTeamChanged }) {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState({})
  const [exporting, setExporting] = useState({})

  const fetchTeams = async () => {
    if (!user) {
      setTeams([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, category, season, isquad_url, created_at')
      .order('created_at', { ascending: false })
    if (error) {
      console.error(error)
    } else {
      setTeams(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTeams()
  }, [user])

  const deleteTeam = async (teamId) => {
    if (!confirm('Segur que vols eliminar aquest equip? Es perdran totes les dades associades.')) return
    const { error } = await supabase.from('teams').delete().eq('id', teamId)
    if (error) {
      alert('Error eliminant l\'equip: ' + error.message)
    } else {
      await fetchTeams()
      if (onTeamChanged) onTeamChanged()
    }
  }

  const syncTeam = async (team) => {
    if (!team.isquad_url) {
      alert('Aquest equip no té URL d\'iSquad associada. No es pot sincronitzar.')
      return
    }
    setSyncing(prev => ({ ...prev, [team.id]: true }))
    try {
      const { data, error } = await supabase.functions.invoke('scrape-team', {
        body: { url: team.isquad_url }
      })
      if (error) throw error

      await supabase.from('teams').update({
        name: data.teamName,
        category: data.category || team.category,
        season: data.season || team.season,
      }).eq('id', team.id)

      const { data: existingPlayers } = await supabase
        .from('players')
        .select('id, name, number, pos, dob, official_goles')
        .eq('team_id', team.id)
      const existingMap = new Map(existingPlayers?.map(p => [p.name, p]) || [])

      for (const newP of data.players) {
        if (existingMap.has(newP.name)) {
          const existing = existingMap.get(newP.name)
          await supabase.from('players').update({
            number: newP.number,
            pos: newP.pos,
            dob: newP.dob,
            official_goles: newP.fchGols || 0,
          }).eq('id', existing.id)
        } else {
          await supabase.from('players').insert({
            team_id: team.id,
            name: newP.name,
            number: newP.number,
            pos: newP.pos || 'JUG',
            dob: newP.dob,
            official_goles: newP.fchGols || 0,
            goles: 0, lanz_total: 0, lanz_fuera: 0, lanz_bloq: 0,
            faltes_com: 0, faltes_reb: 0, tarjetes_2min: 0, tarjetes_a: 0, tarjetes_r: 0,
            parades: 0, gols_rebuts: 0,
          })
        }
      }

      await supabase.from('matches').delete().eq('team_id', team.id)
      if (data.matches && data.matches.length) {
        const matchesToInsert = data.matches.map(m => ({
          team_id: team.id,
          rival: m.rival,
          location: m.location,
          date: m.date,
          round: m.round,
          done: m.done,
          result_home: m.result_home,
          result_away: m.result_away,
          venue: m.venue,
        }))
        await supabase.from('matches').insert(matchesToInsert)
      }

      await supabase.from('rankings').delete().eq('team_id', team.id)
      if (data.ranking && data.ranking.length) {
        await supabase.from('rankings').insert({
          team_id: team.id,
          competition: data.competition || '',
          season: data.season || '2025-26',
          data: data.ranking,
        })
      }

      alert(`Equip "${data.teamName}" sincronitzat correctament.`)
      if (onTeamChanged) onTeamChanged()
    } catch (err) {
      console.error(err)
      alert('Error sincronitzant: ' + err.message)
    } finally {
      setSyncing(prev => ({ ...prev, [team.id]: false }))
    }
  }

  const exportTeamPDF = async (team) => {
    setExporting(prev => ({ ...prev, [team.id]: true }))
    try {
      const [playersRes, matchesRes, rankingsRes, trainingsRes] = await Promise.all([
        supabase.from('players').select('*').eq('team_id', team.id).order('number', { ascending: true }),
        supabase.from('matches').select('*').eq('team_id', team.id).order('date', { ascending: true }),
        supabase.from('rankings').select('*').eq('team_id', team.id),
        supabase.from('trainings').select('*').eq('team_id', team.id).order('date', { ascending: false }),
      ])

      const players = playersRes.data || []
      const matches = matchesRes.data || []
      const rankings = rankingsRes.data || []
      const trainings = trainingsRes.data || []

      // Obtenir detalls d'entrenaments (assistència, accions, i diagrames)
      const trainingDetails = []
      for (const training of trainings) {
        const [attendanceRes, eventsRes] = await Promise.all([
          supabase.from('training_attendance').select('player_id, present').eq('training_id', training.id),
          supabase.from('training_events').select('player_id, event_type, quantity').eq('training_id', training.id),
        ])
        const attendance = attendanceRes.data || []
        const events = eventsRes.data || []
        const playersMap = new Map(players.map(p => [p.id, p.name]))
        const attendanceList = attendance.map(a => ({
          name: playersMap.get(a.player_id) || 'Desconegut',
          present: a.present,
        }))
        const eventsMap = new Map()
        for (const ev of events) {
          const playerName = playersMap.get(ev.player_id) || 'Desconegut'
          const key = `${playerName}_${ev.event_type}`
          if (!eventsMap.has(key)) eventsMap.set(key, { player: playerName, type: ev.event_type, quantity: 0 })
          eventsMap.get(key).quantity += ev.quantity
        }
        const eventsList = Array.from(eventsMap.values())

        // Processar diagrames: per a cada bloc amb diagrama, generar imatge
        const planWithImages = []
        for (const block of (training.plan || [])) {
          let diagramImage = null
          if (block.diagram && block.diagram.elements) {
            diagramImage = await drawDiagramToImage(block.diagram)
          }
          planWithImages.push({ ...block, diagramImage })
        }

        trainingDetails.push({
          ...training,
          attendance: attendanceList,
          events: eventsList,
          plan: planWithImages,
        })
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
        <title>${escapeHtml(team.name)} - Informe complet</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: white; color: black; }
          h1 { font-size: 1.8rem; margin-bottom: 0.2rem; }
          h2 { font-size: 1.4rem; margin-top: 1rem; margin-bottom: 0.5rem; border-left: 4px solid #2c7da0; padding-left: 10px; }
          h3 { font-size: 1.2rem; margin: 0.8rem 0 0.3rem; color: #2c7da0; }
          h4 { font-size: 1rem; margin: 0.5rem 0 0.2rem; color: #555; }
          .meta { color: #555; margin-bottom: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
          th, td { border: 1px solid #ccc; padding: 6px; text-align: left; vertical-align: top; }
          th { background: #f0f0f0; }
          .match-result.win { color: #2c7da0; font-weight: bold; }
          .match-result.loss { color: #d62828; font-weight: bold; }
          .match-result.draw { color: #e9c46a; font-weight: bold; }
          .present { background-color: #e8f0e5; }
          .absent { background-color: #ffe6e6; }
          .block-item { margin-bottom: 12px; padding: 8px; background: #f9f9f9; border-left: 3px solid #2c7da0; }
          .block-title { font-weight: bold; }
          .block-duration { font-size: 0.85rem; color: #666; }
          .block-diagram { margin-top: 6px; text-align: center; }
          .block-diagram img { max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 4px; }
          @media print {
            body { margin: 0; padding: 15px; }
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(team.name)}</h1>
        <div class="meta">
          📅 Categoria: ${escapeHtml(team.category)} · Temporada: ${escapeHtml(team.season)}<br>
          🆔 ID: ${team.id} · 🔗 URL iSquad: ${escapeHtml(team.isquad_url || 'No definida')}
        </div>

        <h2>📋 Plantilla (${players.length} jugadors)</h2>
        </table>
          <thead><tr><th>#</th><th>Nom</th><th>Pos.</th><th>Gols FCH</th><th>Gols app</th><th>Llanç.</th><th>Ef%</th><th>Parades</th><th>% Atur</th><th>Faltes</th><th>2min</th></tr></thead>
          <tbody>
            ${players.map(p => {
              const eff = p.lanz_total ? Math.round((p.goles / p.lanz_total) * 100) : 0
              const savePct = (p.pos === 'PO' && (p.parades + p.gols_rebuts)) ? Math.round((p.parades / (p.parades + p.gols_rebuts)) * 100) : 0
              return `
              <tr>
                <td>${p.number || '-'}</td>
                <td>${escapeHtml(p.name)}</td>
                <td>${p.pos || '-'}</td>
                <td>${p.official_goles || 0}</td>
                <td>${p.goles || 0}</td>
                <td>${p.lanz_total || 0}</td>
                <td>${eff}%</td>
                <td>${p.pos === 'PO' ? (p.parades || 0) : '-'}</td>
                <td>${p.pos === 'PO' ? savePct + '%' : '-'}</td>
                <td>${p.faltes_com || 0}</td>
                <td>${p.tarjetes_2min || 0}</td>
              </tr>
            `}).join('')}
          </tbody>
        </table>

        <h2>⚽ Partits (${matches.length})</h2>
        <table>
          <thead><tr><th>Data</th><th>Rival</th><th>Local/Fora</th><th>Resultat</th><th>Pavelló</th></tr></thead>
          <tbody>
            ${matches.map(m => {
              const isHome = m.location === 'home'
              const myScore = isHome ? m.result_home : m.result_away
              const oppScore = isHome ? m.result_away : m.result_home
              let resultClass = '', resultText = ''
              if (m.done && myScore !== null && oppScore !== null) {
                resultText = `${myScore} - ${oppScore}`
                resultClass = myScore > oppScore ? 'win' : myScore < oppScore ? 'loss' : 'draw'
              } else resultText = 'Pendent'
              return `
              <tr>
                <td>${m.date ? new Date(m.date).toLocaleDateString('ca-ES') : 'Pendent'}</td>
                <td>${escapeHtml(m.rival)}</td>
                <td>${isHome ? 'Casa' : 'Fora'}</td>
                <td class="match-result ${resultClass}">${resultText}</td>
                <td>${escapeHtml(m.venue || '')}</td>
              </tr>
            `}).join('')}
          </tbody>
        </table>

        ${rankings.length > 0 ? `
        <h2>🏆 Classificació</h2>
        <table>
          <thead><tr><th>Pos</th><th>Equip</th><th>Pts</th><th>J</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>Dif</th></tr></thead>
          <tbody>
            ${rankings[0].data.map(r => `
              <tr ${r.mine ? 'style="background:#e8f0e5"' : ''}>
                <td>${r.pos}</td><td>${escapeHtml(r.name)}</td><td>${r.pts}</td><td>${r.jug}</td>
                <td>${r.gan}</td><td>${r.emp}</td><td>${r.per}</td><td>${r.gf}</td><td>${r.gc}</td><td>${r.dif}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <h2>🏋️ Entrenaments (${trainings.length})</h2>
        ${trainingDetails.map((t, idx) => `
          <div style="margin-bottom: 1.5rem; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem;">
            <h3>📅 ${new Date(t.date).toLocaleDateString('ca-ES')} — ${escapeHtml(t.title)}</h3>
            <p><strong>Durada:</strong> ${t.duration_minutes || '-'} minuts<br>
            <strong>Notes:</strong> ${escapeHtml(t.notes || 'Sense notes')}</p>

            <h4>Assistència (${t.attendance.filter(a => a.present).length}/${players.length} presents)</h4>
            <table>
              <thead><tr><th>Jugador</th><th>Present</th></tr></thead>
              <tbody>
                ${t.attendance.map(a => `
                  <tr class="${a.present ? 'present' : 'absent'}">
                    <td>${escapeHtml(a.name)}</td>
                    <td>${a.present ? '✅ Sí' : '❌ No'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <h4>Accions de porters</h4>
            ${t.events.length > 0 ? `
            <table>
              <thead><tr><th>Porter</th><th>Acció</th><th>Quantitat</th></tr></thead>
              <tbody>
                ${t.events.map(ev => `
                  <tr>
                    <td>${escapeHtml(ev.player)}</td>
                    <td>${ev.type === 'save' ? 'Parada' : ev.type === 'conceded' ? 'Gol rebut' : ev.type === 'foul' ? 'Falta' : '2 minuts'}</td>
                    <td>${ev.quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : '<p>No hi ha accions registrades.</p>'}

            <h4>Pla de la sessió (${t.plan.length} blocs)</h4>
            ${t.plan.length > 0 ? t.plan.map(blk => `
              <div class="block-item">
                <div class="block-title">${escapeHtml(blk.title || 'Sense títol')}</div>
                <div class="block-duration">⏱️ Durada: ${blk.duration || '—'}</div>
                <div>${escapeHtml(blk.description || 'Sense descripció')}</div>
                ${blk.diagramImage ? `
                  <div class="block-diagram">
                    <img src="${blk.diagramImage}" alt="Diagrama tàctic" />
                  </div>
                ` : (blk.diagram ? '<div><small>📐 Diagrama tàctic (no es pot dibuixar automàticament)</small></div>' : '')}
              </div>
            `).join('') : '<p>No hi ha cap bloc definit.</p>'}
          </div>
        `).join('')}
      </body>
      </html>
      `

      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('No es pot obrir la finestra d\'impressió. Permeteu finestres emergents.')
        return
      }
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.print()
    } catch (err) {
      console.error(err)
      alert('Error exportant l\'equip a PDF: ' + err.message)
    } finally {
      setExporting(prev => ({ ...prev, [team.id]: false }))
    }
  }

  if (loading) return <div className="text-center py-4 text-handball-text2">Carregant equips...</div>
  if (!user) return <div className="text-center py-4 text-handball-text2">Inicia sessió per veure els teus equips.</div>
  if (teams.length === 0) return <div className="text-center py-4 text-handball-text2">Encara no has importat cap equip.</div>
  
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Els teus equips</h3>
      {teams.map(team => (
        <div key={team.id} className="bg-handball-bg2 border border-handball-border rounded-xl p-3">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <div className="font-medium">{team.name}</div>
              <div className="text-xs text-handball-text3">{team.category} · {team.season}</div>
              {team.isquad_url && (
                <div className="text-xs text-handball-text3 truncate max-w-[200px]" title={team.isquad_url}>
                  🔗 {team.isquad_url.substring(0, 50)}... {team.user_id}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => syncTeam(team)} className="bg-handball-accent/20 text-handball-accent border px-3 py-1 rounded-lg text-sm">
                🔄 Sincronitzar
              </button>
              <button onClick={() => exportTeamPDF(team)} className="bg-handball-green/20 text-handball-green border px-3 py-1 rounded-lg text-sm">
                📄 Exportar PDF
              </button>
              <button onClick={() => deleteTeam(team.id)} className="bg-handball-red/20 text-handball-red border px-3 py-1 rounded-lg text-sm">
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}