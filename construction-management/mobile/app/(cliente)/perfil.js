import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ClientePerfil() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive',
        onPress: async () => { await logout(); router.replace('/(auth)/login'); }
      },
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
        <Ionicons name="person-circle" size={14} color="#f97316" />
        <Text style={styles.roleText}>Portal do Cliente</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Seu acesso</Text>
        <Text style={styles.infoDesc}>
          Como cliente, você pode visualizar suas obras, acompanhar o progresso das etapas, aprovar ou reprovar orçamentos e ver as atualizações do diário de obra.
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  nome: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  email: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  roleText: { fontSize: 13, color: '#ea580c', fontWeight: '500' },
  infoBox: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 32, width: '100%' },
  infoTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 8 },
  infoDesc: { fontSize: 13, color: '#6b7280', lineHeight: 20 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, padding: 14, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 24 },
  logoutText: { fontSize: 15, color: '#dc2626', fontWeight: '500' },
});
