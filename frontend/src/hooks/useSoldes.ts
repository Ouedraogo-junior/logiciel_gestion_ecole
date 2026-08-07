import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface Solde { eleve_id: number; solde_restant: number; }

export function useSoldes(classeId?: number, enabled: boolean = true) {
  const { data: soldes = [], isLoading: loading } = useQuery({
    queryKey: ['soldes', classeId],
    queryFn: async () => {
      const { data } = await client.get('/soldes', { params: classeId ? { classe_id: classeId } : {} });
      return data.data as Solde[];
    },
    enabled,
  });
  return { soldes, loading };
}