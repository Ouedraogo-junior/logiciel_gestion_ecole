// useAnneeActive.ts
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import type { AnneeScolaire } from '../types';

export function useAnneeActive() {
  const { data: anneeActive, isLoading: loading } = useQuery({
    queryKey: ['annees-scolaires', 'active'],
    queryFn: async () => {
      const { data } = await client.get('/annees-scolaires');
      return data.data.find((a: AnneeScolaire) => a.is_active) ?? null;
    },
  });

  return { anneeActive: anneeActive ?? null, loading };
}