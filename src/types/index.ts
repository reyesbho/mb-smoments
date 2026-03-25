// ─── Timestamps Firebase ──────────────────────────────────────────────────────
export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

export function tsToDate(ts: FirebaseTimestamp | null | undefined): Date {
  if (!ts || ts.seconds == null) return new Date();
  return new Date(ts.seconds * 1000);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  accessToken: string;   // Firebase ID token
  displayName: string;
  email: string;
  emailVerified: boolean;
  uid: string;
}

// ─── Categoría ────────────────────────────────────────────────────────────────
export interface Categoria {
  id: string;
  descripcion: string;
}

// ─── Producto ─────────────────────────────────────────────────────────────────
export type SizeTag =
  | 'Chica'
  | 'Mediana'
  | 'Grande'
  | 'Familiar'
  | 'Mini'
  | 'Por defecto';

export interface ProductoSize {
  size: SizeTag;
  price: number;
}

export interface Producto {
  id: string;
  name: string;
  descripcion: string;
  imagen: string;
  estatus: boolean;
  sizes: ProductoSize[];
  category: string;
}

// ─── Pedido ───────────────────────────────────────────────────────────────────
export type PedidoEstatus = 'BACKLOG' | 'TODO' | 'DONE' | 'CANCELED' | 'DELETE';
export type PedidoPagoEstatus = 'PENDIENTE' | 'PAGADO' | 'ABONADO';

export interface PedidoProductoItem {
  id: string;
  producto: Producto;
  size: ProductoSize;
  cantidad: number;
  subtotal: number;
  caracteristicas: string;
}

export interface Pedido {
  id: string;
  cliente: string;
  clienteLower?: string;
  fechaEntrega: FirebaseTimestamp;
  lugarEntrega: string;
  productos: PedidoProductoItem[];
  estatus: PedidoEstatus;
  estatusPago: PedidoPagoEstatus;
  total: number;
  detalles?: string;
  abonado?: number;
  fechaCreacion: FirebaseTimestamp;
  fechaActualizacion?: FirebaseTimestamp;
  registradoPor: string;
  actualizadoPor?: string;
}

export interface PedidosResponse {
  pedidos: Pedido[];
  nextCursor: string;
  hasMore: boolean;
  totalDocs: number;
  totalPages: number;
  pageSize: number;
}

// ─── Payloads para formularios ────────────────────────────────────────────────
export interface PedidoFormPayload {
  cliente: string;
  lugarEntrega: string;
  fechaEntrega: FirebaseTimestamp;
  productos: PedidoProductoItem[];
  estatus: PedidoEstatus;
  estatusPago: PedidoPagoEstatus;
  total: number;
  detalles?: string;
}

export interface ProductoFormPayload {
  name: string;
  descripcion: string;
  imagen: string;
  estatus: boolean;
  sizes: ProductoSize[];
  category: string;
}

// ─── Filtros ──────────────────────────────────────────────────────────────────
export interface PedidosFiltros {
  estatus?: PedidoEstatus;
  cliente?: string;
  fechaInicio?: string;  // formato DD-MM-YYYY
  fechaFin?: string;     // formato DD-MM-YYYY
  pageSize?: number;
  cursorFechaCreacion?: string;
}

export interface ProductosFiltros {
  tag?: SizeTag;
  estatus?: boolean;
  category?: string;
}
