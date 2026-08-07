import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface Affectation {
  id: number;
  classe_id: number;
  matiere_id: number;
  classe: { id: number; nom: string };
  matiere: { id: number; nom: string };
}

export function useAffectations(enseignantId?: number) {
  const { data: affectations = [], isLoading: loading } = useQuery({
    queryKey: ['affectations', enseignantId],
    queryFn: async () => {
      const { data } = await client.get('/affectations', { params: enseignantId ? { enseignant_id: enseignantId } : {} });
      return data.data as Affectation[];
    },
    enabled: !!enseignantId,
  });

  return { affectations, loading };
}