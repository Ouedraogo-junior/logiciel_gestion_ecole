import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface Matiere { id: number; nom: string; niveau: string | null; }

export function useMatieres() {
  const { data: matieres = [], isLoading: loading } = useQuery({
    queryKey: ['matieres'],
    queryFn: async () => (await client.get('/matieres')).data.data as Matiere[],
    staleTime: 30 * 60 * 1000,
  });
  return { matieres, loading };
}