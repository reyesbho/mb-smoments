import client from './client';
import type { Pedido, PedidosResponse, PedidosFiltros } from '../types';

export async function getPedidos(filtros?: PedidosFiltros): Promise<PedidosResponse> {
  const { data } = await client.get<PedidosResponse>('/pedidos', { params: filtros });
  return data;
}

export async function getPedido(id: string): Promise<Pedido> {
  const { data } = await client.get<Pedido>(`/pedidos/${id}`);
  return data;
}

export async function createPedido(payload: Partial<Pedido>): Promise<Pedido> {
  const { data } = await client.post<Pedido>('/pedidos', payload);
  return data;
}

export async function updatePedido(id: string, payload: Partial<Pedido>): Promise<Pedido> {
  const { data } = await client.patch<Pedido>(`/pedidos/${id}`, payload);
  return data;
}

export async function deletePedido(id: string): Promise<void> {
  await client.delete(`/pedidos/${id}`);
}
