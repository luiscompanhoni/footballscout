import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { clienteAPI } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

const STATUS_LABEL = { PLANEJAMENTO: 'Planejamento', EM_ANDAMENTO: 'Em andamento', PARALISADA: 'Paralisada', CONCLUIDA: 'Concluída' };
const STATUS_COLORS = { PLANEJAMENTO: '#6b7280', EM_ANDAMENTO: '#2563eb', PARALISADA: '#d97706', CONCLUIDA: '#16a34a' };

function ObraCard({ obra }) {
  const color = STATUS_COLORS[obra.status] || '#6b7280';
  const gastoPercent = obra.orcamentoPrevisto > 0
    ? Math.min(100, (obra.gastoTotal / obra.orcamentoPrevisto) * 100)
    : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(cliente)/obra-detalhe?id=${obra.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{obra.nome}</Text>
        <View style={[styles.badge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.badgeText, { color }]}>{STATUS_LABEL[obra.status]}</Text>
        </View>
      </View>
      <Text style={styles.cardSub}>{obra.endereco}</Text>

      {/* Progresso */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progresso geral</Text>
          <Text style={styles.progressPercent}>{obra.progressoGeral}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${obra.progressoGeral}%`, backgroundColor: '#f97316' }]} />
        </View>
      </View>

      {/* Orçamento */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Orçamento utilizado</Text>
          <Text style={[styles.progressPercent, gastoPercent >= 100 ? { color: '#dc2626' } : gastoPercent >= 80 ? { color: '#d97706' } : {}]}>
            {gastoPercent.toFixed(0)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            { width: `${gastoPercent}%`, backgroundColor: gastoPercent >= 100 ? '#dc2626' : gastoPercent >= 80 ? '#d97706' : '#16a34a' }
          ]} />
        </View>
        <View style={styles.orcRow}>
          <Text style={styles.orcText}>Gasto: {formatCurrency(obra.gastoTotal)}</Text>
          <Text style={styles.orcText}>Prev: {formatCurrency(obra.orcamentoPrevisto)}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
          <Text style={styles.footerText}>
            Previsão: {obra.dataPrevisaoFim ? format(new Date(obra.dataPrevisaoFim), 'dd/MM/yyyy') : '—'}
          </Text>
        </View>
        {obra.totalAtualizacoes > 0 && (
          <View style={styles.footerItem}>
            <Ionicons name="camera-outline" size={13} color="#9ca3af" />
            <Text style={styles.footerText}>{obra.totalAtualizacoes} atualizações</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ClienteObras() {
  const { data: obras, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['cliente-obras'],
    queryFn: () => clienteAPI.minhasObras().then(r => r.data),
  });

  return (
    <FlatList
      data={obras || []}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <ObraCard obra={item} />}
      contentContainerStyle={styles.list}
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="construct-outline" size={56} color="#d1d5db" />
          <Text style={styles.emptyText}>{isLoading ? 'Carregando...' : 'Nenhuma obra vinculada'}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  list: { padding: 12, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  cardSub: { fontSize: 12, color: '#6b7280', marginBottom: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  progressSection: { marginBottom: 10 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 12, color: '#6b7280' },
  progressPercent: { fontSize: 12, fontWeight: '600', color: '#111827' },
  progressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  orcRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  orcText: { fontSize: 11, color: '#9ca3af' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: '#9ca3af' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#9ca3af' },
});
