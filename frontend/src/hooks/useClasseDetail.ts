import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import type { Classe } from '../types';

export function useClasseDetail(id: string | undefined) {
  const { data: classe, isLoading: loading } = useQuery({
    queryKey: ['classe', id],
    queryFn: async () => {
      const { data } = await client.get(`/classes/${id}`);
      return data.data as Classe;
    },
    enabled: !!id,
  });
  return { classe: classe ?? null, loading };
}