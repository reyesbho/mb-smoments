# Dulces Momentos — App de Administración de Pastelería

Aplicación móvil para Android desarrollada con React Native + Expo que permite gestionar los pedidos, productos y el calendario de entregas de la pastelería **Dulces Momentos**.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Framework | React Native 0.76.3 + Expo SDK 52 |
| Lenguaje | TypeScript 5.3 |
| Navegación | React Navigation v6 (NativeStack + BottomTabs) |
| Estado global | Zustand 5 |
| Peticiones HTTP | Axios 1.7 |
| Server state | TanStack Query 5 |
| Autenticación | Firebase Auth 12 (`inMemoryPersistence`) |
| Persistencia de sesión | expo-secure-store |
| Imágenes | expo-image-picker |
| Iconos | @expo/vector-icons (Ionicons outline) |

---

## Requisitos previos

- Node.js ≥ 18
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go en el dispositivo Android **o** emulador Android configurado
- Backend corriendo en red local (ver sección de configuración)

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd dulces-momentos

# 2. Instalar dependencias
npm install

# 3. Iniciar Metro bundler
npm start

# 4. Abrir en Android
npm run android
```

---

## Configuración

### Backend API

La app apunta a un servidor Express.js + Firebase Firestore. Actualiza la URL base en:

```
src/api/client.ts
```

```typescript
const client = axios.create({
  baseURL: 'http://<IP_LOCAL>:3000/api',
});
```

Reemplaza `<IP_LOCAL>` con la IP de tu máquina en la red local (ej. `192.168.3.19`).

### Firebase

Las credenciales de Firebase se encuentran en `src/firebase.ts`. Para usar tu propio proyecto actualiza el objeto `firebaseConfig`:

```typescript
const firebaseConfig = {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  appId: '...',
};
```

---

## Estructura del proyecto

```
dulces-momentos/
├── src/
│   ├── actions/            # Lógica de autenticación (login, logout, checkAuth)
│   ├── api/                # Clientes HTTP por módulo (pedidos, productos, auth)
│   ├── components/
│   │   ├── pedidos/        # PedidoCard
│   │   └── ui/             # Badge (estatus y pago)
│   ├── firebase.ts         # Inicialización de Firebase Auth
│   ├── navigation/
│   │   ├── RootNavigator   # Auth guard (checking / authenticated / unauthenticated)
│   │   └── TabNavigator    # Bottom tabs + stacks por módulo
│   ├── screens/
│   │   ├── auth/           # LoginScreen
│   │   ├── calendario/     # CalendarioScreen
│   │   ├── pedidos/        # Lista, detalle y formulario de pedidos
│   │   ├── perfil/         # PerfilScreen
│   │   └── productos/      # Lista, detalle y formulario de productos
│   ├── storage/
│   │   └── session.ts      # SecureStore helpers (save / load / clear)
│   ├── store/
│   │   └── useAuthStore.ts # Zustand store de autenticación
│   ├── theme/
│   │   └── colors.ts       # Paleta de colores de la app
│   └── types/
│       └── index.ts        # Tipos globales (Pedido, Producto, AuthResponse…)
├── App.tsx
├── app.json
└── package.json
```

---

## Módulos de la app

### Autenticación
- Login con email y contraseña vía Firebase Auth
- Sesión persistida en `expo-secure-store`; al reabrir la app se valida automáticamente
- Token de Firebase enviado al backend como `{ idToken }` para validación
- Cierre de sesión limpia Firebase Auth y SecureStore
- Interceptor 401 en Axios: limpia sesión y redirige a Login

### Pedidos
- Listado con filtros por estatus (`BACKLOG`, `TODO`, `DONE`, `CANCELED`) y rango de fechas
- Panel de filtros colapsable
- Búsqueda por nombre de cliente
- Detalle del pedido: productos con imagen, badges de estatus/pago, acciones de cambio de estado
- Formulario para crear y editar pedidos con selector de productos y tallas

### Productos
- Listado en tarjetas con imagen, precio por talla y filtro por categoría
- Detalle del producto
- Formulario para crear y editar productos (imagen desde galería o cámara)

### Calendario
- Selector de mes (navega hacia atrás y adelante)
- Consulta todos los pedidos del mes filtrado por `fechaInicio` / `fechaFin`
- Agrupa pedidos por día de entrega, ordenados cronológicamente
- Cada día es expandible/colapsable
- Tap en un pedido navega al detalle completo (con edición disponible)

### Perfil
- Información del usuario autenticado
- Botón de cerrar sesión

---

## Scripts disponibles

```bash
npm start          # Inicia Metro bundler (QR para Expo Go)
npm run android    # Inicia directamente en emulador/dispositivo Android
npm run ios        # Inicia en simulador iOS (requiere macOS)
npm run web        # Inicia en navegador (modo web experimental)
```

---

## Notas técnicas

- **Firebase 12**: `getReactNativePersistence` no existe en esta versión. Se usa `inMemoryPersistence` para la sesión activa y `expo-secure-store` para persistencia entre reinicios.
- **Tokens**: Firebase Auth genera ID tokens de corta duración. El interceptor de Axios siempre obtiene un token fresco desde `currentUser.getIdToken()` antes de cada petición. En reinicio en frío (sin usuario en memoria) usa el token guardado en SecureStore; si expira, el interceptor 401 limpia la sesión.
- **TanStack Query**: el estado del servidor en las listas de pedidos y productos es manejado con `useQuery`, lo que habilita caché, refetch al enfocar pantalla y manejo de estados de carga/error.
- **Timestamps Firestore**: el backend devuelve fechas como `{ seconds, nanoseconds }`. La función `tsToDate()` convierte de forma segura (retorna `new Date()` si es nulo).
