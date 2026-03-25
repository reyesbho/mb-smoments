import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { BASE_URL } from '../../api/client';

export default function PerfilScreen() {
  const user   = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Ionicons name="gift-outline" size={44} color={colors.primary} />
        </View>
        <Text style={styles.appName}>Dulces Momentos</Text>
        <Text style={styles.appRole}>Panel de administración</Text>
      </View>

      {/* Sesión */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sesión activa</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Usuario ID</Text>
          <Text style={styles.rowValue} numberOfLines={1} ellipsizeMode="middle">
            {user?.uid ?? '—'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Servidor</Text>
          <Text style={styles.rowValue} numberOfLines={1}>{BASE_URL}</Text>
        </View>
      </View>

      {/* Acerca de */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acerca de</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>App</Text>
          <Text style={styles.rowValue}>Dulces Momentos</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Versión</Text>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Plataforma</Text>
          <Text style={styles.rowValue}>Android</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Framework</Text>
          <Text style={styles.rowValue}>React Native + Expo SDK 52</Text>
        </View>
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 28, marginTop: 8 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.primaryMuted,
    borderWidth: 2, borderColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  appName: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  appRole: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  section: {
    backgroundColor: colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  rowLabel: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  rowValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500', flex: 2, textAlign: 'right' },
  logoutBtn: {
    backgroundColor: colors.dangerBg, borderRadius: 8,
    borderWidth: 1, borderColor: colors.dangerBorder,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  logoutBtnText: { color: colors.dangerText, fontWeight: '700', fontSize: 16 },
});
