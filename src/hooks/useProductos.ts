import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductos, updateProducto } from '../api/productos';
import type { ProductosFiltros } from '../types';

export function useProductos(filtros?: ProductosFiltros) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['productos', filtros],
    queryFn: () => getProductos(filtros),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const toggleEstatusMutation = useMutation({
    mutationFn: ({ id, estatus }: { id: string; estatus: boolean }) =>
      updateProducto(id, { estatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });

  return {
    productos: query.data ?? [],
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching,
    error: query.isError ? 'No se pudieron cargar los productos.' : null,
    refresh: query.refetch,
    toggleEstatus: (id: string, estatus: boolean) =>
      toggleEstatusMutation.mutate({ id, estatus }),
  };
}
