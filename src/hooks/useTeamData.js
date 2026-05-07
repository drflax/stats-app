import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTeamData(teamId) {
  const [team, setTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userRole, setUserRole] = useState(null) // 'owner', 'edit', 'view'

  const fetchData = useCallback(async () => {
    if (!teamId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      // Obtenir equip
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()
      if (teamError) throw teamError

      // Obtenir jugadors
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('number', { ascending: true })
      if (playersError) throw playersError

      // Obtenir partits
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('team_id', teamId)
        .order('date', { ascending: true })
      if (matchesError) throw matchesError

      // Determinar rol de l'usuari actual
      const currentUser = await supabase.auth.getUser()
      const userId = currentUser.data.user?.id
      let role = null
      if (teamData.user_id === userId) {
        role = 'entrenador'
      } else {
        const { data: share } = await supabase
          .from('team_shares')
          .select('role')
          .eq('team_id', teamId)
          .eq('user_id', userId)
          .single()
        role = share?.role || null
      }
      setUserRole(role)
      setTeam(teamData)
      setPlayers(playersData || [])
      setMatches(matchesData || [])
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { team, players, matches, loading, error, userRole, refetch: fetchData }
}