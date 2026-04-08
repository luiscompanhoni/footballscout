import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function AdminPerfil() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.nome?.[0]?.toUpperCase()}</Text>
      </View>
      <Text style={styles.nome}>{user?.nome}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <View style={styles.roleBadge}>
        <Ionicons name="shield-checkmark" size={14} color="#2563eb" />
        <Text style={styles.roleText}>Administrador</Text>
      </View>

      <View style={styles.menu}>
        {[
          { icon: 'construct-outline', label: 'Gerenciar Obras', action: () => router.push('/(admin)/obras') },
          { icon: 'book-outline', label: 'Diário de Obra', action: () => router.push('/(admin)/diario') },
          { icon: 'bar-chart-outline', label: 'Relatórios', action: () => router.push('/(admin)/relatorios') },
        ].map(({ icon, label, action }) => (
          <TouchableOpacity key={label} style={styles.menuItem} onPress={action}>
            <View style={styles.menuIcon}>
              <Ionicons name={icon} size={20} color="#2563eb" />
            </View>
            <Text style={styles.menuLabel}>{label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', alignItems: 'center', paddingTop: 40 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  nome: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  email: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  roleText: { fontSize: 13, color: '#2563eb', fontWeight: '500' },
  menu: { width: '100%', paddingHorizontal: 16, marginTop: 32, gap: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, padding: 14, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 20 },
  logoutText: { fontSize: 15, color: '#dc2626', fontWeight: '500' },
});
