import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Building2, FileText, BookOpen, LogOut, HardHat } from 'lucide-react';
import NotificationBell from './NotificationBell.jsx';

const navItems = [
  { to: '/cliente', label: 'Minhas Obras', icon: Building2, end: true },
  { to: '/cliente/orcamentos', label: 'Orçamentos', icon: FileText },
  { to: '/cliente/diario', label: 'Diário de Obra', icon: BookOpen },
];

export default function ClienteLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <HardHat size={24} className="text-construction-orange" />
              <span className="text-xl font-bold">GerObras</span>
              <span className="text-gray-400 text-sm ml-2">Portal do Cliente</span>
            </div>
            <nav className="flex items-center gap-1">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              ))}
              <div className="ml-2 flex items-center gap-3">
                <NotificationBell />
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium">{user?.nome}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  title="Sair"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
