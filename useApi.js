import { useState, useEffect } from 'react'
import apiService from '../services/api'

export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await apiCall()
        
        if (isMounted) {
          setData(result)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Erro ao carregar dados')
          console.error('API Error:', err)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, dependencies)

  const refetch = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await apiCall()
      setData(result)
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados')
      console.error('API Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch }
}

export const useGlobalRanking = (params = {}) => {
  return useApi(
    () => apiService.getGlobalRanking(params),
    [JSON.stringify(params)]
  )
}

export const useLeagueRanking = (leagueId, params = {}) => {
  return useApi(
    () => apiService.getLeagueRanking(leagueId, params),
    [leagueId, JSON.stringify(params)]
  )
}

export const useContinentalRanking = (continent, params = {}) => {
  return useApi(
    () => apiService.getContinentalRanking(continent, params),
    [continent, JSON.stringify(params)]
  )
}

export const usePositionRanking = (position, params = {}) => {
  return useApi(
    () => apiService.getPositionRanking(position, params),
    [position, JSON.stringify(params)]
  )
}

export const usePlayerProfile = (playerId, params = {}) => {
  return useApi(
    () => apiService.getPlayerSpp(playerId, params),
    [playerId, JSON.stringify(params)]
  )
}

export const useStatsOverview = (params = {}) => {
  return useApi(
    () => apiService.getStatsOverview(params),
    [JSON.stringify(params)]
  )
}

export const useLeagues = () => {
  return useApi(() => apiService.getLeagues(), [])
}

