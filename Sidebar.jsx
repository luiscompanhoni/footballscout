import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Trophy, 
  Globe, 
  Users, 
  Target, 
  TrendingUp, 
  Settings,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()

  const menuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      path: '/',
      description: 'Visão geral do sistema'
    },
    {
      title: 'Ranking Global',
      icon: Trophy,
      path: '/ranking/global',
      description: 'Melhores jogadores do mundo'
    },
    {
      title: 'Por Continente',
      icon: Globe,
      path: '/ranking/continent',
      description: 'Rankings continentais',
      submenu: [
        { title: 'Europa', path: '/ranking/continent/Europe' },
        { title: 'América do Sul', path: '/ranking/continent/South America' },
        { title: 'América do Norte', path: '/ranking/continent/North America' }
      ]
    },
    {
      title: 'Por Liga',
      icon: Users,
      path: '/ranking/league',
      description: 'Rankings por liga',
      submenu: [
        { title: 'Premier League', path: '/ranking/league/39' },
        { title: 'La Liga', path: '/ranking/league/140' },
        { title: 'Serie A', path: '/ranking/league/135' },
        { title: 'Bundesliga', path: '/ranking/league/78' },
        { title: 'Ligue 1', path: '/ranking/league/61' },
        { title: 'Brasileirão', path: '/ranking/league/71' }
      ]
    },
    {
      title: 'Por Posição',
      icon: Target,
      path: '/ranking/position',
      description: 'Rankings por posição',
      submenu: [
        { title: 'Goleiros', path: '/ranking/position/Goalkeeper' },
        { title: 'Defensores', path: '/ranking/position/Defender' },
        { title: 'Meio-campistas', path: '/ranking/position/Midfielder' },
        { title: 'Atacantes', path: '/ranking/position/Attacker' }
      ]
    },
    {
      title: 'Estatísticas',
      icon: TrendingUp,
      path: '/stats',
      description: 'Análises e tendências'
    }
  ]

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 lg:hidden">
            <div className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <span className="font-bold text-slate-900">Football SPP</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <div key={item.path}>
                <Link
                  to={item.path === '/ranking/continent' || item.path === '/ranking/league' || item.path === '/ranking/position' ? '#' : item.path}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive(item.path) 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                  onClick={item.submenu ? (e) => e.preventDefault() : onClose}
                >
                  <item.icon className="w-5 h-5" />
                  <div className="flex-1">
                    <div>{item.title}</div>
                    <div className="text-xs text-slate-400">{item.description}</div>
                  </div>
                </Link>

                {/* Submenu */}
                {item.submenu && (
                  <div className="ml-8 mt-2 space-y-1">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.path}
                        to={subitem.path}
                        className={`
                          block px-3 py-1 text-sm rounded-md transition-colors
                          ${isActive(subitem.path)
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                          }
                        `}
                        onClick={onClose}
                      >
                        {subitem.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

