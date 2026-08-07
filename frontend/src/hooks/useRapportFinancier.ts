import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface RapportFinancier {
  periode: string;
  total_recettes: number;
  total_depenses: number;
  solde_net: number;
}

interface Params {
  periodeId?: number;
  anneeScolaireId?: number;
}

export function useRapportFinancier({ periodeId, anneeScolaireId }: Params) {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['rapport-financier', periodeId, anneeScolaireId],
    queryFn: async () => {
      const { data } = await client.get('/rapport-financier', {
        params: { periode_id: periodeId, annee_scolaire_id: anneeScolaireId },
      });
      return data.data as RapportFinancier;
    },
    enabled: !!(periodeId || anneeScolaireId),
  });
  return { rapport: data ?? null, loading };
}