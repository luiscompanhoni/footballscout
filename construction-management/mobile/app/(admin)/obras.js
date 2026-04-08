import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, RefreshControl
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { obrasAPI } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { format } from 'date-fns';

const STATUS_LABEL = { PLANEJAMENTO: 'Planejamento', EM_ANDAMENTO: 'Em andamento', PARALISADA: 'Paralisada', CONCLUIDA: 'Concluída' };
const STATUS_COLORS = { PLANEJAMENTO: '#6b7280', EM_ANDAMENTO: '#2563eb', PARALISADA: '#d97706', CONCLUIDA: '#16a34a' };
const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

function ObraCard({ obra }) {
  const color = STATUS_COLORS[obra.status] || '#6b7280';
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(admin)/obra-detalhe?id=${obra.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{obra.nome}</Text>
        <View style={[styles.badge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.badgeText, { color }]}>{STATUS_LABEL[obra.status]}</Text>
        </View>
      </View>
      <Text style={styles.cardSub}>{obra.cliente?.nome} · {obra.endereco}</Text>

      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${obra.progressoGeral}%`, backgroundColor: '#2563eb' }]} />
        </View>
        <Text style={styles.progressText}>{obra.progressoGeral}%</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>{formatCurrency(obra.orcamentoPrevisto)}</Text>
        <Text style={styles.footerDate}>
          {obra.dataPrevisaoFim ? format(new Date(obra.dataPrevisaoFim), 'dd/MM/yyyy') : '—'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminObras() {
  const [search, setSearch] = useState('');
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['obras'],
    queryFn: () => obrasAPI.listar().then(r => r.data),
  });

  const obras = data?.obras?.filter(o =>
    o.nome.toLowerCase().includes(search.toLowerCase()) ||
    o.cliente?.nome?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar obra ou cliente..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={obras}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ObraCard obra={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="construct-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {isLoading ? 'Carregando...' : 'Nenhuma obra encontrada'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 12, marginVertical: 10, borderRadius: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#111827' },
  list: { padding: 12, paddingTop: 0, gap: 8 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  cardSub: { fontSize: 12, color: '#6b7280', marginBottom: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#6b7280', width: 30 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 8 },
  footerText: { fontSize: 13, fontWeight: '600', color: '#111827' },
  footerDate: { fontSize: 12, color: '#9ca3af' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#9ca3af' },
});
