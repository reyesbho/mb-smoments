import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Badge from '../ui/Badge';
import colors from '../../theme/colors';
import type { Producto } from '../../types';

interface ProductoCardProps {
  producto: Producto;
  onPress: () => void;
  onToggleEstatus: (id: string, nuevoEstatus: boolean) => void;
}

export default function ProductoCard({ producto, onPress, onToggleEstatus }: ProductoCardProps) {
  const precios = producto.sizes.map((s) => s.price).filter((p) => p > 0);
  const minPrecio = precios.length ? Math.min(...precios) : 0;
  const maxPrecio = precios.length ? Math.max(...precios) : 0;
  const precioStr =
    minPrecio === maxPrecio
      ? `$${minPrecio.toLocaleString('es-MX')}`
      : `$${minPrecio.toLocaleString('es-MX')} – $${maxPrecio.toLocaleString('es-MX')}`;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {producto.imagen ? (
          <Image source={{ uri: producto.imagen }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="gift-outline" size={32} color={colors.primary} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.nombre} numberOfLines={1}>{producto.name}</Text>
          <Badge type="activo" value={producto.estatus} />
        </View>

        <Text style={styles.descripcion} numberOfLines={2}>{producto.descripcion}</Text>

        <View style={styles.footer}>
          <Text style={styles.precio}>{precioStr}</Text>
          <Switch
            value={producto.estatus}
            onValueChange={(val) => onToggleEstatus(producto.id, val)}
            trackColor={{ false: colors.neutralBorder, true: colors.primaryMuted }}
            thumbColor={producto.estatus ? colors.primary : colors.textMuted}
          />
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
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 100,
  },
  imageContainer: {
    width: 100,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  nombre: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  descripcion: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  precio: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
