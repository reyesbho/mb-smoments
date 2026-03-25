import React from 'react';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import colors from '../theme/colors';

// ─── Screens: Pedidos ─────────────────────────────────────────────────────────
import PedidosListScreen from '../screens/pedidos/PedidosListScreen';
import PedidoDetailScreen from '../screens/pedidos/PedidoDetailScreen';
import PedidoFormScreen from '../screens/pedidos/PedidoFormScreen';

// ─── Screens: Productos ───────────────────────────────────────────────────────
import ProductosListScreen from '../screens/productos/ProductosListScreen';
import ProductoDetailScreen from '../screens/productos/ProductoDetailScreen';
import ProductoFormScreen from '../screens/productos/ProductoFormScreen';

// ─── Screens: Calendario / Perfil ─────────────────────────────────────────────
import CalendarioScreen from '../screens/calendario/CalendarioScreen';
import PerfilScreen from '../screens/perfil/PerfilScreen';

// ─── Tipos de parámetros ──────────────────────────────────────────────────────
export type PedidosStackParamList = {
  PedidosList: undefined;
  PedidoDetail: { id: string };
  PedidoForm: { id?: string };
};

export type ProductosStackParamList = {
  ProductosList: undefined;
  ProductoDetail: { id: string };
  ProductoForm: { id?: string };
};

// Calendario reutiliza PedidoDetail y PedidoForm para mostrar detalles completos
export type CalendarioStackParamList = {
  Calendario: undefined;
  PedidoDetail: { id: string };
  PedidoForm: { id?: string };
};

export type PerfilStackParamList = {
  Perfil: undefined;
};

// ─── Stacks ───────────────────────────────────────────────────────────────────
const PedidosStack = createNativeStackNavigator<PedidosStackParamList>();
const ProductosStack = createNativeStackNavigator<ProductosStackParamList>();
const CalendarioStack = createNativeStackNavigator<CalendarioStackParamList>();
const PerfilStack = createNativeStackNavigator<PerfilStackParamList>();

const headerStyle = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.textOnPrimary,
  headerTitleStyle: { fontWeight: '600' as const },
};

function PedidosNavigator() {
  return (
    <PedidosStack.Navigator screenOptions={headerStyle}>
      <PedidosStack.Screen name="PedidosList" component={PedidosListScreen} options={{ title: 'Pedidos' }} />
      <PedidosStack.Screen name="PedidoDetail" component={PedidoDetailScreen} options={{ title: 'Detalle' }} />
      <PedidosStack.Screen name="PedidoForm" component={PedidoFormScreen} options={({ route }) => ({ title: route.params?.id ? 'Editar pedido' : 'Nuevo pedido' })} />
    </PedidosStack.Navigator>
  );
}

function ProductosNavigator() {
  return (
    <ProductosStack.Navigator screenOptions={headerStyle}>
      <ProductosStack.Screen name="ProductosList" component={ProductosListScreen} options={{ title: 'Productos' }} />
      <ProductosStack.Screen name="ProductoDetail" component={ProductoDetailScreen} options={{ title: 'Detalle' }} />
      <ProductosStack.Screen name="ProductoForm" component={ProductoFormScreen} options={({ route }) => ({ title: route.params?.id ? 'Editar producto' : 'Nuevo producto' })} />
    </ProductosStack.Navigator>
  );
}

function CalendarioNavigator() {
  return (
    <CalendarioStack.Navigator screenOptions={headerStyle}>
      <CalendarioStack.Screen
        name="Calendario"
        component={CalendarioScreen}
        options={{ title: 'Calendario' }}
      />
      {/* Reutilizamos las pantallas de pedido dentro del stack del calendario */}
      <CalendarioStack.Screen
        name="PedidoDetail"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={PedidoDetailScreen as any}
        options={{ title: 'Detalle del pedido' }}
      />
      <CalendarioStack.Screen
        name="PedidoForm"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={PedidoFormScreen as any}
        options={({ route }) => ({ title: route.params?.id ? 'Editar pedido' : 'Nuevo pedido' })}
      />
    </CalendarioStack.Navigator>
  );
}

function PerfilNavigator() {
  return (
    <PerfilStack.Navigator screenOptions={headerStyle}>
      <PerfilStack.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
    </PerfilStack.Navigator>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.primary + '73',
        tabBarLabel: ({ color }) => {
          const labels: Record<string, string> = {
            PedidosTab: 'Pedidos',
            ProductosTab: 'Productos',
            CalendarioTab: 'Calendario',
            PerfilTab: 'Perfil',
          };
          return <Text style={{ fontSize: 11, color }}>{labels[route.name]}</Text>;
        },
        tabBarIcon: ({ color }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            PedidosTab: 'clipboard-outline',
            ProductosTab: 'gift-outline',
            CalendarioTab: 'calendar-outline',
            PerfilTab: 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="PedidosTab" component={PedidosNavigator} />
      <Tab.Screen name="ProductosTab" component={ProductosNavigator} />
      <Tab.Screen name="CalendarioTab" component={CalendarioNavigator} />
      <Tab.Screen name="PerfilTab" component={PerfilNavigator} />
    </Tab.Navigator>
  );
}
