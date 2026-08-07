import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface AffectationClasse {
  id: number;
  matiere_id: number;
  matiere: { id: number; nom: string };
  enseignant: { id: number; nom: string; prenom: string };
}

export function useAffectationsClasse(classeId?: number) {
  const { data: affectations = [], isLoading: loading } = useQuery({
    queryKey: ['affectations', 'classe', classeId],
    queryFn: async () => {
      const { data } = await client.get('/affectations', { params: { classe_id: classeId } });
      return data.data as AffectationClasse[];
    },
    enabled: !!classeId,
  });
  return { affectations, loading };
}