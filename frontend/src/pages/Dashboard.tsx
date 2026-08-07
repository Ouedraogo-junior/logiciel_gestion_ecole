import { useDashboardData } from '../hooks/useDashboardData';
import StatsGrid from '../components/dashboard/StatsGrid';
import AbsencesDuJour from '../components/dashboard/AbsencesDuJour';
import PaiementsEnAttente from '../components/dashboard/PaiementsEnAttente';
import DerniersPaiements from '../components/dashboard/DerniersPaiements';

export default function Dashboard() {
  const { data, loading, erreur } = useDashboardData();

  if (loading) return <p className="text-sm text-charbon-muted">Chargement...</p>;
  if (erreur) return <p className="text-sm text-terracotta">{erreur}</p>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ardoise font-display">Tableau de bord</h1>
        <p className="text-sm mt-0.5 text-charbon-muted">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {' — Vue d\'ensemble de l\'établissement'}
        </p>
      </div>

      <StatsGrid
        totalEleves={data.totalEleves}
        absencesDuJour={data.absencesDuJour.length}
        retardsDePaiement={data.retardsDePaiement.length}
        classesActives={data.classesActives}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AbsencesDuJour absences={data.absencesDuJour} />
        <PaiementsEnAttente retards={data.retardsDePaiement} />
      </div>

      <DerniersPaiements paiements={data.derniersPaiements} />
    </div>
  );
}