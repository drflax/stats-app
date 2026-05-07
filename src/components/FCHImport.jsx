import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function FCHImport({ onImportTeam, showToast, user }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [importing, setImporting] = useState(false)

  const handleFetchPreview = async () => {
    if (!url.includes('isquad.es')) {
      showToast('Introdueix una URL vàlida de iSquad', 'error')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('scrape-team', {
        body: { url },
      })
      if (error) throw error

      if (!data.players || data.players.length === 0) {
        showToast('No s\'han trobat jugadors. Revisa la URL o l\'estructura de la pàgina.', 'error')
        setPreview(null)
      } else {
        setPreview(data)
      }
    } catch (err) {
      console.error(err)
      showToast('Error en obtenir la previsualització: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!preview) return
    if (!user) {
      showToast('Has d\'iniciar sessió per importar', 'error')
      return
    }

    setImporting(true)
    try {
      // 1. Crear equip associat a l'usuari actual
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: preview.teamName,
          category: preview.category || 'Sènior',
          season: preview.season || '2025-26',
          isquad_url: url,
          user_id: user.id,
        })
        .select()
        .single()
      if (teamError) throw teamError

      // 2. Inserir jugadors amb official_goles
      const playersToInsert = preview.players.map(p => ({
        team_id: newTeam.id,
        name: p.name,
        number: p.number || 0,
        pos: p.pos || 'JUG',
        dob: p.dob || null,
        official_goles: p.fchGols || 0,
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
      }))
      const { error: playersError } = await supabase.from('players').insert(playersToInsert)
      if (playersError) throw playersError

      // 3. Inserir partits
      let insertedMatchesCount = 0
      if (preview.matches && preview.matches.length > 0) {
        const validMatches = preview.matches
          .filter(m => m.rival)
          .map(m => ({
            team_id: newTeam.id,
            rival: m.rival,
            location: m.location,
            date: m.date || null,
            round: m.round || null,
            done: m.done || false,
            result_home: m.result_home ?? null,
            result_away: m.result_away ?? null,
            venue: m.venue || '',
          }))
        if (validMatches.length > 0) {
          const { error: matchesError } = await supabase.from('matches').insert(validMatches)
          if (matchesError) throw matchesError
          insertedMatchesCount = validMatches.length
        }
      }

      // 4. Inserir classificació (si existeix)
      if (preview.ranking && preview.ranking.length > 0) {
        await supabase.from('rankings').insert({
          team_id: newTeam.id,
          competition: preview.competition || '',
          season: preview.season || '2025-26',
          data: preview.ranking,
        })
      }

      showToast(
        `Equip "${preview.teamName}" importat amb ${preview.players.length} jugadors${insertedMatchesCount ? `, ${insertedMatchesCount} partits` : ''}`,
        'success'
      )
      if (onImportTeam) onImportTeam(newTeam)
      setPreview(null)
      setUrl('')
    } catch (err) {
      console.error('❌ ERROR en importació:', err)
      showToast('Error en importar: ' + err.message, 'error')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-handball-bg2 border border-handball-border rounded-xl">
        <div className="border-b border-handball-border px-5 py-3 font-semibold">
          Importació des d'iSquad
        </div>
        <div className="p-5">
          <p className="text-sm text-handball-text2 mb-4">
            Pega l'URL de la pàgina de l'equip a iSquad per importar la plantilla.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              className="flex-1 bg-handball-bg3 border border-handball-border2 rounded-lg p-2 text-sm"
              placeholder="https://resultadosbalonmano.isquad.es/equipo.php?..."
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
            {user ? (
              <button
                className="bg-handball-accent text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                onClick={handleFetchPreview}
                disabled={loading || !url}
              >
                {loading ? 'Carregant...' : 'Previsualitzar'}
              </button>
            ) : (
              <button
                className="bg-handball-bg3 border border-handball-border2 px-5 py-2 rounded-lg text-sm font-medium cursor-not-allowed opacity-50"
                disabled
              >
                Inicia sessió per importar
              </button>
            )}
          </div>
          {!user && (
            <p className="text-xs text-handball-text3 mt-2">
              Has d'iniciar sessió per importar equips.
            </p>
          )}

          {preview && (
            <div className="mt-6 border-t border-handball-border pt-4">
              <h3 className="font-semibold mb-2">Vista prèvia de l'equip</h3>
              <p><strong>Nom:</strong> {preview.teamName}</p>
              <p><strong>Jugadors trobats:</strong> {preview.players.length}</p>
              {preview.players.length > 0 && (
                <div className="mt-2 max-h-60 overflow-y-auto border border-handball-border2 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-handball-bg3 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Nom</th>
                        <th className="p-2 text-left">Edat</th>
                        <th className="p-2 text-left">Gols FCH</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.players.map((p, idx) => (
                        <tr key={idx} className="border-t border-handball-border2">
                          <td className="p-2">{p.name}</td>
                          <td className="p-2">{p.age || '?'}</td>
                          <td className="p-2 text-handball-green font-semibold">{p.fchGols || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {preview.matches && preview.matches.length > 0 && (
                <div className="mt-4">
                  <p><strong>Partits trobats:</strong> {preview.matches.length}</p>
                </div>
              )}
              {preview.ranking && preview.ranking.length > 0 && (
                <div className="mt-4">
                  <p><strong>Classificació:</strong> {preview.ranking.length} equips</p>
                </div>
              )}
              <button
                className="mt-4 bg-handball-green text-white px-4 py-2 rounded-lg text-sm font-medium"
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? 'Important...' : 'Confirmar importació'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}