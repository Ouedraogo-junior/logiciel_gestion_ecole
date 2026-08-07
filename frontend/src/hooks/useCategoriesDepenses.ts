import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface CategorieDepense { id: number; nom: string; description: string | null; annee_scolaire_id: number; }

export function useCategoriesDepenses(anneeScolaireId?: number) {
  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: ['categories-depenses', anneeScolaireId],
    queryFn: async () => {
      const { data } = await client.get('/categories-depenses', { params: { annee_scolaire_id: anneeScolaireId } });
      return data.data as CategorieDepense[];
    },
    enabled: !!anneeScolaireId,
  });
  return { categories, loading };
}