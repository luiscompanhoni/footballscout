import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  TextInput, Modal, ScrollView, RefreshControl
} from 'react-native';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { orcamentosAPI } from '../../src/services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

function AprovarModal({ orcamento, visible, onClose }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('APROVADO');
  const [justificativa, setJustificativa] = useState('');

  const mutation = useMutation({
    mutationFn: () => orcamentosAPI.aprovar(orcamento.id, { status, justificativa }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-orcamentos'] });
      Alert.alert('Sucesso', `Orçamento ${status === 'APROVADO' ? 'aprovado' : 'reprovado'}!`);
      setJustificativa('');
      onClose();
    },
    onError: (err) => Alert.alert('Erro', err.response?.data?.error || 'Erro ao processar'),
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Avaliar Orçamento</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#374151" /></TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody}>
          <View style={styles.orcInfo}>
            <Text style={styles.orcTitulo}>{orcamento?.titulo}</Text>
            <Text style={styles.orcValor}>{formatCurrency(orcamento?.valor)}</Text>
            {orcamento?.descricao && <Text style={styles.orcDesc}>{orcamento.descricao}</Text>}
          </View>
          {orcamento?.itens?.length > 0 && (
            <View style={styles.itensSection}>
              <Text style={styles.itensTitle}>Itens:</Text>
              {orcamento.itens.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemDesc}>{item.descricao}</Text>
                  <Text style={styles.itemValor}>{formatCurrency(item.quantidade * item.valorUnit)}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.decisaoRow}>
            <TouchableOpacity
              onPress={() => setStatus('APROVADO')}
              style={[styles.decisaoBtn, status === 'APROVADO' ? styles.aprovadoBtn : styles.decisaoBtnInactive]}
            >
              <Ionicons name="checkmark-circle" size={18} color={status === 'APROVADO' ? '#fff' : '#16a34a'} />
              <Text style={[styles.decisaoBtnText, status === 'APROVADO' ? { color: '#fff' } : { color: '#16a34a' }]}>Aprovar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStatus('REPROVADO')}
              style={[styles.decisaoBtn, status === 'REPROVADO' ? styles.reprovadoBtn : styles.decisaoBtnInactive]}
            >
              <Ionicons name="close-circle" size={18} color={status === 'REPROVADO' ? '#fff' : '#dc2626'} />
              <Text style={[styles.decisaoBtnText, status === 'REPROVADO' ? { color: '#fff' } : { color: '#dc2626' }]}>Reprovar</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.justificativaInput}
            placeholder={`Justificativa${status === 'REPROVADO' ? ' (obrigatória)' : ' (opcional)'}`}
            value={justificativa}
            onChangeText={setJustificativa}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity
            onPress={() => {
              if (status === 'REPROVADO' && !justificativa.trim()) {
                Alert.alert('Atenção', 'Justificativa é obrigatória para reprovar');
                return;
              }
              mutation.mutate();
            }}
            style={[styles.confirmarBtn, { backgroundColor: status === 'APROVADO' ? '#16a34a' : '#dc2626' }]}
          >
            <Text style={styles.confirmarBtnText}>
              {mutation.isPending ? 'Enviando...' : `Confirmar ${status === 'APROVADO' ? 'Aprovação' : 'Reprovação'}`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ClienteOrcamentos() {
  const [selectedOrcamento, setSelectedOrcamento] = useState(null);
  const { data: orcamentos, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['cliente-orcamentos'],
    queryFn: () => orcamentosAPI.listar().then(r => r.data),
  });

  const pendentes = orcamentos?.filter(o => o.status === 'PENDENTE') || [];
  const historico = orcamentos?.filter(o => o.status !== 'PENDENTE') || [];

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <FlatList
        data={[...pendentes, ...historico]}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        ListHeaderComponent={pendentes.length > 0 ? (
          <View style={styles.pendentesHeader}>
            <Ionicons name="time-outline" size={18} color="#d97706" />
            <Text style={styles.pendentesText}>{pendentes.length} orçamento{pendentes.length > 1 ? 's' : ''} aguardando aprovação</Text>
          </View>
        ) : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
            <Text style={{ color: '#9ca3af', marginTop: 10 }}>{isLoading ? 'Carregando...' : 'Nenhum orçamento'}</Text>
          </View>
        }
        renderItem={({ item: o }) => (
          <View style={[styles.card, o.status === 'PENDENTE' && styles.cardPendente]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardObraName}>{o.obra?.nome}</Text>
                <Text style={styles.cardTitulo}>{o.titulo}</Text>
              </View>
              <View style={[styles.statusBadge,
                { backgroundColor: o.status === 'APROVADO' ? '#dcfce7' : o.status === 'REPROVADO' ? '#fee2e2' : '#fef3c7' }]}>
                <Text style={[styles.statusText,
                  { color: o.status === 'APROVADO' ? '#16a34a' : o.status === 'REPROVADO' ? '#dc2626' : '#d97706' }]}>
                  {o.status === 'APROVADO' ? 'Aprovado' : o.status === 'REPROVADO' ? 'Reprovado' : 'Pendente'}
                </Text>
              </View>
            </View>
            <Text style={styles.cardValor}>{formatCurrency(o.valor)}</Text>
            <Text style={styles.cardData}>
              {format(new Date(o.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Text>
            {o.justificativa && (
              <Text style={styles.cardJustificativa}>Justificativa: {o.justificativa}</Text>
            )}
            {o.status === 'PENDENTE' && (
              <TouchableOpacity style={styles.avaliarBtn} onPress={() => setSelectedOrcamento(o)}>
                <Text style={styles.avaliarBtnText}>Avaliar Orçamento</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
      {selectedOrcamento && (
        <AprovarModal
          orcamento={selectedOrcamento}
          visible={!!selectedOrcamento}
          onClose={() => setSelectedOrcamento(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pendentesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef3c7', padding: 12, borderRadius: 10, marginBottom: 8 },
  pendentesText: { fontSize: 13, color: '#92400e', fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
  cardPendente: { borderLeftWidth: 3, borderLeftColor: '#d97706' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardObraName: { fontSize: 12, color: '#6b7280' },
  cardTitulo: { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 2 },
  cardValor: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  cardData: { fontSize: 12, color: '#9ca3af', marginBottom: 6 },
  cardJustificativa: { fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  avaliarBtn: { backgroundColor: '#1f2937', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  avaliarBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 60 },
  modal: { flex: 1, backgroundColor: '#f3f4f6' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  modalBody: { flex: 1, padding: 16 },
  orcInfo: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 },
  orcTitulo: { fontSize: 16, fontWeight: '600', color: '#111827' },
  orcValor: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginVertical: 6 },
  orcDesc: { fontSize: 13, color: '#6b7280' },
  itensSection: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 },
  itensTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemDesc: { fontSize: 13, color: '#374151', flex: 1 },
  itemValor: { fontSize: 13, color: '#111827', fontWeight: '500' },
  decisaoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  decisaoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: 'transparent' },
  decisaoBtnInactive: { backgroundColor: '#fff', borderColor: '#e5e7eb' },
  aprovadoBtn: { backgroundColor: '#16a34a' },
  reprovadoBtn: { backgroundColor: '#dc2626' },
  decisaoBtnText: { fontSize: 14, fontWeight: '600' },
  justificativaInput: { backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', minHeight: 80, marginBottom: 12 },
  confirmarBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  confirmarBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
