import client from './client';
import type { Categoria } from '../types';

export async function getCategorias(): Promise<Categoria[]> {
  const { data } = await client.get<Categoria[]>('/categories');
  return data;
}

export async function createCategoria(descripcion: string): Promise<Categoria> {
  const { data } = await client.post<Categoria>('/categories', { descripcion });
  return data;
}

export async function deleteCategoria(id: string): Promise<void> {
  await client.delete(`/categories/${id}`);
}
