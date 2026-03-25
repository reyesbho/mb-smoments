import { useInfiniteQuery } from '@tanstack/react-query';
import { getPedidos } from '../api/pedidos';
import type { PedidoEstatus } from '../types';

interface Options {
  estatus?: PedidoEstatus;
  cliente?: string;
  fechaInicio?: string;
  fechaFin?: string;
  pageSize?: number;
}

export function usePedidos({ estatus, cliente, fechaInicio, fechaFin, pageSize = 20 }: Options = {}) {
  const query = useInfiniteQuery({
    queryKey: ['pedidos', { estatus, cliente, fechaInicio, fechaFin, pageSize }],
    queryFn: ({ pageParam }) =>
      getPedidos({
        estatus,
        cliente,
        fechaInicio,
        fechaFin,
        pageSize,
        cursorFechaCreacion: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const pedidos = query.data?.pages.flatMap((p) => p.pedidos) ?? [];

  return {
    pedidos,
    totalDocs: query.data?.pages[0]?.totalDocs ?? 0,
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    error: query.isError ? 'No se pudieron cargar los pedidos.' : null,
    refresh: query.refetch,
    fetchNextPage: query.fetchNextPage,
  };
}
