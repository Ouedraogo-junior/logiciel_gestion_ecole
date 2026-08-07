import { useNavigate } from 'react-router-dom';
import { CalendarRange } from 'lucide-react';

export default function AucuneAnneeActive() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg border border-border px-6 py-10 text-center flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-ardoise-light flex items-center justify-center text-ardoise">
        <CalendarRange size={22} />
      </div>
      <div>
        <p className="text-sm font-semibold text-charbon">Aucune année scolaire active</p>
        <p className="text-sm text-charbon-muted mt-1 max-w-sm">
          Crée une année scolaire pour commencer à utiliser le logiciel — élèves, classes, notes et paiements en dépendent tous.
        </p>
      </div>
      <button
        onClick={() => navigate('/annees-scolaires')}
        className="text-sm font-medium px-4 py-2 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white transition-colors"
      >
        Aller aux années scolaires
      </button>
    </div>
  );
}