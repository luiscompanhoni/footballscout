import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Trophy, Users, Globe, Target, TrendingUp } from 'lucide-react'
import './App.css'

// Components
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import GlobalRanking from './components/GlobalRanking'
import LeagueRanking from './components/LeagueRanking'
import ContinentalRanking from './components/ContinentalRanking'
import PlayerProfile from './components/PlayerProfile'
import LoadingSpinner from './components/ui/LoadingSpinner'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
            <h1 className="text-4xl font-bold text-white mb-2">Football SPP Monitor</h1>
            <p className="text-slate-300">Sistema Ponderado de Performance</p>
          </div>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'} lg:ml-64`}>
            <div className="p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/ranking/global" element={<GlobalRanking />} />
                <Route path="/ranking/league/:leagueId" element={<LeagueRanking />} />
                <Route path="/ranking/continent/:continent" element={<ContinentalRanking />} />
                <Route path="/player/:playerId" element={<PlayerProfile />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App

