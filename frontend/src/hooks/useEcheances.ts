import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface Echeance {
  id: number;
  nom: string;
  montant: number;
  date_echeance: string | null;
  montant_paye?: number;
  solde_restant?: number;
}

export function useEcheances(typeFraisId?: number, eleveId?: number) {
  const { data: echeances = [], isLoading: loading } = useQuery({
    queryKey: ['echeances', typeFraisId, eleveId],
    queryFn: async () => {
      const { data } = await client.get('/echeances', {
        params: { type_frais_id: typeFraisId, eleve_id: eleveId },
      });
      return data.data as Echeance[];
    },
    enabled: !!typeFraisId,
  });
  return { echeances, loading };
}