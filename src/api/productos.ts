import client from './client';
import type { Producto, ProductoFormPayload, ProductosFiltros } from '../types';

export async function getProductos(filtros?: ProductosFiltros): Promise<Producto[]> {
  const { data } = await client.get<Producto[]>('/productos', { params: filtros });
  return data;
}

export async function getProducto(id: string): Promise<Producto> {
  const { data } = await client.get<Producto>(`/productos/${id}`);
  return data;
}

export async function createProducto(payload: ProductoFormPayload): Promise<Producto> {
  const { data } = await client.post<Producto>('/productos', payload);
  return data;
}

export async function updateProducto(id: string, payload: Partial<ProductoFormPayload>): Promise<Producto> {
  const { data } = await client.patch<Producto>(`/productos/${id}`, payload);
  return data;
}

export async function deleteProducto(id: string): Promise<void> {
  await client.delete(`/productos/${id}`);
}

export async function uploadImagen(uri: string): Promise<string> {
  const formData = new FormData();
  const filename = uri.split('/').pop() ?? 'imagen.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', { uri, name: filename, type } as unknown as Blob);

  const { data } = await client.post<{ url: string }>('/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}
