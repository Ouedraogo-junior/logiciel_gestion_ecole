import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import type { AnneeScolaire, Classe, Presence, Paiement, EleveEnRetard } from '../types';

interface DashboardData {
  totalEleves: number;
  classesActives: Classe[];
  absencesDuJour: Presence[];
  retardsDePaiement: EleveEnRetard[];
  derniersPaiements: Paiement[];
}

export function useDashboardData() {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<DashboardData> => {
      const anneesRes = await client.get('/annees-scolaires');
      const anneeActive = anneesRes.data.data.find((a: AnneeScolaire) => a.is_active);
      const aujourdHui = new Date().toISOString().slice(0, 10);

      const [elevesRes, classesRes, presencesRes, retardsRes, paiementsRes] = await Promise.all([
        client.get('/eleves', { params: { statut: 'actif' } }),
        client.get('/classes', { params: anneeActive ? { annee_scolaire_id: anneeActive.id } : {} }),
        client.get('/presences', { params: { date: aujourdHui } }),
        client.get('/paiements/retards'),
        client.get('/paiements'),
      ]);

      return {
        totalEleves: elevesRes.data.total,
        classesActives: classesRes.data.data,
        absencesDuJour: presencesRes.data.data.filter((p: Presence) => p.statut !== 'present'),
        retardsDePaiement: retardsRes.data.data,
        derniersPaiements: paiementsRes.data.data.slice(0, 5),
      };
    },
    staleTime: 2 * 60 * 1000, // 2 min : plus court que le reste, le dashboard doit rester réactif
  });

  return { data: data ?? null, loading, erreur: error ? 'Impossible de charger le tableau de bord.' : null };
}