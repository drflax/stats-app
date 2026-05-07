import { useState } from 'react'

export default function Stats({ players }) {
  const [tab, setTab] = useState('atac')
  const gks = players.filter(p => p.pos === 'PO')
  const field = players.filter(p => p.pos !== 'PO')

  const efficiency = (goles, lanz) => lanz > 0 ? Math.round((goles / lanz) * 100) : 0
  const savePercent = (parades, rebuts) => (parades + rebuts) > 0 ? Math.round((parades / (parades + rebuts)) * 100) : 0

  const topScorers = [...field].sort((a, b) => b.goles - a.goles).slice(0, 10)
  const topSavers = [...gks].sort((a, b) => savePercent(b.parades, b.gols_rebuts) - savePercent(a.parades, a.gols_rebuts))
  const topDisciplined = [...players].sort((a, b) => b.tarjetes_2min - a.tarjetes_2min).slice(0, 10)

  return (
    <div>
      <div className="flex gap-1 bg-handball-bg3 p-1 rounded-lg mb-4">
        {['atac', 'porteria', 'disciplina'].map(t => (
          <button
            key={t}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${tab === t ? 'bg-handball-bg2 text-handball-text shadow' : 'text-handball-text2'}`}
            onClick={() => setTab(t)}
          >
            {t === 'atac' ? 'Atac' : t === 'porteria' ? 'Porteria' : 'Disciplina'}
          </button>
        ))}
      </div>

      <div className="bg-handball-bg2 border border-handball-border rounded-xl overflow-x-auto">
        {tab === 'atac' && (
          <table className="w-full text-sm">
            <thead className="text-handball-text3 text-xs uppercase border-b border-handball-border">
               <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Jugador</th>
                <th className="p-2 text-left">Pos</th>
                <th className="p-2 text-left">Gols</th>
                <th className="p-2 text-left">Llanz.</th>
                <th className="p-2 text-left">Fora</th>
                <th className="p-2 text-left">Bloq.</th>
                <th className="p-2 text-left">Efic%</th>
              </tr>
            </thead>
            <tbody>
              {topScorers.map((p, i) => (
                <tr key={p.id} className="border-b border-handball-border last:border-0">
                  <td className="p-2 text-handball-text3 font-mono text-xs">{i + 1}</td>
                  <td className="p-2 font-medium text-xs md:text-sm">{p.name}</td>
                  <td className="p-2">
                    <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-handball-accent/15 text-handball-accent">
                      {p.pos}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-handball-green font-semibold text-xs md:text-sm">{p.goles}</td>
                  <td className="p-2 font-mono text-xs md:text-sm">{p.lanz_total}</td>
                  <td className="p-2 font-mono text-xs md:text-sm">{p.lanz_fuera}</td>
                  <td className="p-2 font-mono text-xs md:text-sm">{p.lanz_bloq}</td>
                  <td className="p-2 font-mono text-xs md:text-sm">{efficiency(p.goles, p.lanz_total)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'porteria' && (
          <table className="w-full text-sm">
            <thead className="text-handball-text3 text-xs uppercase border-b border-handball-border">
               <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Jugador</th>
                <th className="p-2 text-left">Pos</th>
                <th className="p-2 text-left">Parades</th>
                <th className="p-2 text-left">G. Rebuts</th>
                <th className="p-2 text-left">% Atur</th>
                <th className="p-2 text-left">Faltes</th>
                <th className="p-2 text-left">2min</th>
              </tr>
            </thead>
            <tbody>
              {topSavers.map((p, i) => (
                <tr key={p.id} className="border-b border-handball-border last:border-0">
                  <td className="p-2 text-handball-text3 font-mono text-xs">{i + 1}</td>
                  <td className="p-2 font-medium text-xs md:text-sm">{p.name}</td>
                  <td className="p-2">
                    <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-handball-accent/15 text-handball-accent">
                      {p.pos}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-handball-accent text-xs md:text-sm">{p.parades}</td>
                  <td className="p-2 font-mono text-handball-red text-xs md:text-sm">{p.gols_rebuts}</td>
                  <td className="p-2 font-mono text-xs md:text-sm">{savePercent(p.parades, p.gols_rebuts)}%</td>
                  <td className="p-2 font-mono text-xs md:text-sm">{p.faltes_com}</td>
                  <td className="p-2 font-mono text-handball-purple text-xs md:text-sm">{p.tarjetes_2min}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'disciplina' && (
          <table className="w-full text-sm">
            <thead className="text-handball-text3 text-xs uppercase border-b border-handball-border">
               <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Jugador</th>
                <th className="p-2 text-left">Pos</th>
                <th className="p-2 text-left">2 min</th>
                <th className="p-2 text-left">T. Groc</th>
                <th className="p-2 text-left">T. Verm</th>
                <th className="p-2 text-left">Faltes</th>
                <th className="p-2 text-left">Reb.</th>
              </tr>
            </thead>
            <tbody>
              {topDisciplined.map((p, i) => (
                <tr key={p.id} className="border-b border-handball-border last:border-0">
                  <td className="p-2 text-handball-text3 font-mono text-xs">{i + 1}</td>
                  <td className="p-2 font-medium text-xs md:text-sm">{p.name}</td>
                  <td className="p-2">
                    <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-handball-accent/15 text-handball-accent">
                      {p.pos}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-handball-purple text-xs md:text-sm">{p.tarjetes_2min}</td>
                  <td className="p-2 font-mono text-handball-amber text-xs md:text-sm">{p.tarjetes_a}</td>
                  <td className="p-2 font-mono text-handball-red text-xs md:text-sm">{p.tarjetes_r}</td>
                  <td className="p-2 font-mono text-xs md:text-sm">{p.faltes_com}</td>
                  <td className="p-2 font-mono text-xs md:text-sm">{p.faltes_reb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}