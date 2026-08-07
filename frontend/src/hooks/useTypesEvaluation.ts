import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface TypeEvaluation {
  id: number;
  nom: string;
  ponderation: number;
  note_maximale: number;
}

export function useTypesEvaluation() {
  const { data: typesEvaluation = [], isLoading: loading } = useQuery({
    queryKey: ['types-evaluation'],
    queryFn: async () => (await client.get('/types-evaluation')).data.data as TypeEvaluation[],
    staleTime: 30 * 60 * 1000,
  });

  return { typesEvaluation, loading };
}