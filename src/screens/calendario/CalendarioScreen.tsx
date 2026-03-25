import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPedidos } from '../../api/pedidos';
import { tsToDate } from '../../types';
import Badge from '../../components/ui/Badge';
import colors from '../../theme/colors';
import type { Pedido } from '../../types';
import type { CalendarioStackParamList } from '../../navigation/TabNavigator';

type Props = NativeStackScreenProps<CalendarioStackParamList, 'Calendario'>;

// ─── Constantes ───────────────────────────────────────────────────────────────
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ─── Tipos internos ───────────────────────────────────────────────────────────
interface DayGroup {
  dateKey: string;   // YYYY-MM-DD para ordenar
  date: Date;
  pedidos: Pedido[];
  expanded: boolean;
}

// ─── Helpers de fecha ─────────────────────────────────────────────────────────
function toApiDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}-${m}-${date.getFullYear()}`;
}

function toDayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

function parseDayKey(key: string): Date {
  // crea la fecha en zona local para evitar off-by-one de UTC
  const [y, mo, d] = key.split('-').map(Number);
  return new Date(y, mo - 1, d);
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function CalendarioScreen({ navigation }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const data = await getPedidos({
        fechaInicio: toApiDate(firstDay),
        fechaFin: toApiDate(lastDay),
        pageSize: 200,
      });
      const pedidos = data.pedidos ?? [];

      // Agrupar por día de fechaEntrega
      const map = new Map<string, Pedido[]>();
      for (const p of pedidos) {
        const key = toDayKey(tsToDate(p.fechaEntrega));
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(p);
      }

      const sorted: DayGroup[] = Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, peds]) => ({
          dateKey: key,
          date: parseDayKey(key),
          pedidos: peds.sort((a, b) => a.cliente.localeCompare(b.cliente)),
          expanded: true,
        }));

      setGroups(sorted);
    } catch {
      setError('No se pudieron cargar los pedidos del mes.');
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function toggleDay(key: string) {
    setGroups(prev =>
      prev.map(g => g.dateKey === key ? { ...g, expanded: !g.expanded } : g)
    );
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const totalPedidos = groups.reduce((s, g) => s + g.pedidos.length, 0);

  return (
    <View style={styles.container}>
      {/* ── Selector de mes ── */}
      <View style={styles.monthBar}>
        <TouchableOpacity onPress={prevMonth} hitSlop={8} style={styles.arrowBtn}>
          <Ionicons name="chevron-back-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.monthCenter}>
          <Text style={styles.monthLabel}>{MESES[month]}</Text>
          <Text style={styles.yearLabel}>{year}</Text>
        </View>
        <TouchableOpacity onPress={nextMonth} hitSlop={8} style={styles.arrowBtn}>
          <Ionicons name="chevron-forward-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Resumen ── */}
      {!isLoading && !error && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {groups.length} {groups.length === 1 ? 'día' : 'días'} con pedidos
            {'  ·  '}
            {totalPedidos} {totalPedidos === 1 ? 'pedido' : 'pedidos'} en total
          </Text>
        </View>
      )}

      {/* ── Contenido ── */}
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : groups.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={52} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Sin pedidos en {MESES[month]}</Text>
          <Text style={styles.emptySubtitle}>No hay pedidos registrados para este mes.</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={g => g.dateKey}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: group }) => (
            <DaySection
              group={group}
              onToggle={() => toggleDay(group.dateKey)}
              onPedidoPress={id => navigation.navigate('PedidoDetail', { id })}
            />
          )}
        />
      )}
    </View>
  );
}

// ─── DaySection ───────────────────────────────────────────────────────────────
interface DaySectionProps {
  group: DayGroup;
  onToggle: () => void;
  onPedidoPress: (id: string) => void;
}

function DaySection({ group, onToggle, onPedidoPress }: DaySectionProps) {
  const diaNombre = DIAS[group.date.getDay()];
  const diaNum = group.date.getDate();
  const mesNombre = MESES[group.date.getMonth()];

  return (
    <View style={styles.dayCard}>
      {/* Cabecera del día */}
      <TouchableOpacity style={styles.dayHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeNum}>{diaNum}</Text>
          <Text style={styles.dayBadgeName}>{diaNombre}</Text>
        </View>
        <View style={styles.dayHeaderMid}>
          <Text style={styles.dayTitle}>{diaNombre} {diaNum} de {mesNombre}</Text>
          <Text style={styles.dayCount}>
            {group.pedidos.length} {group.pedidos.length === 1 ? 'pedido' : 'pedidos'}
          </Text>
        </View>
        <Ionicons
          name={group.expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Pedidos del día */}
      {group.expanded && group.pedidos.map((pedido, i) => (
        <TouchableOpacity
          key={pedido.id}
          style={[
            styles.pedidoRow,
            i === group.pedidos.length - 1 && styles.pedidoRowLast,
          ]}
          onPress={() => onPedidoPress(pedido.id)}
          activeOpacity={0.7}
        >
          <View style={styles.pedidoInfo}>
            <Text style={styles.pedidoCliente} numberOfLines={1}>
              {pedido.cliente}
            </Text>
            <Text style={styles.pedidoLugar} numberOfLines={1}>
              {pedido.lugarEntrega}
            </Text>
          </View>
          <View style={styles.pedidoRight}>
            <Badge type="estatus" value={pedido.estatus} />
            <Text style={styles.pedidoTotal}>
              ${(pedido.total ?? 0).toLocaleString('es-MX')}
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={15} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Month bar
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  arrowBtn: { padding: 6 },
  monthCenter: { alignItems: 'center' },
  monthLabel: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  yearLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },

  // Summary
  summaryBar: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: colors.primaryMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryText: { fontSize: 12, color: colors.primary, fontWeight: '500' },

  // States
  loader: { flex: 1 },
  errorText: {
    textAlign: 'center',
    marginTop: 48,
    color: colors.dangerText,
    fontSize: 14,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.textSecondary, marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },

  // List
  list: { padding: 12, gap: 10 },

  // Day card
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    backgroundColor: colors.surface,
  },
  dayBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeNum: { fontSize: 17, fontWeight: '800', color: colors.primary, lineHeight: 20 },
  dayBadgeName: { fontSize: 10, fontWeight: '600', color: colors.primaryLight, lineHeight: 12 },
  dayHeaderMid: { flex: 1 },
  dayTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  dayCount: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  // Pedido row
  pedidoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 8,
    backgroundColor: colors.surfaceMuted,
  },
  pedidoRowLast: {},
  pedidoInfo: { flex: 1 },
  pedidoCliente: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  pedidoLugar: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  pedidoRight: { alignItems: 'flex-end', gap: 4 },
  pedidoTotal: { fontSize: 12, fontWeight: '700', color: colors.primary },
});
