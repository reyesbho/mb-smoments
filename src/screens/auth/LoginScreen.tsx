import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert, Image,
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import colors from '../../theme/colors';

const logo = require('../../../assets/logo.png');

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Ingresa tu email y contraseña.');
      return;
    }
    setIsLoading(true);
    try {
      const ok = await login(email.trim(), password);
      if (!ok) Alert.alert('Error', 'Credenciales incorrectas. Verifica e intenta de nuevo.');
    } catch {
      Alert.alert('Error', 'Credenciales incorrectas. Verifica e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Image
            source={logo}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoSubtitle}>Panel de administración</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="correo@ejemplo.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.fieldLabel}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading
              ? <ActivityIndicator color={colors.textOnPrimary} />
              : <Text style={styles.buttonText}>Iniciar sesión</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 200,
    height: 200,
    marginBottom: 8,
  },
  logoSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.black,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
