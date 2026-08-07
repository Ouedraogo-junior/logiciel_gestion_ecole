// useClasses.ts
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import type { Classe } from '../types';

export function useClasses(anneeScolaireId?: number) {
  const { data: classes = [], isLoading: loading } = useQuery({
    queryKey: ['classes', anneeScolaireId],
    queryFn: async () => {
      const { data } = await client.get('/classes', { params: { annee_scolaire_id: anneeScolaireId } });
      return data.data as Classe[];
    },
    enabled: !!anneeScolaireId,
  });

  return { classes, loading };
}