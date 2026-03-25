import React, { useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { usePedidos } from '../../hooks/usePedidos';
import PedidoCard from '../../components/pedidos/PedidoCard';
import colors from '../../theme/colors';
import type { PedidoEstatus } from '../../types';
import type { PedidosStackParamList } from '../../navigation/TabNavigator';

// Convierte Date → 'DD-MM-YYYY' (formato que espera el API)
function toApiDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${date.getFullYear()}`;
}

// Convierte Date → 'DD/MM/YYYY' (para mostrar en UI)
function toDisplayDate(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

type Props = NativeStackScreenProps<PedidosStackParamList, 'PedidosList'>;

const FILTROS: { label: string; value: PedidoEstatus | undefined }[] = [
  { label: 'Todos', value: undefined },
  { label: 'Backlog', value: 'BACKLOG' },
  { label: 'Por hacer', value: 'TODO' },
  { label: 'Entregados', value: 'DONE' },
  { label: 'Cancelados', value: 'CANCELED' },
];

export default function PedidosListScreen({ navigation }: Props) {
  const [estatusFiltro, setEstatusFiltro] = useState<PedidoEstatus | undefined>(undefined);
  const [busqueda, setBusqueda] = useState('');

  // Panel de filtros
  const [showFiltros, setShowFiltros] = useState(false);

  // Filtro de rango de fechas
  const [fechaDesde, setFechaDesde] = useState<Date | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'desde' | 'hasta'>('desde');

  const hayFiltroFecha = fechaDesde !== null || fechaHasta !== null;
  const filtrosActivos = (estatusFiltro ? 1 : 0) + (hayFiltroFecha ? 1 : 0);

  const {
    pedidos, isLoading, isRefreshing, isFetchingNextPage,
    hasNextPage, error, refresh, fetchNextPage,
  } = usePedidos({
    estatus: estatusFiltro,
    fechaInicio: fechaDesde ? toApiDate(fechaDesde) : undefined,
    fechaFin: fechaHasta ? toApiDate(fechaHasta) : undefined,
  });

  function openPicker(target: 'desde' | 'hasta') {
    setPickerTarget(target);
    setShowPicker(true);
  }

  function handlePickerChange(_event: DateTimePickerEvent, selected?: Date) {
    setShowPicker(false);
    if (!selected) return;
    if (pickerTarget === 'desde') {
      setFechaDesde(selected);
      // Si "hasta" está vacío o es anterior, lo ajusta al mismo día
      if (!fechaHasta || selected > fechaHasta) setFechaHasta(selected);
    } else {
      setFechaHasta(selected);
    }
  }

  function limpiarFechas() {
    setFechaDesde(null);
    setFechaHasta(null);
  }

  // Refrescar al volver a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [estatusFiltro])
  );

  const pedidosFiltrados = busqueda.trim()
    ? pedidos.filter((p) =>
        (p.clienteLower ?? p.cliente.toLowerCase()).includes(busqueda.trim().toLowerCase())
      )
    : pedidos;

  return (
    <View style={styles.container}>
      {/* Buscador */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.search}
          placeholder="Buscar cliente..."
          placeholderTextColor={colors.textMuted}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {/* ── Barra de filtros (toggle) ── */}
      <TouchableOpacity
        style={styles.filtrosToggle}
        onPress={() => setShowFiltros((v) => !v)}
        activeOpacity={0.75}
      >
        <View style={styles.filtrosToggleLeft}>
          <Ionicons name="options-outline" size={16} color={filtrosActivos > 0 ? colors.primary : colors.textSecondary} />
          <Text style={[styles.filtrosToggleText, filtrosActivos > 0 && styles.filtrosToggleTextActive]}>
            Filtros
          </Text>
          {filtrosActivos > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{filtrosActivos}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={showFiltros ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={16}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* ── Panel colapsable ── */}
      {showFiltros && (
        <View style={styles.filtrosPanel}>
          {/* Rango de fecha */}
          <Text style={styles.filtroLabel}>Fecha de entrega</Text>
          <View style={styles.fechaRow}>
            <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
            <TouchableOpacity
              style={[styles.fechaBtn, fechaDesde && styles.fechaBtnActive]}
              onPress={() => openPicker('desde')}
            >
              <Text style={[styles.fechaBtnText, fechaDesde && styles.fechaBtnTextActive]}>
                {fechaDesde ? toDisplayDate(fechaDesde) : 'Desde'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.fechaSep}>—</Text>
            <TouchableOpacity
              style={[styles.fechaBtn, fechaHasta && styles.fechaBtnActive]}
              onPress={() => openPicker('hasta')}
            >
              <Text style={[styles.fechaBtnText, fechaHasta && styles.fechaBtnTextActive]}>
                {fechaHasta ? toDisplayDate(fechaHasta) : 'Hasta'}
              </Text>
            </TouchableOpacity>
            {hayFiltroFecha && (
              <TouchableOpacity onPress={limpiarFechas} style={styles.fechaClear}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Estatus */}
          <Text style={[styles.filtroLabel, { marginTop: 12 }]}>Estatus</Text>
          <View style={styles.filtrosRow}>
            {FILTROS.map((f) => (
              <TouchableOpacity
                key={String(f.value)}
                style={[styles.chip, estatusFiltro === f.value && styles.chipActive]}
                onPress={() => setEstatusFiltro(f.value)}
              >
                <Text style={[styles.chipText, estatusFiltro === f.value && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {showPicker && (
        <DateTimePicker
          value={pickerTarget === 'desde' ? (fechaDesde ?? new Date()) : (fechaHasta ?? new Date())}
          mode="date"
          display="default"
          onChange={handlePickerChange}
        />
      )}

      {/* Lista */}
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={pedidosFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PedidoCard
              pedido={item}
              onPress={() => navigation.navigate('PedidoDetail', { id: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          onRefresh={refresh}
          refreshing={isRefreshing}
          onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator style={styles.footerLoader} color={colors.primary} />
              : null
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No hay pedidos.</Text>
          }
        />
      )}

      {/* Botón nuevo */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PedidoForm', {})}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+ Nuevo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchContainer: { padding: 12, paddingBottom: 5 },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: colors.textPrimary,
  },
  // ── Toggle bar ──
  filtrosToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginHorizontal: 12,
    marginBottom: 6,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filtrosToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filtrosToggleText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  filtrosToggleTextActive: { color: colors.primary, fontWeight: '600' },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 11, color: colors.textOnPrimary, fontWeight: '700' },
  // ── Panel colapsable ──
  filtrosPanel: {
    marginHorizontal: 12,
    marginBottom: 6,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  filtroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  filtrosRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  fechaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fechaBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  fechaBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  fechaBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  fechaBtnTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  fechaSep: {
    fontSize: 13,
    color: colors.textMuted,
  },
  fechaClear: {
    marginLeft: 2,
  },
  list: { padding: 12 },
  loader: { flex: 1 },
  footerLoader: { paddingVertical: 16 },
  error: { textAlign: 'center', marginTop: 40, color: colors.dangerText },
  empty: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: colors.black,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
  },
  fabText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 15 },
});
