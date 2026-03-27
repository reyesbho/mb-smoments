import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPedido, updatePedido, deletePedido } from '../../api/pedidos';
import Badge from '../../components/ui/Badge';
import colors from '../../theme/colors';
import { tsToDate } from '../../types';
import type { Abono, Pedido, PedidoPagoEstatus, PedidoTipoPago } from '../../types';
import type { PedidosStackParamList } from '../../navigation/TabNavigator';

type Props = NativeStackScreenProps<PedidosStackParamList, 'PedidoDetail'>;

export default function PedidoDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ── Modal de abono ──────────────────────────────────────────────────────────
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [abonoMonto, setAbonoMonto] = useState('');

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

  function buildPayload(overrides: Partial<Pedido>) {
    if (!pedido) return overrides;
    return {
      cliente:       pedido.cliente,
      clienteLower:  pedido.clienteLower ?? pedido.cliente.toLowerCase(),
      lugarEntrega:  pedido.lugarEntrega,
      fechaEntrega:  pedido.fechaEntrega,
      detalles:      pedido.detalles,
      productos:     pedido.productos,
      estatus:       pedido.estatus,
      estatusPago:   pedido.estatusPago,
      tipoPago:      pedido.tipoPago ?? 'EFECTIVO',
      abonos:        pedido.abonos ?? [],
      total:         pedido.total,
      ...overrides,
    };
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
              await updatePedido(id, buildPayload({ estatus: nuevoEstatus }));
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
      await updatePedido(id, buildPayload({ estatusPago: nuevoEstatus }));
      await loadPedido(true);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el pago.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddAbono() {
    const monto = parseFloat(abonoMonto.replace(',', '.'));
    if (isNaN(monto) || monto <= 0) {
      Alert.alert('Validación', 'Ingresa un monto válido mayor a 0.');
      return;
    }
    const now = new Date();
    const newAbono: Abono = {
      monto,
      fecha: { seconds: Math.floor(now.getTime() / 1000), nanoseconds: 0 },
    };
    const abonosActuales = pedido?.abonos ?? [];
    const nuevosPagos = [...abonosActuales, newAbono];
    const totalAbonado = nuevosPagos.reduce((s, a) => s + a.monto, 0);
    const nuevoEstatusPago: PedidoPagoEstatus =
      totalAbonado >= (pedido?.total ?? 0) ? 'PAGADO' : 'ABONADO';

    setIsSaving(true);
    try {
      await updatePedido(id, buildPayload({
        abonos: nuevosPagos,
        estatusPago: nuevoEstatusPago,
      }));
      setShowAbonoModal(false);
      setAbonoMonto('');
      await loadPedido(true);
    } catch {
      Alert.alert('Error', 'No se pudo registrar el abono.');
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

  const isClosed = pedido.estatus === 'DONE' || pedido.estatus === 'CANCELED';

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
        <Badge type="tipoPago" value={pedido.tipoPago ?? 'EFECTIVO'} />
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
        {isClosed ? (
          <View style={[styles.closedBanner, pedido.estatus === 'DONE' ? styles.closedBannerDone : styles.closedBannerCanceled]}>
            <Ionicons
              name={pedido.estatus === 'DONE' ? 'lock-closed-outline' : 'ban-outline'}
              size={16}
              color={pedido.estatus === 'DONE' ? colors.successText : colors.dangerText}
            />
            <Text style={[styles.closedBannerText, pedido.estatus === 'DONE' ? { color: colors.successText } : { color: colors.dangerText }]}>
              {pedido.estatus === 'DONE' ? 'Pedido entregado — no se permiten cambios' : 'Pedido cancelado — no se permiten cambios'}
            </Text>
          </View>
        ) : (
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
        )}
      </View>

      {/* Info pago */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pago</Text>
        <PagoCard
          estatusPago={pedido.estatusPago}
          tipoPago={pedido.tipoPago ?? 'EFECTIVO'}
          total={pedido.total ?? 0}
          abonos={pedido.abonos ?? []}
        />

        {/* Historial de abonos */}
        {(pedido.abonos?.length ?? 0) > 0 && (
          <View style={styles.abonosSection}>
            <Text style={styles.abonosTitle}>Historial de abonos</Text>
            {pedido.abonos!.map((abono, idx) => (
              <View key={idx} style={styles.abonoRow}>
                <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.abonoFecha}>
                  {tsToDate(abono.fecha).toLocaleDateString('es-MX', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </Text>
                <Text style={styles.abonoMonto}>
                  +${abono.monto.toLocaleString('es-MX')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Botón agregar abono */}
        {pedido.estatusPago !== 'PAGADO' && (
          <TouchableOpacity
            style={[styles.abonoBtn, isSaving && { opacity: 0.5 }]}
            onPress={() => { setAbonoMonto(''); setShowAbonoModal(true); }}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={16} color={colors.warningText} />
            <Text style={styles.abonoBtnText}>Registrar abono</Text>
          </TouchableOpacity>
        )}
        {pedido.estatusPago !== 'PAGADO' && (
          <ActionButton
            label="Marcar como pagado completo"
            color={colors.successText}
            bg={colors.successBg}
            border={colors.successBorder}
            onPress={() => handlePago('PAGADO')}
            disabled={isSaving}
          />
        )}
      </View>

      {/* Modal agregar abono */}
      <Modal
        visible={showAbonoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAbonoModal(false)}
      >
        <KeyboardAvoidingView
          style={modalStyles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={modalStyles.card}>
            <Text style={modalStyles.title}>Registrar abono</Text>

            <Text style={modalStyles.label}>Monto del abono</Text>
            <TextInput
              style={modalStyles.input}
              value={abonoMonto}
              onChangeText={setAbonoMonto}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />

            <Text style={modalStyles.fechaInfo}>
              Fecha: {new Date().toLocaleDateString('es-MX', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </Text>

            <View style={modalStyles.actions}>
              <TouchableOpacity
                style={modalStyles.btnCancel}
                onPress={() => setShowAbonoModal(false)}
              >
                <Text style={modalStyles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.btnSave, isSaving && { opacity: 0.6 }]}
                onPress={handleAddAbono}
                disabled={isSaving}
              >
                {isSaving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={modalStyles.btnSaveText}>Guardar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Editar / Eliminar */}
      <View style={styles.footerActions}>
        {!isClosed && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('PedidoForm', { id })}
            disabled={isSaving}
          >
            <Text style={styles.editButtonText}>Editar pedido</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.deleteButton, isClosed && styles.deleteButtonFull]}
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

// ─── PagoCard ─────────────────────────────────────────────────────────────────
const PAGO_CONFIG: Record<PedidoPagoEstatus, { label: string; bg: string; text: string; border: string; icon: keyof typeof Ionicons.glyphMap }> = {
  PENDIENTE: { label: 'Pendiente',  bg: colors.dangerBg,  text: colors.dangerText,  border: colors.dangerBorder,  icon: 'time-outline' },
  ABONADO:   { label: 'Abonado',    bg: colors.warningBg, text: colors.warningText, border: colors.warningBorder, icon: 'hourglass-outline' },
  PAGADO:    { label: 'Pagado',     bg: colors.successBg, text: colors.successText, border: colors.successBorder, icon: 'checkmark-circle-outline' },
};

function PagoCard({ estatusPago, tipoPago, total, abonos }: {
  estatusPago: PedidoPagoEstatus; tipoPago: PedidoTipoPago;
  total: number; abonos: Abono[];
}) {
  const cfg = PAGO_CONFIG[estatusPago];
  const metodoLabel = tipoPago === 'TRANSFERENCIA' ? 'Transferencia' : 'Efectivo';
  const metodoIcon: keyof typeof Ionicons.glyphMap = tipoPago === 'TRANSFERENCIA' ? 'swap-horizontal-outline' : 'cash-outline';
  const totalAbonado = abonos.reduce((s, a) => s + a.monto, 0);
  const pendiente = Math.max(0, total - totalAbonado);

  return (
    <View style={[pagoStyles.card, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      {/* Estatus */}
      <View style={pagoStyles.row}>
        <View style={[pagoStyles.iconWrap, { backgroundColor: cfg.border }]}>
          <Ionicons name={cfg.icon} size={20} color={cfg.text} />
        </View>
        <View style={pagoStyles.info}>
          <Text style={pagoStyles.label}>Estatus de pago</Text>
          <Text style={[pagoStyles.value, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={[pagoStyles.divider, { borderColor: cfg.border }]} />

      {/* Método */}
      <View style={pagoStyles.row}>
        <View style={[pagoStyles.iconWrap, { backgroundColor: cfg.border }]}>
          <Ionicons name={metodoIcon} size={20} color={cfg.text} />
        </View>
        <View style={pagoStyles.info}>
          <Text style={pagoStyles.label}>Método de pago</Text>
          <Text style={[pagoStyles.value, { color: cfg.text }]}>{metodoLabel}</Text>
        </View>
      </View>

      {/* Resumen montos */}
      {abonos.length > 0 && (
        <>
          <View style={[pagoStyles.divider, { borderColor: cfg.border }]} />
          <View style={pagoStyles.montosRow}>
            <View style={pagoStyles.montoItem}>
              <Text style={pagoStyles.label}>Total</Text>
              <Text style={[pagoStyles.value, { color: cfg.text }]}>
                ${total.toLocaleString('es-MX')}
              </Text>
            </View>
            <View style={pagoStyles.montoItem}>
              <Text style={pagoStyles.label}>Abonado</Text>
              <Text style={[pagoStyles.value, { color: cfg.text }]}>
                ${totalAbonado.toLocaleString('es-MX')}
              </Text>
            </View>
            {estatusPago !== 'PAGADO' && (
              <View style={pagoStyles.montoItem}>
                <Text style={pagoStyles.label}>Pendiente</Text>
                <Text style={[pagoStyles.value, { color: colors.dangerText }]}>
                  ${pendiente.toLocaleString('es-MX')}
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const pagoStyles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    borderBottomWidth: 1,
    marginHorizontal: 0,
  },
  montosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  montoItem: { alignItems: 'center', flex: 1 },
});

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
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  closedBannerDone: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  closedBannerCanceled: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
  closedBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
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
  deleteButtonFull: { flex: 1 },
  deleteButtonText: { color: colors.dangerText, fontWeight: '700', fontSize: 15 },
  // Abonos
  abonosSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 6,
  },
  abonosTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  abonoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  abonoFecha: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  abonoMonto: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.successText,
  },
  abonoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    backgroundColor: colors.warningBg,
  },
  abonoBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warningText,
  },
});

// ─── Modal styles ─────────────────────────────────────────────────────────────
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  fechaInfo: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  btnSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  btnSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
});
