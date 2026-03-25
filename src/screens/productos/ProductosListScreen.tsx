import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProductos } from '../../hooks/useProductos';
import { getCategorias } from '../../api/categorias';
import ProductoCard from '../../components/productos/ProductoCard';
import colors from '../../theme/colors';
import type { ProductosStackParamList } from '../../navigation/TabNavigator';

type Props = NativeStackScreenProps<ProductosStackParamList, 'ProductosList'>;

type EstatusFiltro = 'activos' | 'todos' | 'inactivos';

const ESTATUS_FILTROS: { label: string; value: EstatusFiltro }[] = [
  { label: 'Activos', value: 'activos' },
  { label: 'Todos', value: 'todos' },
  { label: 'Inactivos', value: 'inactivos' },
];

function estatusToParam(f: EstatusFiltro): boolean | undefined {
  if (f === 'activos') return true;
  if (f === 'inactivos') return false;
  return undefined;
}

export default function ProductosListScreen({ navigation }: Props) {
  const [estatusFiltro, setEstatusFiltro] = useState<EstatusFiltro>('activos');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | undefined>(undefined);

  const { productos, isLoading, isRefreshing, error, refresh, toggleEstatus } = useProductos({
    estatus: estatusToParam(estatusFiltro),
    category: categoriaFiltro,
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: getCategorias,
    staleTime: 1000 * 60 * 10,
  });

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [estatusFiltro, categoriaFiltro])
  );

  return (
    <View style={styles.container}>
      {/* Filtros de estatus */}
      <View style={styles.filtrosRow}>
        {ESTATUS_FILTROS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, estatusFiltro === f.value && styles.chipActive]}
            onPress={() => setEstatusFiltro(f.value)}
          >
            <Text style={[styles.chipText, estatusFiltro === f.value && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pills de categorías */}
      {categorias.length > 0 && (
        <View
          style={styles.categoriasScroll}
        >
          <TouchableOpacity
            style={[styles.pill, categoriaFiltro === undefined && styles.pillActive]}
            onPress={() => setCategoriaFiltro(undefined)}
          >
            <Text style={[styles.pillText, categoriaFiltro === undefined && styles.pillTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          {categorias.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.pill, categoriaFiltro === cat.id && styles.pillActive]}
              onPress={() => setCategoriaFiltro(cat.id)}
            >
              <Text style={[styles.pillText, categoriaFiltro === cat.id && styles.pillTextActive]}>
                {cat.descripcion}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Lista */}
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductoCard
              producto={item}
              onPress={() => navigation.navigate('ProductoDetail', { id: item.id })}
              onToggleEstatus={toggleEstatus}
            />
          )}
          contentContainerStyle={styles.list}
          onRefresh={refresh}
          refreshing={isRefreshing}
          ListEmptyComponent={<Text style={styles.empty}>No hay productos.</Text>}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ProductoForm', {})}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+ Nuevo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filtrosRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  categoriasScroll: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 4,
    flexWrap: 'wrap'
  },
  categoriasRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 13, color: colors.textSecondary},
  pillTextActive: { color: colors.textOnPrimary, fontWeight: '600' },
  list: { padding: 12 },
  loader: { flex: 1 },
  error: { textAlign: 'center', marginTop: 40, color: colors.dangerText },
  empty: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
  fab: {
    position: 'absolute', bottom: 20, right: 16,
    backgroundColor: colors.black, paddingHorizontal: 20,
    paddingVertical: 12, borderRadius: 24, elevation: 4,
  },
  fabText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 15 },
});
