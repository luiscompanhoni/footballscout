import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import * as Notifications from 'expo-notifications';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem('gerobras_token');
        if (token) {
          const res = await authAPI.me();
          setUser(res.data.usuario);
          await registerPushToken(res.data.usuario);
        }
      } catch {
        await AsyncStorage.multiRemove(['gerobras_token', 'gerobras_user']);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const registerPushToken = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      let finalStatus = status;
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        finalStatus = newStatus;
      }
      if (finalStatus !== 'granted') return;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      await authAPI.atualizarFCM(tokenData.data);
    } catch (e) {
      console.log('Push token error:', e.message);
    }
  };

  const login = useCallback(async (email, senha) => {
    const res = await authAPI.login({ email, senha });
    const { usuario, token } = res.data;
    await AsyncStorage.setItem('gerobras_token', token);
    await AsyncStorage.setItem('gerobras_user', JSON.stringify(usuario));
    setUser(usuario);
    await registerPushToken();
    return usuario;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['gerobras_token', 'gerobras_user']);
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
