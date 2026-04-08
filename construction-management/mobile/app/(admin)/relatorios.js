import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Share
} from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { obrasAPI, relatoriosAPI } from '../../src/services/api';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

export default function AdminRelatorios() {
  const [obraId, setObraId] = useState(null);

  const { data: obras } = useQuery({
    queryKey: ['obras'],
    queryFn: () => obrasAPI.listar().then(r => r.data),
  });

  const { data: relatorio } = useQuery({
    queryKey: ['relatorio-obra', obraId],
    queryFn: () => relatoriosAPI.obra(obraId).then(r => r.data),
    enabled: !!obraId,
  });

  const { data: financeiro } = useQuery({
    queryKey: ['financeiro', new Date().getFullYear()],
    queryFn: () => relatoriosAPI.financeiro(new Date().getFullYear()).then(r => r.data),
  });

  const shareRelatorio = async () => {
    if (!relatorio) return;
    const text = `
GerObras — Relatório: ${relatorio.obra.nome}
Orçamento previsto: ${formatCurrency(relatorio.financeiro?.orcamentoPrevisto)}
Gasto realizado: ${formatCurrency(relatorio.financeiro?.gastoTotal)}
Progresso: ${relatorio.progresso?.geral}%

Etapas:
${relatorio.progresso?.etapas?.map(e => `  ${e.ordem}. ${e.nome}: ${e.percentualReal}%`).join('\n')}
    `.trim();
    await Share.share({ message: text, title: `Relatório — ${relatorio.obra.nome}` });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Seleção de obra */}
      <Text style={styles.sectionTitle}>Relatório por Obra</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4, paddingHorizontal: 12 }}>
        {obras?.obras?.map(o => (
          <TouchableOpacity
            key={o.id}
            onPress={() => setObraId(o.id)}
            style={[styles.chip, obraId === o.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, obraId === o.id && styles.chipTextActive]}>{o.nome}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {relatorio && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{relatorio.obra?.nome}</Text>
            <TouchableOpacity onPress={shareRelatorio}>
              <Ionicons name="share-outline" size={22} color="#2563eb" />
            </TouchableOpacity>
          </View>

          {/* Financeiro */}
          <View style={styles.grid3}>
            {[
              { label: 'Previsto', value: formatCurrency(relatorio.financeiro?.orcamentoPrevisto), color: '#111827' },
              { label: 'Realizado', value: formatCurrency(relatorio.financeiro?.gastoTotal), color: '#dc2626' },
              { label: 'Saldo', value: formatCurrency(relatorio.financeiro?.saldo), color: relatorio.financeiro?.saldo >= 0 ? '#16a34a' : '#dc2626' },
            ].map(({ label, value, color }) => (
              <View key={label} style={styles.metricBox}>
                <Text style={styles.metricLabel}>{label}</Text>
                <Text style={[styles.metricValue, { color }]}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Barra orçamento */}
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, {
                width: `${Math.min(100, relatorio.financeiro?.orcamentoPrevisto > 0
                  ? (relatorio.financeiro.gastoTotal / relatorio.financeiro.orcamentoPrevisto) * 100
                  : 0)}%`,
                backgroundColor: relatorio.financeiro?.saldo < 0 ? '#dc2626' : '#16a34a',
              }]}
            />
          </View>

          {/* Etapas */}
          <Text style={[styles.sectionTitle, { marginTop: 16, marginBottom: 10 }]}>
            Progresso — {relatorio.progresso?.geral}%
          </Text>
          {relatorio.progresso?.etapas?.map(e => (
            <View key={e.nome} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ fontSize: 13, color: '#374151' }}>{e.ordem}. {e.nome}</Text>
                <Text style={{ fontSize: 13, color: '#6b7280' }}>{e.percentualReal}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${e.percentualReal}%`, backgroundColor: '#2563eb' }]} />
              </View>
            </View>
          ))}

          {/* Equipe */}
          {relatorio.equipe?.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 16, marginBottom: 8 }]}>Equipe</Text>
              {relatorio.equipe.map(eq => (
                <View key={eq.nome} style={styles.equipeRow}>
                  <View>
                    <Text style={styles.equipeNome}>{eq.nome}</Text>
                    <Text style={styles.equipeFuncao}>{eq.funcao}</Text>
                  </View>
                  <Text style={styles.equipePago}>{formatCurrency(eq.totalPago)}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}

      {/* Resumo Financeiro Anual */}
      {financeiro && (
        <View style={[styles.card, { marginBottom: 24 }]}>
          <Text style={styles.cardTitle}>Financeiro {new Date().getFullYear()}</Text>
          <View style={styles.grid3}>
            {[
              { label: 'Orçamentos', value: formatCurrency(financeiro.totalOrcamentoPrevisto) },
              { label: 'Gasto', value: formatCurrency(financeiro.totalGasto) },
              { label: 'Aproveit.', value: `${financeiro.totalOrcamentoPrevisto > 0 ? ((financeiro.totalGasto / financeiro.totalOrcamentoPrevisto) * 100).toFixed(0) : 0}%` },
            ].map(({ label, value }) => (
              <View key={label} style={styles.metricBox}>
                <Text style={styles.metricLabel}>{label}</Text>
                <Text style={styles.metricValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', paddingHorizontal: 12, marginTop: 16, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  grid3: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metricBox: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 8, padding: 10, alignItems: 'center' },
  metricLabel: { fontSize: 11, color: '#6b7280', marginBottom: 3 },
  metricValue: { fontSize: 14, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  progressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  equipeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  equipeNome: { fontSize: 13, fontWeight: '500', color: '#111827' },
  equipeFuncao: { fontSize: 12, color: '#6b7280' },
  equipePago: { fontSize: 13, fontWeight: '600', color: '#111827' },
});
