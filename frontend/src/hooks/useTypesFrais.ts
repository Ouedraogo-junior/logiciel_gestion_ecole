import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface TypeFrais { id: number; nom: string; niveau: string | null; description: string | null; }

export function useTypesFrais(anneeScolaireId?: number, niveau?: string) {
  const { data: typesFrais = [], isLoading: loading } = useQuery({
    queryKey: ['types-frais', anneeScolaireId, niveau],
    queryFn: async () => {
      const { data } = await client.get('/types-frais', { params: { annee_scolaire_id: anneeScolaireId, niveau } });
      return data.data as TypeFrais[];
    },
    enabled: !!anneeScolaireId,
  });
  return { typesFrais, loading };
}