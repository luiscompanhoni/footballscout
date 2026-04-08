import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Alert, Image, ActivityIndicator, FlatList
} from 'react-native';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { obrasAPI, diarioAPI } from '../../src/services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminDiario() {
  const queryClient = useQueryClient();
  const [selectedObraId, setSelectedObraId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [fotos, setFotos] = useState([]);

  const { data: obrasData } = useQuery({
    queryKey: ['obras'],
    queryFn: () => obrasAPI.listar().then(r => r.data),
  });

  const { data: diarioData, isLoading, refetch } = useQuery({
    queryKey: ['diario', selectedObraId],
    queryFn: () => diarioAPI.listar(selectedObraId).then(r => r.data),
    enabled: !!selectedObraId,
  });

  const criarMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('obraId', selectedObraId);
      formData.append('titulo', titulo);
      formData.append('descricao', descricao);
      fotos.forEach((foto, i) => {
        formData.append('fotos', {
          uri: foto.uri,
          name: `foto_${i}.jpg`,
          type: 'image/jpeg',
        });
      });
      return diarioAPI.criar(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario', selectedObraId] });
      setTitulo(''); setDescricao(''); setFotos([]); setShowForm(false);
      Alert.alert('Sucesso', 'Entrada publicada no diário!');
    },
    onError: () => Alert.alert('Erro', 'Não foi possível publicar a entrada'),
  });

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });
    if (!result.canceled) setFotos((prev) => [...prev, ...result.assets].slice(0, 10));
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled) setFotos((prev) => [...prev, result.assets[0]].slice(0, 10));
  };

  return (
    <View style={styles.container}>
      {/* Seleção de obra */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.obraScroll} contentContainerStyle={styles.obraScrollContent}>
        {obrasData?.obras?.map((obra) => (
          <TouchableOpacity
            key={obra.id}
            onPress={() => setSelectedObraId(obra.id)}
            style={[styles.obraChip, selectedObraId === obra.id && styles.obraChipActive]}
          >
            <Text style={[styles.obraChipText, selectedObraId === obra.id && styles.obraChipTextActive]}>
              {obra.nome}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedObraId && !showForm && (
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Nova Entrada</Text>
        </TouchableOpacity>
      )}

      {showForm && (
        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.formTitle}>Nova Entrada no Diário</Text>
          <TextInput
            style={styles.input}
            placeholder="Título *"
            value={titulo}
            onChangeText={setTitulo}
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descreva as atividades realizadas, observações..."
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Ionicons name="camera" size={18} color="#2563eb" />
              <Text style={styles.photoButtonText}>Câmera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={pickImages}>
              <Ionicons name="images" size={18} color="#2563eb" />
              <Text style={styles.photoButtonText}>Galeria</Text>
            </TouchableOpacity>
          </View>
          {fotos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fotosScroll}>
              {fotos.map((foto, i) => (
                <View key={i} style={styles.fotoContainer}>
                  <Image source={{ uri: foto.uri }} style={styles.fotoThumb} />
                  <TouchableOpacity
                    style={styles.fotoRemove}
                    onPress={() => setFotos(f => f.filter((_, fi) => fi !== i))}
                  >
                    <Ionicons name="close-circle" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowForm(false); setFotos([]); }}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, criarMutation.isPending && { opacity: 0.6 }]}
              onPress={() => {
                if (!titulo || !descricao) { Alert.alert('Atenção', 'Preencha título e descrição'); return; }
                criarMutation.mutate();
              }}
              disabled={criarMutation.isPending}
            >
              {criarMutation.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Publicar</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {!showForm && selectedObraId && (
        isLoading ? <ActivityIndicator style={{ marginTop: 40 }} /> :
        <FlatList
          data={diarioData?.entradas || []}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Nenhuma entrada no diário</Text>
            </View>
          }
          renderItem={({ item: entrada }) => (
            <View style={styles.entradaCard}>
              <Text style={styles.entradaTitulo}>{entrada.titulo}</Text>
              <Text style={styles.entradaData}>
                {format(new Date(entrada.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </Text>
              <Text style={styles.entradaDesc}>{entrada.descricao}</Text>
              {entrada.fotos?.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fotosScroll}>
                  {entrada.fotos.map((foto, i) => (
                    <Image key={i} source={{ uri: foto }} style={styles.entradaFoto} />
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        />
      )}

      {!selectedObraId && (
        <View style={styles.empty}>
          <Ionicons name="construct-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>Selecione uma obra acima</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  obraScroll: { backgroundColor: '#1f2937', maxHeight: 52 },
  obraScrollContent: { padding: 8, gap: 8 },
  obraChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#374151' },
  obraChipActive: { backgroundColor: '#2563eb' },
  obraChipText: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  obraChipTextActive: { color: '#fff' },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2563eb', margin: 12, borderRadius: 10, paddingVertical: 12, gap: 6,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  form: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16 },
  formTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 14, color: '#111827', marginBottom: 12 },
  textArea: { height: 100, textAlignVertical: 'top' },
  photoButtons: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  photoButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#2563eb' },
  photoButtonText: { color: '#2563eb', fontSize: 14 },
  fotosScroll: { marginBottom: 12 },
  fotoContainer: { position: 'relative', marginRight: 8 },
  fotoThumb: { width: 80, height: 80, borderRadius: 8 },
  fotoRemove: { position: 'absolute', top: -8, right: -8 },
  formButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  cancelBtnText: { color: '#374151', fontWeight: '500' },
  submitBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#2563eb', alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '600' },
  list: { padding: 12, gap: 12 },
  entradaCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
  entradaTitulo: { fontSize: 15, fontWeight: '600', color: '#111827' },
  entradaData: { fontSize: 12, color: '#9ca3af', marginVertical: 4 },
  entradaDesc: { fontSize: 13, color: '#374151', lineHeight: 20, marginBottom: 10 },
  entradaFoto: { width: 120, height: 90, borderRadius: 8, marginRight: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyText: { fontSize: 15, color: '#9ca3af' },
});
