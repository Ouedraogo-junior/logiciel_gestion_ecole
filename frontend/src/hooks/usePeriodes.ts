import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import type { Periode } from '../types';

export function usePeriodes(anneeScolaireId?: number) {
  const { data: periodes = [], isLoading: loading } = useQuery({
    queryKey: ['periodes', anneeScolaireId],
    queryFn: async () => {
      const { data } = await client.get('/periodes', { params: { annee_scolaire_id: anneeScolaireId } });
      return data.data as Periode[];
    },
    enabled: !!anneeScolaireId,
  });

  return { periodes, loading };
}