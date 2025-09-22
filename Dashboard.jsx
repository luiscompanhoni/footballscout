import { useState, useEffect } from 'react'
import { Trophy, Users, Globe, TrendingUp, Star, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from './ui/LoadingSpinner'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [topPlayers, setTopPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carregamento de dados
    const loadData = async () => {
      setLoading(true)
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Dados simulados
      setStats({
        totalPlayers: 2847,
        totalLeagues: 9,
        avgSppScore: 156.7,
        topScore: 923.4
      })

      setTopPlayers([
        {
          id: 1,
          name: 'Vinícius Júnior',
          team: 'Real Madrid',
          league: 'La Liga',
          spp_score: 923.4,
          position: 'Attacker',
          photo: '/api/placeholder/60/60'
        },
        {
          id: 2,
          name: 'Kylian Mbappé',
          team: 'PSG',
          league: 'Ligue 1',
          spp_score: 648.2,
          position: 'Attacker',
          photo: '/api/placeholder/60/60'
        },
        {
          id: 3,
          name: 'Harry Kane',
          team: 'Bayern Munich',
          league: 'Bundesliga',
          spp_score: 584.1,
          position: 'Attacker',
          photo: '/api/placeholder/60/60'
        },
        {
          id: 4,
          name: 'Erling Haaland',
          team: 'Manchester City',
          league: 'Premier League',
          spp_score: 567.8,
          position: 'Attacker',
          photo: '/api/placeholder/60/60'
        },
        {
          id: 5,
          name: 'Lionel Messi',
          team: 'Inter Miami',
          league: 'MLS',
          spp_score: 534.9,
          position: 'Attacker',
          photo: '/api/placeholder/60/60'
        }
      ])
      
      setLoading(false)
    }

    loadData()
  }, [])

  const statCards = [
    {
      title: 'Total de Jogadores',
      value: stats?.totalPlayers?.toLocaleString() || '0',
      description: 'Jogadores monitorados',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Ligas Ativas',
      value: stats?.totalLeagues || '0',
      description: 'Principais competições',
      icon: Globe,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'SPP Médio',
      value: stats?.avgSppScore?.toFixed(1) || '0.0',
      description: 'Pontuação média',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Maior SPP',
      value: stats?.topScore?.toFixed(1) || '0.0',
      description: 'Melhor pontuação',
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-2">Visão geral do sistema de performance</p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Visão geral do sistema de performance de jogadores</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Players */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>Top 5 Jogadores</span>
            </CardTitle>
            <CardDescription>
              Jogadores com maior pontuação SPP na temporada atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPlayers.map((player, index) => (
                <div key={player.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                    {index + 1}
                  </div>
                  
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{player.name}</h4>
                    <p className="text-sm text-slate-600">{player.team} • {player.league}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-lg text-slate-900">{player.spp_score}</p>
                    <Badge variant="secondary" className="text-xs">
                      {player.position}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <Link to="/ranking/global">
                <Button className="w-full" variant="outline">
                  Ver Ranking Completo
                  <TrendingUp className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesse rapidamente as principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Link to="/ranking/global">
                <Button className="w-full justify-start" variant="outline">
                  <Trophy className="w-4 h-4 mr-2" />
                  Ranking Global
                </Button>
              </Link>
              
              <Link to="/ranking/continent/Europe">
                <Button className="w-full justify-start" variant="outline">
                  <Globe className="w-4 h-4 mr-2" />
                  Rankings Europeus
                </Button>
              </Link>
              
              <Link to="/ranking/league/39">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Premier League
                </Button>
              </Link>
              
              <Link to="/ranking/league/140">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  La Liga
                </Button>
              </Link>
              
              <Link to="/ranking/position/Attacker">
                <Button className="w-full justify-start" variant="outline">
                  <Target className="w-4 h-4 mr-2" />
                  Melhores Atacantes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre o Sistema SPP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Sistema Ponderado</h3>
              <p className="text-sm text-slate-600">
                Avaliação objetiva baseada em performance individual e dificuldade das competições
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Dados em Tempo Real</h3>
              <p className="text-sm text-slate-600">
                Estatísticas atualizadas regularmente das principais ligas mundiais
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Cobertura Global</h3>
              <p className="text-sm text-slate-600">
                Monitoramento das principais ligas da Europa, América do Sul e outras regiões
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard

