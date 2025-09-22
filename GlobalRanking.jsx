import { useState, useEffect } from 'react'
import { Trophy, Users, Filter, Search, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import LoadingSpinner from './ui/LoadingSpinner'

const GlobalRanking = () => {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('Todas')
  const [selectedSeason, setSelectedSeason] = useState('2023')

  useEffect(() => {
    loadPlayers()
  }, [selectedPosition, selectedSeason])

  const loadPlayers = async () => {
    setLoading(true)
    
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Dados simulados expandidos
    const mockPlayers = [
      {
        id: 1,
        name: 'Vinícius Júnior',
        team: 'Real Madrid',
        league: 'La Liga',
        country: 'Spain',
        spp_score: 923.4,
        position: 'Attacker',
        goals: 15,
        assists: 6,
        games: 28,
        rating: 8.2,
        photo: '/api/placeholder/60/60'
      },
      {
        id: 2,
        name: 'Kylian Mbappé',
        team: 'PSG',
        league: 'Ligue 1',
        country: 'France',
        spp_score: 648.2,
        position: 'Attacker',
        goals: 27,
        assists: 7,
        games: 30,
        rating: 8.1,
        photo: '/api/placeholder/60/60'
      },
      {
        id: 3,
        name: 'Harry Kane',
        team: 'Bayern Munich',
        league: 'Bundesliga',
        country: 'Germany',
        spp_score: 584.1,
        position: 'Attacker',
        goals: 36,
        assists: 8,
        games: 32,
        rating: 8.0,
        photo: '/api/placeholder/60/60'
      },
      {
        id: 4,
        name: 'Erling Haaland',
        team: 'Manchester City',
        league: 'Premier League',
        country: 'England',
        spp_score: 567.8,
        position: 'Attacker',
        goals: 31,
        assists: 5,
        games: 29,
        rating: 7.9,
        photo: '/api/placeholder/60/60'
      },
      {
        id: 5,
        name: 'Kevin De Bruyne',
        team: 'Manchester City',
        league: 'Premier League',
        country: 'England',
        spp_score: 445.6,
        position: 'Midfielder',
        goals: 8,
        assists: 18,
        games: 26,
        rating: 8.3,
        photo: '/api/placeholder/60/60'
      },
      {
        id: 6,
        name: 'Virgil van Dijk',
        team: 'Liverpool',
        league: 'Premier League',
        country: 'England',
        spp_score: 331.2,
        position: 'Defender',
        goals: 2,
        assists: 1,
        games: 30,
        rating: 7.8,
        photo: '/api/placeholder/60/60'
      },
      {
        id: 7,
        name: 'Alisson Becker',
        team: 'Liverpool',
        league: 'Premier League',
        country: 'England',
        spp_score: 298.7,
        position: 'Goalkeeper',
        goals: 0,
        assists: 0,
        games: 28,
        rating: 7.6,
        photo: '/api/placeholder/60/60'
      }
    ]
    
    setPlayers(mockPlayers)
    setLoading(false)
  }

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPosition = selectedPosition === 'Todas' || player.position === selectedPosition
    
    return matchesSearch && matchesPosition
  })

  const positions = ['Todas', 'Attacker', 'Midfielder', 'Defender', 'Goalkeeper']
  const seasons = ['2023', '2022', '2021']

  const getPositionColor = (position) => {
    const colors = {
      'Attacker': 'bg-red-100 text-red-800',
      'Midfielder': 'bg-blue-100 text-blue-800',
      'Defender': 'bg-green-100 text-green-800',
      'Goalkeeper': 'bg-yellow-100 text-yellow-800'
    }
    return colors[position] || 'bg-gray-100 text-gray-800'
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center space-x-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <span>Ranking Global</span>
        </h1>
        <p className="text-slate-600 mt-2">Os melhores jogadores do mundo por pontuação SPP</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar jogadores ou times..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Position Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  {selectedPosition}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {positions.map((position) => (
                  <DropdownMenuItem 
                    key={position}
                    onClick={() => setSelectedPosition(position)}
                  >
                    {position}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Season Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[100px]">
                  {selectedSeason}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {seasons.map((season) => (
                  <DropdownMenuItem 
                    key={season}
                    onClick={() => setSelectedSeason(season)}
                  >
                    {season}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Ranking - Temporada {selectedSeason}
          </CardTitle>
          <CardDescription>
            {filteredPlayers.length} jogadores encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlayers.map((player, index) => (
                <div 
                  key={player.id} 
                  className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 font-bold text-slate-700">
                    {getRankIcon(index + 1)}
                  </div>

                  {/* Photo */}
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>

                  {/* Player Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-bold text-lg text-slate-900">{player.name}</h3>
                      <Badge className={getPositionColor(player.position)}>
                        {player.position}
                      </Badge>
                    </div>
                    <p className="text-slate-600 text-sm">
                      {player.team} • {player.league} ({player.country})
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                      <span>{player.games} jogos</span>
                      <span>{player.goals} gols</span>
                      <span>{player.assists} assistências</span>
                      <span>Rating: {player.rating}</span>
                    </div>
                  </div>

                  {/* SPP Score */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">
                      {player.spp_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-500">SPP</div>
                  </div>
                </div>
              ))}

              {filteredPlayers.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Nenhum jogador encontrado</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default GlobalRanking

