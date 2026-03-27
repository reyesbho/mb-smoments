import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import type { PedidoEstatus, PedidoPagoEstatus, PedidoTipoPago } from '../../types';

// ─── Estatus de pedido ────────────────────────────────────────────────────────
const ESTATUS_MAP: Record<PedidoEstatus, { label: string; bg: string; text: string; border: string }> = {
  BACKLOG:  { label: 'Backlog',    bg: colors.neutralBg,  text: colors.neutralText,  border: colors.neutralBorder },
  TODO:     { label: 'Por hacer',  bg: colors.warningBg,  text: colors.warningText,  border: colors.warningBorder },
  DONE:     { label: 'Entregado',  bg: colors.successBg,  text: colors.successText,  border: colors.successBorder },
  CANCELED: { label: 'Cancelado',  bg: colors.dangerBg,   text: colors.dangerText,   border: colors.dangerBorder },
  DELETE:   { label: 'Eliminado',  bg: colors.neutralBg,  text: colors.neutralText,  border: colors.neutralBorder },
};

// ─── Estatus de pago ──────────────────────────────────────────────────────────
const PAGO_MAP: Record<PedidoPagoEstatus, { label: string; bg: string; text: string; border: string }> = {
  PENDIENTE: { label: 'Pendiente', bg: colors.dangerBg,   text: colors.dangerText,   border: colors.dangerBorder },
  ABONADO:   { label: 'Abonado',   bg: colors.warningBg,  text: colors.warningText,  border: colors.warningBorder },
  PAGADO:    { label: 'Pagado',    bg: colors.successBg,  text: colors.successText,  border: colors.successBorder },
};

// ─── Tipo de pago ─────────────────────────────────────────────────────────────
const TIPO_PAGO_MAP: Record<PedidoTipoPago, { label: string; bg: string; text: string; border: string }> = {
  EFECTIVO:     { label: 'Efectivo',     bg: colors.successBg,  text: colors.successText,  border: colors.successBorder },
  TRANSFERENCIA:{ label: 'Transferencia',bg: colors.neutralBg,  text: colors.neutralText,  border: colors.neutralBorder },
};

// ─── Estatus activo/inactivo ──────────────────────────────────────────────────
const ACTIVO_MAP = {
  true:  { label: 'Activo',   bg: colors.successBg, text: colors.successText, border: colors.successBorder },
  false: { label: 'Inactivo', bg: colors.neutralBg, text: colors.neutralText, border: colors.neutralBorder },
};

interface BadgeProps {
  type: 'estatus' | 'pago' | 'tipoPago' | 'activo';
  value: PedidoEstatus | PedidoPagoEstatus | PedidoTipoPago | boolean;
}

export default function Badge({ type, value }: BadgeProps) {
  let config: { label: string; bg: string; text: string; border: string };

  if (type === 'estatus') {
    config = ESTATUS_MAP[value as PedidoEstatus];
  } else if (type === 'pago') {
    config = PAGO_MAP[value as PedidoPagoEstatus];
  } else if (type === 'tipoPago') {
    config = TIPO_PAGO_MAP[value as PedidoTipoPago];
  } else {
    config = ACTIVO_MAP[String(value) as 'true' | 'false'];
  }

  const icon =
    type === 'pago'     ? 'cash-outline' :
    type === 'tipoPago' ? 'wallet-outline' :
    null;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      {icon && (
        <Ionicons name={icon} size={11} color={config.text} style={styles.icon} />
      )}
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
