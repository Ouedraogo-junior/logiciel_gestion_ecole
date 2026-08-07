import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import type { AnneeScolaire } from '../types';

export function useAnneesScolaires() {
  const { data: anneesScolaires = [], isLoading: loading } = useQuery({
    queryKey: ['annees-scolaires', 'toutes'],
    queryFn: async () => (await client.get('/annees-scolaires')).data.data as AnneeScolaire[],
  });
  return { anneesScolaires, loading };
}