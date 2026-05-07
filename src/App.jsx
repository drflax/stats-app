import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import { useTeamData } from './hooks/useTeamData'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import LiveMatch from './components/LiveMatch'
import Matches from './components/Matches'
import Players from './components/Players'
import Stats from './components/Stats'
import Ranking from './components/Ranking'
import FCHImport from './components/FCHImport'
import TeamManagement from './components/TeamManagement'
import Toast from './components/Toast'
import AuthModal from './components/AuthModal'
import TrainingList from './components/TrainingList'
import TrainingLive from './components/TrainingLive'
import TrainingStats from './components/TrainingStats'
import TeamShares from './components/TeamShares'

const ROLE_PAGES = {
  entrenador: ['dashboard', 'live', 'matches', 'ranking', 'players', 'stats', 'trainings', 'fch', 'shares'],
  segon_entrenador: ['dashboard', 'live', 'matches', 'ranking', 'players', 'stats', 'trainings', 'fch'],
  jugador: ['dashboard', 'matches', 'ranking', 'players', 'stats', 'trainings'],
}

const canAccessPage = (page, role) => {
  if (!role) return false
  return (ROLE_PAGES[role] || []).includes(page)
}

function AppContent() {
  const [page, setPage] = useState('dashboard')
  const [teams, setTeams] = useState([])
  const [activeTeamId, setActiveTeamId] = useState(null)
  const [toast, setToast] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { team, players, matches, loading, error, userRole, refetch } = useTeamData(activeTeamId)

  const [trainingView, setTrainingView] = useState('list')
  const [selectedTraining, setSelectedTraining] = useState(null)
  
  // Para mostrar el toast de login solo una vez
  const loginToastShown = useRef(false)

  // Mostrar toast si el usuario no ha iniciado sesión
  useEffect(() => {
    if (!user && !loginToastShown.current) {
      loginToastShown.current = true
      showToast('Has d\'iniciar sessió per veure i gestionar els teus equips', 'info')
    }
  }, [user])

  // Obtener equipos propios (user_id) y compartidos (team_shares)
  const fetchTeams = async () => {
    if (!user) {
      setTeams([])
      setActiveTeamId(null)
      return
    }

    // Equipos donde el usuario es propietario
    const { data: ownedTeams, error: ownedError } = await supabase
      .from('teams')
      .select('id, name, category, season')
      .eq('user_id', user.id)

    if (ownedError) {
      console.error('Error carregant equips propis:', ownedError)
    }

    // Equipos donde el usuario ha sido compartido (team_shares)
    const { data: sharedEntries, error: shareError } = await supabase
      .from('team_shares')
      .select('team_id, role, teams(id, name, category, season)')
      .eq('user_id', user.id)

    if (shareError) {
      console.error('Error carregant equips compartits:', shareError)
    }

    const teamsMap = new Map()

    // Añadir equipos propios (rol implícito 'entrenador')
    ;(ownedTeams || []).forEach(team => {
      teamsMap.set(team.id, { ...team, role: 'entrenador' })
    })

    // Añadir equipos compartidos (con el rol de team_shares)
    ;(sharedEntries || []).forEach(entry => {
      if (entry.teams && !teamsMap.has(entry.team_id)) {
        teamsMap.set(entry.team_id, {
          ...entry.teams,
          role: entry.role
        })
      }
    })

    const allTeams = Array.from(teamsMap.values())
    setTeams(allTeams)

    if (allTeams.length > 0 && !activeTeamId) {
      setActiveTeamId(allTeams[0].id)
    } else if (allTeams.length === 0) {
      setActiveTeamId(null)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [user])

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type, id: Date.now() })
  }

  const handleTeamChange = (e) => {
    setActiveTeamId(parseInt(e.target.value))
    setTrainingView('list')
    setSelectedTraining(null)
  }

  const handleImportTeam = async (newTeam) => {
    await fetchTeams()
    showToast(`Equip "${newTeam.name}" importat correctament`, 'success')
  }

  const handleSelectTraining = (training) => {
    setSelectedTraining(training)
    setTrainingView('live')
  }

  const handleSetPage = (newPage) => {
    if (userRole && !canAccessPage(newPage, userRole)) return
    setPage(newPage)
    if (newPage !== 'trainings') {
      setTrainingView('list')
      setSelectedTraining(null)
    }
    setMobileMenuOpen(false)
  }

  const pageTitles = {
    dashboard: 'Dashboard',
    live: 'Partit en directe',
    matches: 'Calendari',
    ranking: 'Classificació',
    players: 'Plantilla',
    stats: 'Estadístiques',
    fch: 'Importació',
    trainings: 'Entrenaments',
    shares: 'Compartir equip',
  }

  // ------------------------------
  // PANTALLA PARA USUARIO NO AUTENTICADO
  // ------------------------------
  if (!user) {
  return (
    <div className="flex h-screen items-center justify-center p-4 bg-handball-bg">
      <div className="max-w-md w-full bg-handball-bg2 rounded-lg p-6 text-center shadow-lg border border-handball-border">
        <img 
          src="/favicon.ico" 
          alt="HandballStats" 
          className="w-16 h-16 mx-auto mb-4 rounded-xl" 
        />
        <h2 className="text-xl font-bold mb-2">Benvingut a HandballStats</h2>
        <p className="text-handball-text2 mb-6">
          Inicia sessió per gestionar els teus equips, jugadors, partits i entrenaments.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="bg-handball-accent text-white px-6 py-2 rounded-lg text-sm font-medium"
        >
          Iniciar sessió
        </button>
        <p className="text-xs text-handball-text3 mt-4">
          No tens compte? Registra't des del mateix diàleg.
        </p>
      </div>
      {toast && <Toast key={toast.id} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}

  // ------------------------------
  // PANTALLA PARA USUARIO AUTENTICADO SIN EQUIPOS
  // ------------------------------
  if (user && teams.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-handball-bg">
        <div className="max-w-md w-full bg-handball-bg2 rounded-lg p-6 text-center shadow-lg border border-handball-border">
          <h2 className="text-xl font-bold mb-2">No tens cap equip</h2>
          <p className="text-handball-text2 mb-6">
            Importa un equip des d'un fitxer FCH per començar a gestionar-lo.
          </p>
          <FCHImport 
            onImportTeam={handleImportTeam} 
            showToast={showToast} 
            user={user} 
            standalone={true}
          />
          <button
            onClick={() => signOut()}
            className="mt-6 text-sm text-handball-accent hover:underline"
          >
            Tancar sessió
          </button>
        </div>
        {toast && <Toast key={toast.id} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    )
  }

  // ------------------------------
  // CARGA Y ERRORES
  // ------------------------------
  if (loading && !team && activeTeamId) {
    return <div className="flex items-center justify-center h-screen">Carregant...</div>
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>
  }

  // ------------------------------
  // APLICACIÓN PRINCIPAL (con sidebar y header)
  // ------------------------------
  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-56 bg-handball-bg2 border-r border-handball-border
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0
        `}
      >
        <Sidebar
          active={page}
          setActive={handleSetPage}
          team={team}
          userRole={userRole}
        />
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-auto">
        <div className="bg-handball-bg2 border-b border-handball-border sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 py-3 md:px-7 md:py-4">
            <div className="flex items-center gap-3">
              <button
                className="p-1 rounded-md md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <img 
                  src="/favicon.ico" 
                  alt="HandballStats" 
                  className="w-7 h-7 rounded-md" 
                />
                <span className="font-semibold text-sm hidden sm:inline">{pageTitles[page]}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-right">
                {team && (
                  <div className="text-[12px] text-handball-text3 hidden sm:block">
                    {team.name} · {team.category}
                  </div>
                )}
              </div>
              <select
                className="bg-handball-bg3 border border-handball-border2 rounded-md p-1.5 text-xs md:text-sm max-w-[120px] md:max-w-none"
                value={activeTeamId || ''}
                onChange={handleTeamChange}
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                {user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-handball-text2 hidden sm:inline">{user.email}</span>
                    <button
                      onClick={() => signOut()}
                      className="bg-handball-bg3 border border-handball-border2 px-2 py-1 rounded-md text-xs"
                    >
                      Sortir
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="bg-handball-accent text-white px-3 py-1.5 rounded-md text-xs"
                  >
                    Iniciar sessió
                  </button>
                )}
              </div>
            </div>
          </div>

          {team && (
            <div className="px-4 pb-2 text-[10px] text-handball-text3 border-t border-handball-border/50 md:hidden">
              {team.name} · {team.category} · {team.season}
            </div>
          )}
        </div>

        <div className="p-4 md:p-7 flex-1">
          {page === 'dashboard' && <Dashboard team={team} players={players} matches={matches} />}

          {page === 'live' && canAccessPage('live', userRole) && (
            <LiveMatch
              team={team}
              players={players}
              matches={matches.filter(m => !m.done)}
              onMatchEnd={() => refetch()}
              showToast={showToast}
              user={user}
              userRole={userRole}
            />
          )}

          {page === 'matches' && (
            <Matches
              team={team}
              matches={matches}
              onUpdateMatch={() => refetch()}
              showToast={showToast}
              user={user}
              userRole={userRole}
            />
          )}

          {page === 'ranking' && <Ranking teamId={activeTeamId} />}

          {page === 'players' && (
            <Players
              team={team}
              players={players}
              onUpdatePlayer={() => refetch()}
              showToast={showToast}
              user={user}
              userRole={userRole}
            />
          )}

          {page === 'stats' && <Stats players={players} />}

          {page === 'fch' && (userRole === 'entrenador' || userRole === 'segon_entrenador') && (
            <div className="space-y-6">
              <FCHImport onImportTeam={handleImportTeam} showToast={showToast} user={user} />
              <hr className="border-handball-border" />
              <TeamManagement user={user} onTeamChanged={fetchTeams} />
            </div>
          )}

          {page === 'shares' && userRole === 'entrenador' && (
            <div className="max-w-lg mx-auto">
              <h2 className="text-lg font-semibold mb-4">Gestió d'accés a l'equip</h2>
              {team && <TeamShares team={team} user={user} />}
            </div>
          )}

          {page === 'trainings' && (
            <div>
              <div className="flex gap-2 mb-4 border-b border-handball-border pb-2">
                <button
                  className={`px-3 py-1 rounded-md text-sm ${trainingView === 'list' ? 'bg-handball-accent text-white' : 'text-handball-text2 hover:text-handball-text'}`}
                  onClick={() => { setTrainingView('list'); setSelectedTraining(null) }}
                >
                  Llista
                </button>
                <button
                  className={`px-3 py-1 rounded-md text-sm ${trainingView === 'stats' ? 'bg-handball-accent text-white' : 'text-handball-text2 hover:text-handball-text'}`}
                  onClick={() => { setTrainingView('stats'); setSelectedTraining(null) }}
                >
                  Estadístiques
                </button>
              </div>

              {trainingView === 'list' && (
                <TrainingList
                  teamId={activeTeamId}
                  onSelectTraining={handleSelectTraining}
                  user={user}
                  userRole={userRole}
                />
              )}
              {trainingView === 'live' && selectedTraining && (
                <TrainingLive
                  training={selectedTraining}
                  team={team}
                  players={players}
                  onFinish={() => {
                    setTrainingView('list')
                    setSelectedTraining(null)
                    refetch()
                  }}
                  showToast={showToast}
                  user={user}
                  userRole={userRole}
                />
              )}
              {trainingView === 'stats' && <TrainingStats teamId={activeTeamId} />}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast key={toast.id} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App