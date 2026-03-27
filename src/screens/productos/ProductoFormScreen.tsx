import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Switch, Image, Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getProducto, createProducto, updateProducto, uploadImagen } from '../../api/productos';
import { getCategorias } from '../../api/categorias';
import colors from '../../theme/colors';
import type { Categoria, SizeTag, ProductoSize } from '../../types';
import type { ProductosStackParamList } from '../../navigation/TabNavigator';

type Props = NativeStackScreenProps<ProductosStackParamList, 'ProductoForm'>;

const ALL_SIZES: SizeTag[] = ['Mini', 'Chica', 'Mediana', 'Grande', 'Familiar', 'Por defecto'];

export default function ProductoFormScreen({ route, navigation }: Props) {
  const editId = route.params?.id;
  const isEdit = !!editId;

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Campos
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagenUri, setImagenUri] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [estatus, setEstatus] = useState(true);
  const [categoriaId, setCategoriaId] = useState('');
  const [sizesActivos, setSizesActivos] = useState<Set<SizeTag>>(new Set(['Por defecto']));
  const [precios, setPrecios] = useState<Record<SizeTag, string>>({
    Mini: '', Chica: '', Mediana: '', Grande: '', Familiar: '', 'Por defecto': '',
  });

  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    loadCategorias();
    if (isEdit) loadProducto();
  }, []);

  async function loadCategorias() {
    try {
      const data = await getCategorias();
      setCategorias(data);
    } catch {}
  }

  async function loadProducto() {
    try {
      const p = await getProducto(editId!);
      setNombre(p.name);
      setDescripcion(p.descripcion);
      setImagenUrl(p.imagen);
      setEstatus(p.estatus);
      setCategoriaId(p.category);
      const activosSet = new Set(p.sizes.map((s) => s.size));
      setSizesActivos(activosSet);
      const preciosMap = { ...precios };
      p.sizes.forEach((s) => { preciosMap[s.size] = String(s.price); });
      setPrecios(preciosMap);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el producto.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePickImage() {
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (!canAskAgain) {
        Alert.alert(
          'Permiso requerido',
          'Habilita el acceso a la galería desde la Configuración del dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configuración', onPress: () => Linking.openSettings() },
          ]
        );
      } else {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para subir imágenes.');
      }
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setImagenUri(uri);
    setIsUploading(true);
    try {
      const url = await uploadImagen(uri);
      if (!url) throw new Error('URL vacía');
      setImagenUrl(url);
    } catch {
      Alert.alert('Error', 'No se pudo subir la imagen. Intenta de nuevo.');
      setImagenUri('');
      // imagenUrl no se toca: conserva la imagen anterior si existía
    } finally {
      setIsUploading(false);
    }
  }

  function toggleSize(size: SizeTag) {
    setSizesActivos((prev) => {
      const next = new Set(prev);
      if (next.has(size)) { next.delete(size); } else { next.add(size); }
      return next;
    });
  }

  function buildSizes(): ProductoSize[] {
    return ALL_SIZES
      .filter((s) => sizesActivos.has(s))
      .map((s) => ({ size: s, price: Number(precios[s]) || 0 }));
  }

  async function handleSave() {
    if (nombre.trim().length < 3) return Alert.alert('Validación', 'El nombre debe tener al menos 3 caracteres.');
    if (descripcion.trim().length === 0) return Alert.alert('Validación', 'La descripción es requerida.');
    if (descripcion.length > 200) return Alert.alert('Validación', 'La descripción no puede superar 200 caracteres.');
    if (!categoriaId) return Alert.alert('Validación', 'Selecciona una categoría.');
    if (sizesActivos.size === 0) return Alert.alert('Validación', 'Activa al menos un tamaño.');
    const sizes = buildSizes();
    if (sizes.some((s) => s.price <= 0)) return Alert.alert('Validación', 'Todos los tamaños activos deben tener un precio mayor a 0.');

    const payload: Record<string, unknown> = {
      name: nombre.trim(),
      descripcion: descripcion.trim(),
      estatus,
      category: categoriaId,
      sizes,
    };
    // Solo incluye imagen si tiene valor: evita sobrescribir con string vacío
    if (imagenUrl) {
      payload.imagen = imagenUrl;
    }

    setIsSaving(true);
    try {
      if (isEdit) {
        await updateProducto(editId!, payload);
      } else {
        await createProducto(payload);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el producto.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;
  }

  const imagenPreview = imagenUri || imagenUrl;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Imagen */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Imagen</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} disabled={isUploading}>
          {imagenPreview ? (
            <Image source={{ uri: imagenPreview }} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={36} color={colors.primary} />
              <Text style={styles.imagePlaceholderText}>Seleccionar imagen</Text>
            </View>
          )}
          {isUploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color={colors.textOnPrimary} />
              <Text style={styles.uploadingText}>Subiendo...</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información</Text>

        <Text style={styles.fieldLabel}>Nombre * (mín. 3 caracteres)</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre del producto"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.fieldLabel}>Descripción * (máx. 200 caracteres)</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={descripcion}
          onChangeText={(t) => setDescripcion(t.slice(0, 200))}
          placeholder="Describe el producto..."
          placeholderTextColor={colors.textMuted}
          multiline
        />
        <Text style={styles.charCount}>{descripcion.length}/200</Text>

        <Text style={styles.fieldLabel}>Categoría *</Text>
        <View style={styles.categoriasWrap}>
          {categorias.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, categoriaId === cat.id && styles.chipActive]}
              onPress={() => setCategoriaId(cat.id)}
            >
              <Text style={[styles.chipText, categoriaId === cat.id && styles.chipTextActive]}>
                {cat.descripcion}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.fieldLabel}>Producto activo</Text>
          <Switch
            value={estatus}
            onValueChange={setEstatus}
            trackColor={{ false: colors.neutralBorder, true: colors.primaryMuted }}
            thumbColor={estatus ? colors.primary : colors.textMuted}
          />
        </View>
      </View>

      {/* Tamaños y precios */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tamaños y precios</Text>
        {ALL_SIZES.map((size) => (
          <View key={size} style={styles.sizeRow}>
            <TouchableOpacity
              style={[styles.sizeChip, sizesActivos.has(size) && styles.sizeChipActive]}
              onPress={() => toggleSize(size)}
            >
              <Text style={[styles.sizeChipText, sizesActivos.has(size) && styles.sizeChipTextActive]}>
                {size}
              </Text>
            </TouchableOpacity>
            {sizesActivos.has(size) && (
              <View style={styles.priceInputWrap}>
                <Text style={styles.priceSymbol}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  value={precios[size]}
                  onChangeText={(t) => setPrecios((prev) => ({ ...prev, [size]: t }))}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Guardar */}
      <TouchableOpacity
        style={[styles.saveBtn, (isSaving || isUploading) && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={isSaving || isUploading}
      >
        {isSaving
          ? <ActivityIndicator color={colors.textOnPrimary} />
          : <Text style={styles.saveBtnText}>{isEdit ? 'Guardar cambios' : 'Crear producto'}</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  section: {
    backgroundColor: colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },
  imagePicker: {
    height: 160, borderRadius: 8, overflow: 'hidden',
    backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.border,
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  imagePlaceholderText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  uploadingText: { color: colors.textOnPrimary, fontWeight: '600' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: colors.textPrimary,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: 2 },
  categoriasWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 10,
  },
  sizeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, gap: 12,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  sizeChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border, minWidth: 90, alignItems: 'center',
  },
  sizeChipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  sizeChipText: { fontSize: 13, color: colors.textSecondary },
  sizeChipTextActive: { color: colors.primary, fontWeight: '600' },
  priceInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, paddingHorizontal: 10,
  },
  priceSymbol: { fontSize: 14, color: colors.textSecondary, marginRight: 4 },
  priceInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: colors.textPrimary },
  saveBtn: {
    backgroundColor: colors.black, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 16 },
});
