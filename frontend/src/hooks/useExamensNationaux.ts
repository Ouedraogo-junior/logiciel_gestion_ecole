import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface ExamenNational {
  id: number;
  eleve_id: number;
  statut_inscription: 'non_inscrit' | 'inscrit';
  numero_candidat: string | null;
  centre_examen: string | null;
  date_examen: string | null;
  resultat: 'en_attente' | 'admis' | 'ajourne';
  mention: string | null;
  date_publication_resultat: string | null;
}

export interface CandidatCM2 {
  eleve: { id: number; nom: string; prenom: string; matricule: string };
  classe: { id: number; nom: string };
  examen: ExamenNational | null;
}

export function useExamensNationaux() {
  const { data: candidats = [], isLoading: loading } = useQuery({
    queryKey: ['examens-nationaux'],
    queryFn: async () => (await client.get('/examens-nationaux')).data.data as CandidatCM2[],
  });
  return { candidats, loading };
}