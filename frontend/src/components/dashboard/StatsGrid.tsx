import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, AlertTriangle, BookOpen } from 'lucide-react';
import StatCard from '../ui/StatCard';
import type { Classe } from '../../types';

interface StatsGridProps {
  totalEleves: number;
  absencesDuJour: number;
  retardsDePaiement: number;
  classesActives: Classe[];
}

export default function StatsGrid({ totalEleves, absencesDuJour, retardsDePaiement, classesActives }: StatsGridProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Élèves inscrits"
        value={totalEleves}
        sub={`${classesActives.length} classe(s) active(s)`}
        icon={<Users size={20} />}
        colorClass="bg-ardoise-light text-ardoise"
        onClick={() => navigate('/eleves')}
      />
      <StatCard
        label="Absences aujourd'hui"
        value={absencesDuJour}
        icon={<UserCheck size={20} />}
        colorClass="bg-terracotta-light text-terracotta"
        onClick={() => navigate('/presences')}
      />
      <StatCard
        label="Paiements en retard"
        value={retardsDePaiement}
        sub="Scolarité non réglée"
        icon={<AlertTriangle size={20} />}
        colorClass="bg-terracotta-light text-terracotta"
        onClick={() => navigate('/paiements')}
      />
      <StatCard
        label="Classes actives"
        value={classesActives.length}
        sub={classesActives.map((c) => c.nom).join(' · ') || '—'}
        icon={<BookOpen size={20} />}
        colorClass="bg-foret-light text-foret"
      />
    </div>
  );
}