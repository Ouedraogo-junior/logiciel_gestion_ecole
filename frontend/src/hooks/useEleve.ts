import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import type { EleveDetail } from '../types';

export function useEleve(id: string | undefined) {
  const { data: eleve, isLoading: loading } = useQuery({
    queryKey: ['eleve', id],
    queryFn: async () => {
      const { data } = await client.get(`/eleves/${id}`);
      return data.data as EleveDetail;
    },
    enabled: !!id,
  });

  return { eleve: eleve ?? null, loading };
}