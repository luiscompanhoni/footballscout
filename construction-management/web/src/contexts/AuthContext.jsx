import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('gerobras_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gerobras_token');
    if (token) {
      authAPI.me()
        .then((res) => setUser(res.data.usuario))
        .catch(() => {
          localStorage.removeItem('gerobras_token');
          localStorage.removeItem('gerobras_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, senha) => {
    const res = await authAPI.login({ email, senha });
    const { usuario, token } = res.data;
    localStorage.setItem('gerobras_token', token);
    localStorage.setItem('gerobras_user', JSON.stringify(usuario));
    setUser(usuario);
    return usuario;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gerobras_token');
    localStorage.removeItem('gerobras_user');
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const isCliente = user?.role === 'CLIENTE';

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin, isCliente }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};
