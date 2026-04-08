import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { obrasAPI } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

const STATUS_LABEL = {
  PLANEJAMENTO: 'Planejamento', EM_ANDAMENTO: 'Em andamento',
  PARALISADA: 'Paralisada', CONCLUIDA: 'Concluída'
};
const STATUS_COLORS = {
  PLANEJAMENTO: '#6b7280', EM_ANDAMENTO: '#2563eb',
  PARALISADA: '#d97706', CONCLUIDA: '#16a34a'
};

export default function AdminDashboard() {
  const { data: resumo, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-resumo'],
    queryFn: () => obrasAPI.dashboard().then(r => r.data),
  });

  const { data: obrasData } = useQuery({
    queryKey: ['obras-recentes'],
    queryFn: () => obrasAPI.listar({ limit: 5 }).then(r => r.data),
  });

  const stats = [
    { label: 'Total', value: resumo?.totalObras || 0, icon: 'construct', color: '#2563eb' },
    { label: 'Em andamento', value: resumo?.statusCounts?.EM_ANDAMENTO || 0, icon: 'hammer', color: '#16a34a' },
    { label: 'Paralisadas', value: resumo?.statusCounts?.PARALISADA || 0, icon: 'warning', color: '#d97706' },
    { label: 'Concluídas', value: resumo?.statusCounts?.CONCLUIDA || 0, icon: 'checkmark-circle', color: '#7c3aed' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, Gestor!</Text>
        <Text style={styles.subtitle}>Resumo geral das obras</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        {stats.map(({ label, value, icon, color }) => (
          <View key={label} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
              <Ionicons name={icon} size={22} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Financeiro */}
      <View style={styles.financCard}>
        <Text style={styles.sectionTitle}>Financeiro Geral</Text>
        <View style={styles.financRow}>
          <View>
            <Text style={styles.financLabel}>Orçamento Total</Text>
            <Text style={styles.financValue}>{formatCurrency(resumo?.orcamentoTotal)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.financLabel}>Gasto Total</Text>
            <Text style={[styles.financValue, { color: '#dc2626' }]}>{formatCurrency(resumo?.gastoTotal)}</Text>
          </View>
        </View>
        {resumo?.orcamentoTotal > 0 && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, (resumo.gastoTotal / resumo.orcamentoTotal) * 100)}%`,
                  backgroundColor: resumo.gastoTotal > resumo.orcamentoTotal ? '#dc2626' : '#16a34a'
                }
              ]}
            />
          </View>
        )}
      </View>

      {/* Obras recentes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Obras Recentes</Text>
          <TouchableOpacity onPress={() => router.push('/(admin)/obras')}>
            <Text style={styles.seeAll}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        {obrasData?.obras?.map((obra) => (
          <TouchableOpacity
            key={obra.id}
            style={styles.obraCard}
            onPress={() => router.push(`/(admin)/obra-detalhe?id=${obra.id}`)}
          >
            <View style={styles.obraCardHeader}>
              <Text style={styles.obraNome} numberOfLines={1}>{obra.nome}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[obra.status] + '20' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[obra.status] }]}>
                  {STATUS_LABEL[obra.status]}
                </Text>
              </View>
            </View>
            <Text style={styles.obraCliente}>{obra.cliente?.nome}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${obra.progressoGeral}%`, backgroundColor: '#2563eb' }]} />
              </View>
              <Text style={styles.progressText}>{obra.progressoGeral}%</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { backgroundColor: '#1f2937', padding: 20, paddingTop: 16 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#9ca3af', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 12,
    padding: 16, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2,
  },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
  financCard: {
    backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2,
  },
  financRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  financLabel: { fontSize: 12, color: '#6b7280' },
  financValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  section: { padding: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  seeAll: { fontSize: 13, color: '#2563eb' },
  obraCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2,
  },
  obraCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  obraNome: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  obraCliente: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '500' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#6b7280', width: 32, textAlign: 'right' },
});
