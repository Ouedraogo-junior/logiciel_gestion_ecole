import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import type { AnneeScolaire, Periode } from '../types';

interface AnneeScolaireDetail extends AnneeScolaire {
  periodes: Periode[];
}

export function useAnneeScolaireDetail(id: string | undefined) {
  const { data: anneeScolaire, isLoading: loading } = useQuery({
    queryKey: ['annee-scolaire', id],
    queryFn: async () => {
      const { data } = await client.get(`/annees-scolaires/${id}`);
      return data.data as AnneeScolaireDetail;
    },
    enabled: !!id,
  });
  return { anneeScolaire: anneeScolaire ?? null, loading };
}