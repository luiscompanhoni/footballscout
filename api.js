const API_BASE_URL = 'http://localhost:5000/api'

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Status da API
  async getApiStatus() {
    return this.request('/status')
  }

  // Ligas
  async getLeagues() {
    return this.request('/leagues')
  }

  async syncLeagues() {
    return this.request('/leagues/sync', { method: 'POST' })
  }

  // Jogadores
  async getTopPlayers(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/players/top${queryString ? `?${queryString}` : ''}`)
  }

  async syncPlayers(leagueId, season = 2023) {
    return this.request('/players/sync', {
      method: 'POST',
      body: JSON.stringify({ league_id: leagueId, season })
    })
  }

  // Rankings SPP
  async getGlobalRanking(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/spp/rankings/global${queryString ? `?${queryString}` : ''}`)
  }

  async getLeagueRanking(leagueId, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/spp/rankings/league/${leagueId}${queryString ? `?${queryString}` : ''}`)
  }

  async getContinentalRanking(continent, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/spp/rankings/continent/${continent}${queryString ? `?${queryString}` : ''}`)
  }

  async getPositionRanking(position, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/spp/rankings/position/${position}${queryString ? `?${queryString}` : ''}`)
  }

  async getPlayerSpp(playerId, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/spp/player/${playerId}/spp${queryString ? `?${queryString}` : ''}`)
  }

  async recalculateSppScores(season = 2023) {
    return this.request('/spp/recalculate', {
      method: 'POST',
      body: JSON.stringify({ season })
    })
  }

  async getStatsOverview(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/spp/stats/overview${queryString ? `?${queryString}` : ''}`)
  }
}

export default new ApiService()

