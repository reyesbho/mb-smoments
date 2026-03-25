import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Badge from '../ui/Badge';
import colors from '../../theme/colors';
import { tsToDate } from '../../types';
import type { Pedido } from '../../types';

interface PedidoCardProps {
  pedido: Pedido;
  onPress: () => void;
}

export default function PedidoCard({ pedido, onPress }: PedidoCardProps) {
  const fechaEntrega = tsToDate(pedido.fechaEntrega);
  const fechaStr = fechaEntrega.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalItems = pedido.productos.reduce((acc, p) => acc + p.cantidad, 0);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.cliente} numberOfLines={1}>{pedido.cliente}</Text>
        <Badge type="estatus" value={pedido.estatus} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Entrega:</Text>
        <Text style={styles.value}>{fechaStr}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Lugar:</Text>
        <Text style={styles.value} numberOfLines={1}>{pedido.lugarEntrega}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.label}>{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</Text>
        <View style={styles.footerRight}>
          <Badge type="pago" value={pedido.estatusPago} />
          <Text style={styles.total}>${(pedido.total ?? 0).toLocaleString('es-MX')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cliente: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});
