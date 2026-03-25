import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducto, createProducto, updateProducto } from '../api/productos';
import type { ProductoFormPayload } from '../types';

export function useProducto(id?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['producto', { id }],
    queryFn: () => getProducto(id!),
    enabled: !!id,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: ProductoFormPayload) =>
      id ? updateProducto(id, payload) : createProducto(payload),
    onSuccess: (producto) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.setQueryData(['producto', { id: producto.id }], producto);
    },
  });

  return {
    producto: query.data,
    isLoading: query.isLoading,
    error: query.isError ? 'No se pudo cargar el producto.' : null,
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.isError ? 'No se pudo guardar el producto.' : null,
  };
}
