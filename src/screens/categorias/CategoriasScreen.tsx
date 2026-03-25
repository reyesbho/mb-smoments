import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCategorias, createCategoria, deleteCategoria } from '../../api/categorias';
import colors from '../../theme/colors';
import type { Categoria } from '../../types';

function toSnakeCase(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z_]/g, '');
}

const VALID_REGEX = /^[a-z_]+$/;

export default function CategoriasScreen() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [input, setInput] = useState('');
  const [preview, setPreview] = useState('');
  const [inputError, setInputError] = useState('');

  useFocusEffect(
    useCallback(() => { loadCategorias(); }, [])
  );

  async function loadCategorias() {
    setIsLoading(true);
    try {
      const data = await getCategorias();
      setCategorias(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las categorías.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const data = await getCategorias();
      setCategorias(data);
    } catch {}
    finally { setIsRefreshing(false); }
  }

  function handleInputChange(text: string) {
    setInput(text);
    setInputError('');
    const converted = toSnakeCase(text);
    setPreview(converted);
  }

  async function handleCreate() {
    const name = toSnakeCase(input);
    if (!name) {
      setInputError('Ingresa un nombre para la categoría.');
      return;
    }
    if (!VALID_REGEX.test(name)) {
      setInputError('Solo se permiten letras minúsculas y guiones bajos.');
      return;
    }
    setIsSaving(true);
    try {
      await createCategoria(name);
      setInput('');
      setPreview('');
      await handleRefresh();
    } catch {
      Alert.alert('Error', 'No se pudo crear la categoría.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete(cat: Categoria) {
    Alert.alert(
      'Eliminar categoría',
      `¿Eliminar "${cat.descripcion}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategoria(cat.id);
              setCategorias((prev) => prev.filter((c) => c.id !== cat.id));
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la categoría.');
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Formulario inline */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>Nueva categoría</Text>
        <TextInput
          style={[styles.input, !!inputError && styles.inputError]}
          value={input}
          onChangeText={handleInputChange}
          placeholder="ej. pasteles de boda"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {preview && input !== preview ? (
          <Text style={styles.preview}>Se guardará como: <Text style={styles.previewBold}>{preview}</Text></Text>
        ) : null}
        {inputError ? <Text style={styles.errorText}>{inputError}</Text> : null}
        <TouchableOpacity
          style={[styles.createBtn, isSaving && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={isSaving}
        >
          {isSaving
            ? <ActivityIndicator color={colors.textOnPrimary} size="small" />
            : <Text style={styles.createBtnText}>Crear categoría</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={categorias}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardName}>{item.descripcion}</Text>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.deleteBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.list}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay categorías registradas.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 16,
  },
  formTitle: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  input: {
    backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: colors.textPrimary,
  },
  inputError: { borderColor: colors.dangerBorder },
  preview: { fontSize: 12, color: colors.textSecondary, marginTop: 5 },
  previewBold: { fontWeight: '700', color: colors.primary },
  errorText: { fontSize: 12, color: colors.dangerText, marginTop: 4 },
  createBtn: {
    backgroundColor: colors.black, borderRadius: 8,
    paddingVertical: 11, alignItems: 'center', marginTop: 12,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 14 },
  list: { padding: 12 },
  loader: { flex: 1 },
  card: {
    backgroundColor: colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  deleteBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.dangerBorder,
  },
  deleteBtnText: { fontSize: 13, fontWeight: '700', color: colors.dangerText },
  empty: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
});
