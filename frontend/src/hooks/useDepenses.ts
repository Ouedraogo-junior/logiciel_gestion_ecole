import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface Depense {
  id: number;
  categorie_depense_id: number;
  montant: number;
  date_depense: string;
  description: string;
  statut: 'valide' | 'annule';
  categorie?: { id: number; nom: string };
}

export function useDepenses(filtres: { categorie_depense_id?: number; statut?: string } = {}) {
  const { data: depenses = [], isLoading: loading } = useQuery({
    queryKey: ['depenses', filtres],
    queryFn: async () => {
      const { data } = await client.get('/depenses', { params: filtres });
      return data.data as Depense[];
    },
  });
  return { depenses, loading };
}