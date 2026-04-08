import {
  View, Text, FlatList, StyleSheet, Image, ScrollView,
  TouchableOpacity, RefreshControl
} from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { clienteAPI, diarioAPI } from '../../src/services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClienteDiario() {
  const [selectedObraId, setSelectedObraId] = useState(null);

  const { data: obras } = useQuery({
    queryKey: ['cliente-obras'],
    queryFn: () => clienteAPI.minhasObras().then(r => r.data),
  });

  const { data: diarioData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['diario-cliente', selectedObraId],
    queryFn: () => diarioAPI.listar(selectedObraId).then(r => r.data),
    enabled: !!selectedObraId,
  });

  return (
    <View style={styles.container}>
      {/* Seleção de obra */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContent}>
        {obras?.map(o => (
          <TouchableOpacity
            key={o.id}
            onPress={() => setSelectedObraId(o.id)}
            style={[styles.chip, selectedObraId === o.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, selectedObraId === o.id && styles.chipTextActive]}>
              {o.nome}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!selectedObraId ? (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={56} color="#d1d5db" />
          <Text style={styles.emptyText}>Selecione uma obra</Text>
        </View>
      ) : (
        <FlatList
          data={diarioData?.entradas || []}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={56} color="#d1d5db" />
              <Text style={styles.emptyText}>{isLoading ? 'Carregando...' : 'Nenhuma atualização ainda'}</Text>
            </View>
          }
          renderItem={({ item: entrada }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>{entrada.titulo}</Text>
              <Text style={styles.cardData}>
                {format(new Date(entrada.createdAt), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </Text>
              <Text style={styles.cardDesc}>{entrada.descricao}</Text>
              {entrada.fotos?.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fotosScroll}>
                  {entrada.fotos.map((foto, i) => (
                    <Image key={i} source={{ uri: foto }} style={styles.foto} />
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  chipScroll: { backgroundColor: '#1f2937', maxHeight: 52 },
  chipContent: { padding: 8, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#374151' },
  chipActive: { backgroundColor: '#f97316' },
  chipText: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  list: { padding: 12, gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
  cardTitulo: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 3 },
  cardData: { fontSize: 12, color: '#9ca3af', marginBottom: 10, textTransform: 'capitalize' },
  cardDesc: { fontSize: 14, color: '#374151', lineHeight: 21, marginBottom: 10 },
  fotosScroll: { marginTop: 4 },
  foto: { width: 160, height: 120, borderRadius: 10, marginRight: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#9ca3af' },
});
