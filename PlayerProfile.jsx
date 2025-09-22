import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { User, Trophy, Target, TrendingUp, Calendar, MapPin } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import LoadingSpinner from './ui/LoadingSpinner'

const PlayerProfile = () => {
  const { playerId } = useParams()
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlayerData()
  }, [playerId])

  const loadPlayerData = async () => {
    setLoading(true)
    
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Dados simulados do jogador
    const mockPlayer = {
      id: parseInt(playerId),
      name: 'Vinícius Júnior',
      fullName: 'Vinícius José Paixão de Oliveira Júnior',
      age: 23,
      nationality: 'Brazilian',
      birthDate: '2000-07-12',
      birthPlace: 'São Gonçalo, Brazil',
      height: '176 cm',
      weight: '73 kg',
      position: 'Left Winger',
      team: {
        name: 'Real Madrid',
        logo: '/api/placeholder/60/60',
        country: 'Spain'
      },
      league: {
        name: 'La Liga',
        country: 'Spain',
        multiplier: 0.95
      },
      spp_score: 923.4,
      rank: 1,
      statistics: {
        games: 28,
        goals: 15,
        assists: 6,
        minutes: 2340,
        rating: 8.2,
        yellowCards: 3,
        redCards: 0,
        penaltyScored: 2,
        penaltyMissed: 0
      },
      sppBreakdown: {
        goals: {
          count: 15,
          pointsPer: 9.5,
          totalPoints: 142.5
        },
        assists: {
          count: 6,
          pointsPer: 4.75,
          totalPoints: 28.5
        },
        penalties: {
          yellowCards: 3,
          redCards: 0,
          penaltyPoints: -3.0
        },
        leagueMultiplier: 0.95,
        positionCategory: 'Attacker'
      },
      photo: '/api/placeholder/200/200'
    }
    
    setPlayer(mockPlayer)
    setLoading(false)
  }

  const getPositionColor = (position) => {
    if (position.includes('Winger') || position.includes('Forward') || position.includes('Striker')) {
      return 'bg-red-100 text-red-800'
    }
    return 'bg-blue-100 text-blue-800'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Carregando...</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Jogador não encontrado</h1>
          <p className="text-slate-600 mt-2">O jogador solicitado não foi encontrado no sistema</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Photo */}
            <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center">
              <User className="w-16 h-16 text-slate-400" />
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{player.name}</h1>
                <Badge className={getPositionColor(player.position)}>
                  {player.position}
                </Badge>
              </div>
              
              <p className="text-slate-600 mb-4">{player.fullName}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Idade</p>
                  <p className="font-semibold">{player.age} anos</p>
                </div>
                <div>
                  <p className="text-slate-500">Nacionalidade</p>
                  <p className="font-semibold">{player.nationality}</p>
                </div>
                <div>
                  <p className="text-slate-500">Altura</p>
                  <p className="font-semibold">{player.height}</p>
                </div>
                <div>
                  <p className="text-slate-500">Peso</p>
                  <p className="font-semibold">{player.weight}</p>
                </div>
              </div>
            </div>

            {/* SPP Score */}
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900 mb-1">
                {player.spp_score.toFixed(1)}
              </div>
              <div className="text-sm text-slate-500 mb-2">SPP Score</div>
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                #{player.rank} Global
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team & League Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Clube e Liga</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{player.team.name}</h3>
                  <p className="text-sm text-slate-600">{player.team.country}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                  <Target className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{player.league.name}</h3>
                  <p className="text-sm text-slate-600">
                    Multiplicador SPP: {player.league.multiplier}x
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Informações Pessoais</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-sm text-slate-500">Data de Nascimento:</span>
                  <span className="ml-2 font-medium">{player.birthDate}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-sm text-slate-500">Local de Nascimento:</span>
                  <span className="ml-2 font-medium">{player.birthPlace}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Estatísticas da Temporada</span>
          </CardTitle>
          <CardDescription>Temporada 2023/24</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{player.statistics.games}</div>
              <div className="text-sm text-slate-500">Jogos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{player.statistics.goals}</div>
              <div className="text-sm text-slate-500">Gols</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{player.statistics.assists}</div>
              <div className="text-sm text-slate-500">Assistências</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{player.statistics.rating}</div>
              <div className="text-sm text-slate-500">Rating Médio</div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Minutos Jogados</span>
                <span>{player.statistics.minutes} min</span>
              </div>
              <Progress value={(player.statistics.minutes / 2520) * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Participação em Gols</span>
                <span>{player.statistics.goals + player.statistics.assists}</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SPP Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento da Pontuação SPP</CardTitle>
          <CardDescription>
            Como a pontuação SPP é calculada para este jogador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <span className="font-medium">Gols</span>
                <span className="text-sm text-slate-600 ml-2">
                  {player.sppBreakdown.goals.count} × {player.sppBreakdown.goals.pointsPer} pts
                </span>
              </div>
              <span className="font-bold text-green-600">
                +{player.sppBreakdown.goals.totalPoints.toFixed(1)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <span className="font-medium">Assistências</span>
                <span className="text-sm text-slate-600 ml-2">
                  {player.sppBreakdown.assists.count} × {player.sppBreakdown.assists.pointsPer} pts
                </span>
              </div>
              <span className="font-bold text-blue-600">
                +{player.sppBreakdown.assists.totalPoints.toFixed(1)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div>
                <span className="font-medium">Penalizações</span>
                <span className="text-sm text-slate-600 ml-2">
                  {player.sppBreakdown.penalties.yellowCards} cartões amarelos
                </span>
              </div>
              <span className="font-bold text-red-600">
                {player.sppBreakdown.penalties.penaltyPoints.toFixed(1)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <div>
                <span className="font-medium">Multiplicador da Liga</span>
                <span className="text-sm text-slate-600 ml-2">
                  {player.league.name} ({player.sppBreakdown.leagueMultiplier}x)
                </span>
              </div>
              <span className="font-bold text-purple-600">
                ×{player.sppBreakdown.leagueMultiplier}
              </span>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Pontuação Final SPP</span>
                <span className="text-2xl font-bold text-slate-900">
                  {player.spp_score.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PlayerProfile

