import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

// Páginas públicas
import Login from './pages/Login.jsx';
import RedefinirSenha from './pages/RedefinirSenha.jsx';

// Layout
import AdminLayout from './components/AdminLayout.jsx';
import ClienteLayout from './components/ClienteLayout.jsx';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminObras from './pages/admin/Obras.jsx';
import AdminObraDetalhe from './pages/admin/ObraDetalhe.jsx';
import AdminOrcamentos from './pages/admin/Orcamentos.jsx';
import AdminEtapas from './pages/admin/Etapas.jsx';
import AdminEquipe from './pages/admin/Equipe.jsx';
import AdminMateriais from './pages/admin/Materiais.jsx';
import AdminDiario from './pages/admin/Diario.jsx';
import AdminRelatorios from './pages/admin/Relatorios.jsx';
import AdminClientes from './pages/admin/Clientes.jsx';

// Cliente pages
import ClienteDashboard from './pages/cliente/Dashboard.jsx';
import ClienteObraDetalhe from './pages/cliente/ObraDetalhe.jsx';
import ClienteOrcamentos from './pages/cliente/Orcamentos.jsx';
import ClienteDiario from './pages/cliente/Diario.jsx';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/cliente'} replace />;
  }
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/cliente'} replace /> : <Login />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="obras" element={<AdminObras />} />
        <Route path="obras/:id" element={<AdminObraDetalhe />} />
        <Route path="orcamentos" element={<AdminOrcamentos />} />
        <Route path="etapas" element={<AdminEtapas />} />
        <Route path="equipe" element={<AdminEquipe />} />
        <Route path="materiais" element={<AdminMateriais />} />
        <Route path="diario" element={<AdminDiario />} />
        <Route path="relatorios" element={<AdminRelatorios />} />
        <Route path="clientes" element={<AdminClientes />} />
      </Route>

      {/* Cliente routes */}
      <Route path="/cliente" element={<ProtectedRoute role="CLIENTE"><ClienteLayout /></ProtectedRoute>}>
        <Route index element={<ClienteDashboard />} />
        <Route path="obras/:id" element={<ClienteObraDetalhe />} />
        <Route path="orcamentos" element={<ClienteOrcamentos />} />
        <Route path="diario" element={<ClienteDiario />} />
      </Route>

      {/* Redirect root */}
      <Route path="/" element={<Navigate to={user?.role === 'ADMIN' ? '/admin' : user ? '/cliente' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
