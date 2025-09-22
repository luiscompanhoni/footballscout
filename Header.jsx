import { Menu, Trophy, Search, Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const Header = ({ onMenuClick }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Football SPP</h1>
              <p className="text-xs text-slate-500">Sistema de Performance</p>
            </div>
          </div>
        </div>

        {/* Center section - Search */}
        <div className="hidden md:flex items-center space-x-4 flex-1 max-w-md mx-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar jogadores, times ou ligas..."
              className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <Bell className="w-5 h-5" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Header

