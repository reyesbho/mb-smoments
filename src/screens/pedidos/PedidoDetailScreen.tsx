import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPedido, updatePedido, deletePedido } from '../../api/pedidos';
import Badge from '../../components/ui/Badge';
import colors from '../../theme/colors';
import { tsToDate } from '../../types';
import type { Pedido } from '../../types';
import type { PedidosStackParamList } from '../../navigation/TabNavigator';

type Props = NativeStackScreenProps<PedidosStackParamList, 'PedidoDetail'>;

export default function PedidoDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPedido();
    }, [id])
  );

  async function loadPedido(silent = false) {
    if (!silent) setIsLoading(true);
    try {
      const data = await getPedido(id);
      setPedido(data);
    } catch {
      if (!silent) {
        Alert.alert('Error', 'No se pudo cargar el pedido.');
        navigation.goBack();
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }

  async function handleEstatus(nuevoEstatus: 'TODO' | 'DONE' | 'CANCELED') {
    const label = nuevoEstatus === 'DONE' ? 'entregado' : nuevoEstatus === 'CANCELED' ? 'cancelado' : 'por hacer';
    Alert.alert(
      'Confirmar',
      `¿Marcar el pedido como ${label}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setIsSaving(true);
            try {
              await updatePedido(id, { estatus: nuevoEstatus });
              await loadPedido(true);
            } catch {
              Alert.alert('Error', 'No se pudo actualizar el estatus.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  }

  async function handlePago(nuevoEstatus: 'ABONADO' | 'PAGADO') {
    setIsSaving(true);
    try {
      await updatePedido(id, { estatusPago: nuevoEstatus });
      await loadPedido(true);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el pago.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert(
      'Eliminar pedido',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              await deletePedido(id);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el pedido.');
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

  if (!pedido) return null;

  const fechaEntrega = tsToDate(pedido.fechaEntrega).toLocaleString('es-MX', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const productos = pedido.productos ?? [];
  const total = pedido.total ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Estatus */}
      <View style={styles.badgeRow}>
        <Badge type="estatus" value={pedido.estatus} />
        <Badge type="pago" value={pedido.estatusPago} />
      </View>

      {/* Cliente */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cliente</Text>
        <Text style={styles.clienteName}>{pedido.cliente ?? '—'}</Text>
        <Row label="Entrega" value={fechaEntrega} />
        <Row label="Lugar" value={pedido.lugarEntrega ?? '—'} />
      </View>

      {/* Productos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Productos</Text>
        {productos.length === 0 ? (
          <Text style={styles.notas}>Sin productos registrados.</Text>
        ) : (
          productos.map((item, idx) => (
            <View key={item.id ?? idx} style={styles.productoRow}>
              {/* Thumbnail */}
              {item.producto?.imagen ? (
                <Image
                  source={{ uri: item.producto.imagen }}
                  style={styles.productoThumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.productoThumb, styles.productoThumbPlaceholder]} />
              )}

              {/* Info */}
              <View style={styles.productoInfo}>
                <Text style={styles.productoNombre}>{item.producto?.name ?? '—'}</Text>
                <Text style={styles.productoSize}>
                  {item.size?.size ?? '—'} × {item.cantidad}
                </Text>
                {!!item.caracteristicas && (
                  <Text style={styles.productoCaract}>{item.caracteristicas}</Text>
                )}
              </View>

              {/* Subtotal */}
              <Text style={styles.productoSubtotal}>
                ${(item.subtotal ?? 0).toLocaleString('es-MX')}
              </Text>
            </View>
          ))
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toLocaleString('es-MX')}</Text>
        </View>
      </View>

      {/* Notas */}
      {pedido.detalles ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas</Text>
          <Text style={styles.notas}>{pedido.detalles}</Text>
        </View>
      ) : null}

      {/* Acciones estatus */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones</Text>
        <View style={styles.actionsRow}>
          <ActionButton
            label="Por hacer"
            color={colors.warningText}
            bg={colors.warningBg}
            border={colors.warningBorder}
            onPress={() => handleEstatus('TODO')}
            disabled={isSaving || pedido.estatus === 'TODO'}
          />
          <ActionButton
            label="Entregado"
            color={colors.successText}
            bg={colors.successBg}
            border={colors.successBorder}
            onPress={() => handleEstatus('DONE')}
            disabled={isSaving || pedido.estatus === 'DONE'}
          />
          <ActionButton
            label="Cancelar"
            color={colors.dangerText}
            bg={colors.dangerBg}
            border={colors.dangerBorder}
            onPress={() => handleEstatus('CANCELED')}
            disabled={isSaving || pedido.estatus === 'CANCELED'}
          />
        </View>
      </View>

      {/* Acciones pago */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pago</Text>
        <View style={styles.actionsRow}>
          <ActionButton
            label="Abono"
            color={colors.warningText}
            bg={colors.warningBg}
            border={colors.warningBorder}
            onPress={() => handlePago('ABONADO')}
            disabled={isSaving || pedido.estatusPago === 'PAGADO'}
          />
          <ActionButton
            label="Pagado completo"
            color={colors.successText}
            bg={colors.successBg}
            border={colors.successBorder}
            onPress={() => handlePago('PAGADO')}
            disabled={isSaving || pedido.estatusPago === 'PAGADO'}
          />
        </View>
      </View>

      {/* Editar / Eliminar */}
      <View style={styles.footerActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('PedidoForm', { id })}
          disabled={isSaving}
        >
          <Text style={styles.editButtonText}>Editar pedido</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={isSaving}
        >
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}:</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function ActionButton({
  label, color, bg, border, onPress, disabled,
}: {
  label: string; color: string; bg: string; border: string;
  onPress: () => void; disabled: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: bg, borderColor: border }, disabled && styles.disabledBtn]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  clienteName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  rowLabel: { fontSize: 13, color: colors.textSecondary, width: 60 },
  rowValue: { fontSize: 13, color: colors.textPrimary, flex: 1 },
  productoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  productoThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
  },
  productoThumbPlaceholder: {
    backgroundColor: colors.border,
  },
  productoInfo: { flex: 1 },
  productoNombre: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  productoSize: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  productoCaract: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  productoSubtotal: { fontSize: 14, fontWeight: '700', color: colors.primary },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
  notas: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, alignItems: 'center',
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  disabledBtn: { opacity: 0.4 },
  footerActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  editButton: {
    flex: 1, backgroundColor: colors.black, borderRadius: 8,
    paddingVertical: 13, alignItems: 'center',
  },
  editButtonText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 15 },
  deleteButton: {
    paddingVertical: 13, paddingHorizontal: 18, borderRadius: 8,
    borderWidth: 1, borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBg, alignItems: 'center',
  },
  deleteButtonText: { color: colors.dangerText, fontWeight: '700', fontSize: 15 },
});
