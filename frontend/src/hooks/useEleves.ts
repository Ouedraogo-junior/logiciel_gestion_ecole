import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import type { Eleve, ReponsePaginee } from '../types';

interface Filtres {
  classe_id?: number;
  recherche?: string;
  per_page?: number;
  tri?: 'asc' | 'desc';
}

export function useEleves(filtres: Filtres) {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['eleves', filtres],
    queryFn: async () => {
      const { data } = await client.get<ReponsePaginee<Eleve>>('/eleves', { params: filtres });
      return data;
    },
  });

  return { eleves: data?.data ?? [], total: data?.total ?? 0, loading };
}