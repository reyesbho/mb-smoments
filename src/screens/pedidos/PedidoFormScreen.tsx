import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Modal, FlatList, Image,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPedido, createPedido, updatePedido } from '../../api/pedidos';
import { getProductos } from '../../api/productos';
import colors from '../../theme/colors';
import type {
  Producto, PedidoProductoItem, PedidoEstatus,
  PedidoPagoEstatus, ProductoSize,
} from '../../types';
import type { PedidosStackParamList } from '../../navigation/TabNavigator';

type Props = NativeStackScreenProps<PedidosStackParamList, 'PedidoForm'>;

const ESTATUS_PEDIDO: PedidoEstatus[] = ['BACKLOG', 'TODO', 'DONE', 'CANCELED'];
const ESTATUS_PAGO: PedidoPagoEstatus[] = ['PENDIENTE', 'ABONADO', 'PAGADO'];

const ESTATUS_LABEL: Record<PedidoEstatus, string> = {
  BACKLOG: 'Backlog', TODO: 'Por hacer', DONE: 'Entregado', CANCELED: 'Cancelado', DELETE: 'Eliminado',
};
const PAGO_LABEL: Record<PedidoPagoEstatus, string> = {
  PENDIENTE: 'Pendiente', ABONADO: 'Abonado', PAGADO: 'Pagado',
};

export default function PedidoFormScreen({ route, navigation }: Props) {
  const editId = route.params?.id;
  const isEdit = !!editId;

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);

  // Campos
  const [cliente, setCliente] = useState('');
  const [lugarEntrega, setLugarEntrega] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState<Date>(new Date());
  const [detalles, setDetalles] = useState('');
  const [estatus, setEstatus] = useState<PedidoEstatus>('BACKLOG');
  const [estatusPago, setEstatusPago] = useState<PedidoPagoEstatus>('PENDIENTE');
  const [items, setItems] = useState<PedidoProductoItem[]>([]);

  // Date/time picker
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  // Modal selector de productos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [showProductos, setShowProductos] = useState(false);

  useEffect(() => {
    if (isEdit) {
      // En modo edición: carga productos primero y luego enriquece los items del pedido
      loadProductos().then((prods) => loadPedido(prods));
    } else {
      loadProductos();
    }
  }, []);

  async function loadProductos(): Promise<Producto[]> {
    try {
      const data = await getProductos({ estatus: true });
      setProductos(data);
      return data;
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los productos.');
      return [];
    }
  }

  async function loadPedido(allProductos: Producto[]) {
    try {
      const p = await getPedido(editId!);
      setCliente(p.cliente);
      setLugarEntrega(p.lugarEntrega);
      const fechaDate = p.fechaEntrega?.seconds
        ? new Date(p.fechaEntrega.seconds * 1000)
        : new Date();
      setFechaEntrega(fechaDate);
      setDetalles(p.detalles ?? '');
      setEstatus(p.estatus);
      setEstatusPago(p.estatusPago);
      // Enriquecer cada item con el Producto completo (incluye sizes)
      const enriched = p.productos.map((item) => {
        const full = allProductos.find((pr) => pr.id === item.producto?.id);
        return full ? { ...item, producto: full } : item;
      });
      setItems(enriched);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el pedido.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }

  function openDatePicker() {
    setPickerMode('date');
    setShowPicker(true);
  }

  function handlePickerChange(_event: DateTimePickerEvent, selected?: Date) {
    setShowPicker(false);
    if (!selected) return;

    if (pickerMode === 'date') {
      // Conserva la hora actual, aplica la nueva fecha
      const merged = new Date(selected);
      merged.setHours(fechaEntrega.getHours(), fechaEntrega.getMinutes(), 0, 0);
      setFechaEntrega(merged);
      // Inmediatamente abre el selector de hora
      setPickerMode('time');
      setShowPicker(true);
    } else {
      // Conserva la fecha actual, aplica la nueva hora
      const merged = new Date(fechaEntrega);
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setFechaEntrega(merged);
    }
  }

  function calcTotal(itemList: PedidoProductoItem[]) {
    return itemList.reduce((acc, i) => acc + i.subtotal, 0);
  }

  function addProducto(producto: Producto) {
    const defaultSize = producto.sizes[0];
    if (!defaultSize) return;
    const existing = items.find(
      (i) => i.producto?.id === producto.id && i.size?.size === defaultSize.size
    );
    if (existing) {
      changeQuantity(items.indexOf(existing), existing.cantidad + 1);
    } else {
      const newItem: PedidoProductoItem = {
        id: `${producto.id}_${defaultSize.size}_${Date.now()}`,
        producto,
        size: defaultSize,
        cantidad: 1,
        subtotal: defaultSize.price,
        caracteristicas: '',
      };
      setItems((prev) => [...prev, newItem]);
    }
    setShowProductos(false);
  }

  function changeSize(idx: number, sizeObj: ProductoSize) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, size: sizeObj, subtotal: sizeObj.price * item.cantidad }
          : item
      )
    );
  }

  function changeQuantity(idx: number, cantidad: number) {
    if (cantidad < 1) return removeItem(idx);
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const precio = item.size?.price ?? 0;
        return { ...item, cantidad, subtotal: precio * cantidad };
      })
    );
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!cliente.trim()) return Alert.alert('Validación', 'El nombre del cliente es requerido.');
    if (!lugarEntrega.trim()) return Alert.alert('Validación', 'El lugar de entrega es requerido.');
    if (items.length === 0) return Alert.alert('Validación', 'Agrega al menos un producto.');
    if (items.some((i) => !i.size || i.size.price <= 0))
      return Alert.alert('Validación', 'Todos los precios deben ser mayores a 0.');

    const payload = {
      cliente: cliente.trim(),
      clienteLower: cliente.trim().toLowerCase(),
      lugarEntrega: lugarEntrega.trim(),
      fechaEntrega: { seconds: Math.floor(fechaEntrega.getTime() / 1000), nanoseconds: 0 },
      detalles: detalles.trim() || undefined,
      productos: items,
      estatus,
      estatusPago,
      total: calcTotal(items),
    };

    setIsSaving(true);
    try {
      if (isEdit) {
        await updatePedido(editId!, payload);
      } else {
        await createPedido(payload);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el pedido.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;
  }

  const total = calcTotal(items);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Cliente */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cliente</Text>
        <Field label="Nombre *" value={cliente} onChangeText={setCliente} placeholder="Nombre del cliente" />
        <Field label="Lugar de entrega *" value={lugarEntrega} onChangeText={setLugarEntrega} placeholder="Dirección o referencia" />
        {/* Selector fecha y hora */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Fecha y hora de entrega *</Text>
          <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.dateButtonText}>
              {fechaEntrega.toLocaleString('es-MX', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>
            <Ionicons name="chevron-forward-outline" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker
            value={fechaEntrega}
            mode={pickerMode}
            display="default"
            onChange={handlePickerChange}
            minimumDate={new Date()}
          />
        )}
        <Field label="Notas adicionales" value={detalles} onChangeText={setDetalles} placeholder="Instrucciones especiales..." multiline />
      </View>

      {/* Estatus */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estatus del pedido</Text>
        <View style={styles.chipsRow}>
          {ESTATUS_PEDIDO.map((e) => (
            <TouchableOpacity
              key={e}
              style={[styles.chip, estatus === e && styles.chipActive]}
              onPress={() => setEstatus(e)}
            >
              <Text style={[styles.chipText, estatus === e && styles.chipTextActive]}>
                {ESTATUS_LABEL[e]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Estatus de pago</Text>
        <View style={styles.chipsRow}>
          {ESTATUS_PAGO.map((e) => (
            <TouchableOpacity
              key={e}
              style={[styles.chip, estatusPago === e && styles.chipActive]}
              onPress={() => setEstatusPago(e)}
            >
              <Text style={[styles.chipText, estatusPago === e && styles.chipTextActive]}>
                {PAGO_LABEL[e]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Productos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Productos</Text>
          <TouchableOpacity onPress={() => setShowProductos(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Agregar</Text>
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <Text style={styles.emptyItems}>Ningún producto agregado.</Text>
        ) : (
          items.map((item, idx) => {
            const producto = item.producto;
            const currentSize = item.size?.size;
            return (
              <View key={item.id ?? idx} style={styles.itemRow}>

                {/* Imagen */}
                {producto?.imagen ? (
                  <Image
                    source={{ uri: producto.imagen }}
                    style={styles.itemThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.itemThumb, styles.itemThumbPlaceholder]} />
                )}

                {/* Info + controles */}
                <View style={styles.itemInfo}>
                  <View style={styles.itemTopRow}>
                    <Text style={styles.itemNombre} numberOfLines={1}>{producto?.name ?? '—'}</Text>
                    <Text style={styles.itemSubtotal}>${item.subtotal.toLocaleString('es-MX')}</Text>
                  </View>

                  {/* Tamaños */}
                  {producto?.sizes && producto.sizes.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizesRow}>
                      {producto.sizes.map((s) => {
                        const isActive = currentSize === s.size;
                        return (
                          <TouchableOpacity
                            key={s.size}
                            style={[styles.sizeChip, isActive && styles.sizeChipActive]}
                            onPress={() => changeSize(idx, s)}
                          >
                            {isActive && (
                              <Ionicons name="checkmark" size={11} color={colors.textOnPrimary} />
                            )}
                            <Text style={[styles.sizeChipText, isActive && styles.sizeChipTextActive]}>
                              {s.size}
                            </Text>
                            <Text style={[styles.sizeChipPrice, isActive && styles.sizeChipPriceActive]}>
                              ${s.price.toLocaleString('es-MX')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}

                  {/* Cantidad */}
                  <View style={styles.itemControls}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQuantity(idx, item.cantidad - 1)}>
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qty}>{item.cantidad}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQuantity(idx, item.cantidad + 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

              </View>
            );
          })
        )}

        {items.length > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toLocaleString('es-MX')}</Text>
          </View>
        )}
      </View>

      {/* Guardar */}
      <TouchableOpacity
        style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving
          ? <ActivityIndicator color={colors.textOnPrimary} />
          : <Text style={styles.saveBtnText}>{isEdit ? 'Guardar cambios' : 'Crear pedido'}</Text>
        }
      </TouchableOpacity>

      {/* Modal selector de productos */}
      <Modal visible={showProductos} animationType="slide" onRequestClose={() => setShowProductos(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar producto</Text>
            <TouchableOpacity onPress={() => setShowProductos(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={productos}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => addProducto(item)}>
                {item.imagen ? (
                  <Image
                    source={{ uri: item.imagen }}
                    style={styles.modalItemThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.modalItemThumb, styles.modalItemThumbPlaceholder]} />
                )}
                <View style={styles.modalItemInfo}>
                  <Text style={styles.modalItemName}>{item.name}</Text>
                  <Text style={styles.modalItemPrice}>
                    desde ${Math.min(...item.sizes.map((s) => s.price)).toLocaleString('es-MX')}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

function Field({
  label, value, onChangeText, placeholder, keyboardType, multiline,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: 'numeric'; multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 5 },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: colors.textPrimary,
  },
  inputMulti: { minHeight: 70, textAlignVertical: 'top' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  addBtn: {
    backgroundColor: colors.primaryMuted, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  addBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  emptyItems: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 10,
  },
  itemThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginTop: 2,
  },
  itemThumbPlaceholder: {
    backgroundColor: colors.border,
  },
  itemInfo: { flex: 1, gap: 4 },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemNombre: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  sizesRow: { marginTop: 0 },
  sizeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border, marginRight: 6,
    backgroundColor: colors.surface,
  },
  sizeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sizeChipText: { fontSize: 12, color: colors.textSecondary },
  sizeChipTextActive: { color: colors.textOnPrimary, fontWeight: '700' },
  sizeChipPrice: { fontSize: 11, color: colors.textMuted },
  sizeChipPriceActive: { color: colors.textOnPrimary, opacity: 0.85 },
  itemControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 6, backgroundColor: colors.neutralBg,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  qty: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, minWidth: 20, textAlign: 'center' },
  itemSubtotal: { fontSize: 14, fontWeight: '700', color: colors.primary },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 10,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
  saveBtn: {
    backgroundColor: colors.black, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 16 },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: colors.primary,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.textOnPrimary },
  modalClose: { fontSize: 20, color: colors.textOnPrimary, fontWeight: '700' },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalItemThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  modalItemThumbPlaceholder: {
    backgroundColor: colors.border,
  },
  modalItemInfo: { flex: 1 },
  modalItemName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  modalItemPrice: { fontSize: 13, color: colors.primary, fontWeight: '700', marginTop: 2 },
});
