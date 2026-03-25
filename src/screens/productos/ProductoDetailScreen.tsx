import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getProducto, updateProducto, deleteProducto } from '../../api/productos';
import Badge from '../../components/ui/Badge';
import colors from '../../theme/colors';
import type { Producto } from '../../types';
import type { ProductosStackParamList } from '../../navigation/TabNavigator';

type Props = NativeStackScreenProps<ProductosStackParamList, 'ProductoDetail'>;

export default function ProductoDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [producto, setProducto] = useState<Producto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { loadProducto(); }, [id]);

  async function loadProducto() {
    setIsLoading(true);
    try {
      const data = await getProducto(id);
      setProducto(data);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el producto.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleEstatus() {
    if (!producto) return;
    setIsSaving(true);
    try {
      const updated = await updateProducto(id, { estatus: !producto.estatus });
      setProducto(updated);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el estatus.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert(
      'Eliminar producto',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              await deleteProducto(id);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el producto.');
              setIsSaving(false);
            }
          },
        },
      ]
    );
  }

  if (isLoading) {
    return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;
  }

  if (!producto) return null;

  const precios = producto.sizes.map((s) => s.price).filter((p) => p > 0);
  const minPrecio = precios.length ? Math.min(...precios) : 0;
  const maxPrecio = precios.length ? Math.max(...precios) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Imagen */}
      {producto.imagen ? (
        <Image source={{ uri: producto.imagen }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="gift-outline" size={52} color={colors.primary} />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.nombre}>{producto.name}</Text>
          <Text style={styles.categoria}>{producto.category}</Text>
        </View>
        <Badge type="activo" value={producto.estatus} />
      </View>

      {/* Descripción */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.descripcion}>{producto.descripcion}</Text>
      </View>

      {/* Rango de precios */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Precios</Text>
        <Text style={styles.precioRango}>
          {minPrecio === maxPrecio
            ? `$${minPrecio.toLocaleString('es-MX')}`
            : `$${minPrecio.toLocaleString('es-MX')} — $${maxPrecio.toLocaleString('es-MX')}`}
        </Text>

        {/* Lista de tamaños */}
        <View style={styles.sizesList}>
          {producto.sizes.map((s) => (
            <View key={s.size} style={styles.sizeRow}>
              <Text style={styles.sizeNombre}>{s.size}</Text>
              <Text style={styles.sizePrecio}>${s.price.toLocaleString('es-MX')}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            producto.estatus ? styles.toggleBtnInactive : styles.toggleBtnActive,
            isSaving && styles.disabledBtn,
          ]}
          onPress={handleToggleEstatus}
          disabled={isSaving}
        >
          <Text style={[
            styles.toggleBtnText,
            producto.estatus ? styles.toggleBtnTextInactive : styles.toggleBtnTextActive,
          ]}>
            {producto.estatus ? 'Desactivar' : 'Activar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.editBtn, isSaving && styles.disabledBtn]}
          onPress={() => navigation.navigate('ProductoForm', { id })}
          disabled={isSaving}
        >
          <Text style={styles.editBtnText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.deleteBtn, isSaving && styles.disabledBtn]}
        onPress={handleDelete}
        disabled={isSaving}
      >
        <Text style={styles.deleteBtnText}>Eliminar producto</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  image: { width: '100%', height: 200 },
  imagePlaceholder: {
    width: '100%', height: 200,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', padding: 16, paddingBottom: 8,
  },
  headerLeft: { flex: 1, marginRight: 10 },
  nombre: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  categoria: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  section: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, padding: 14,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  descripcion: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  precioRango: { fontSize: 20, fontWeight: '700', color: colors.primary, marginBottom: 12 },
  sizesList: { gap: 6 },
  sizeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  sizeNombre: { fontSize: 14, color: colors.textPrimary },
  sizePrecio: { fontSize: 14, fontWeight: '700', color: colors.primary },
  actions: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 10 },
  toggleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    borderWidth: 1, alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: colors.successBg, borderColor: colors.successBorder },
  toggleBtnInactive: { backgroundColor: colors.neutralBg, borderColor: colors.neutralBorder },
  toggleBtnText: { fontSize: 14, fontWeight: '700' },
  toggleBtnTextActive: { color: colors.successText },
  toggleBtnTextInactive: { color: colors.neutralText },
  editBtn: {
    flex: 1, backgroundColor: colors.black, borderRadius: 8,
    paddingVertical: 12, alignItems: 'center',
  },
  editBtnText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 14 },
  deleteBtn: {
    marginHorizontal: 16, paddingVertical: 12, borderRadius: 8,
    borderWidth: 1, borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBg, alignItems: 'center',
  },
  deleteBtnText: { color: colors.dangerText, fontWeight: '700', fontSize: 14 },
  disabledBtn: { opacity: 0.4 },
});
