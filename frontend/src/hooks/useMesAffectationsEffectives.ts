import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface ClasseMatieresEffectives {
  classe: { id: number; nom: string };
  matieres: { id: number; nom: string }[];
}

export function useMesAffectationsEffectives(actif: boolean) {
  const { data: classesMatieres = [], isLoading: loading } = useQuery({
    queryKey: ['mes-affectations-effectives'],
    queryFn: async () => (await client.get('/notes/mes-affectations-effectives')).data.data as ClasseMatieresEffectives[],
    enabled: actif,
  });
  return { classesMatieres, loading };
}