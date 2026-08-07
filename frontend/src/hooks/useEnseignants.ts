import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface EnseignantAffectation {
  id: number;
  classe: { id: number; nom: string };
  matiere: { id: number; nom: string };
  coefficient: number;
}

export interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
  pseudo: string;
  telephone_contact: string | null;
  actif: boolean;
  affectations: EnseignantAffectation[];
}

export function useEnseignants(actif?: boolean) {
  const { data: enseignants = [], isLoading: loading } = useQuery({
    queryKey: ['enseignants', actif],
    queryFn: async () => {
      const { data } = await client.get('/enseignants', {
        params: actif !== undefined ? { actif: actif ? 1 : 0 } : {},
      });
      return data.data as Enseignant[];
    },
  });

  return { enseignants, loading };
}