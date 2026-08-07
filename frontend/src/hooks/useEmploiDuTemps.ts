import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface CreneauEmploiDuTemps {
  id: number;
  classe_id: number;
  matiere_id: number;
  enseignant_id: number;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
  classe?: { id: number; nom: string };
  matiere?: { id: number; nom: string };
  enseignant?: { id: number; nom: string; prenom: string };
}

export function useEmploiDuTemps(classeId?: number) {
  const { data: creneaux = [], isLoading: loading } = useQuery({
    queryKey: ['emploi-du-temps', classeId],
    queryFn: async () => {
      const { data } = await client.get('/emplois-du-temps', { params: classeId ? { classe_id: classeId } : {} });
      return data.data as CreneauEmploiDuTemps[];
    },
  });
  return { creneaux, loading };
}