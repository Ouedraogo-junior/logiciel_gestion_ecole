import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import type { Enseignant } from './useEnseignants';

export function useEnseignant(id: string | undefined) {
  const { data: enseignant, isLoading: loading } = useQuery({
    queryKey: ['enseignant', id],
    queryFn: async () => {
      const { data } = await client.get(`/enseignants/${id}`);
      return data.data as Enseignant;
    },
    enabled: !!id,
  });

  return { enseignant: enseignant ?? null, loading };
}