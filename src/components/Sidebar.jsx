export default function Sidebar({ active, setActive, team, userRole }) {
  const allNav = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'live', icon: '🔴', label: 'Partit en viu', roles: ['entrenador', 'segon_entrenador'] },
    { id: 'matches', icon: '📅', label: 'Calendari' },
    { id: 'ranking', icon: '🏆', label: 'Classificació' },
    { id: 'players', icon: '👥', label: 'Plantilla' },
    { id: 'stats', icon: '📈', label: 'Estadístiques' },
    { id: 'trainings', icon: '🏋️', label: 'Entrenaments' },
    { id: 'fch', icon: '🔗', label: 'Importació', roles: ['entrenador'] },
    { id: 'shares', icon: '👤', label: 'Compartir', roles: ['entrenador'] },
  ]

  const nav = allNav.filter(item =>
    !item.roles || item.roles.includes(userRole)
  )

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-handball-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-handball-accent rounded-md flex items-center justify-center text-white font-bold text-sm">H</div>
          <div>
            <div className="font-semibold text-sm">Handbol Stats</div>
            <div className="text-[9px] text-handball-text3 uppercase tracking-wide">Gestió d'equips</div>
          </div>
        </div>
      </div>
      <div className="text-[10px] text-handball-text3 uppercase tracking-wide px-4 py-2">
        Navegació
      </div>
      {nav.map((item) => (
        <div
          key={item.id}
          className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-colors ${
            active === item.id
              ? 'text-handball-accent bg-handball-accent/10 border-l-2 border-handball-accent'
              : 'text-handball-text2 hover:text-handball-text hover:bg-white/5'
          }`}
          onClick={() => setActive(item.id)}
        >
          <span className="text-base w-5 text-center">{item.icon}</span>
          {item.label}
        </div>
      ))}
      <div className="mt-auto p-4 border-t border-handball-border">
        {team && (
          <div className="bg-handball-bg3 border border-handball-border2 rounded-lg p-2 text-sm">
            <div className="text-[9px] text-handball-text3 uppercase tracking-wide">Equip actiu</div>
            <div className="font-medium text-xs">{team.name}</div>
            <div className="text-[10px] text-handball-accent mt-0.5">
              {team.category} · {team.season}
            </div>
            {userRole && (
              <div className="text-[9px] text-handball-text3 mt-1 capitalize">
                {userRole === 'entrenador' ? '🏅 Entrenador' : userRole === 'segon_entrenador' ? '📋 Segon entrenador' : '👤 Jugador'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}