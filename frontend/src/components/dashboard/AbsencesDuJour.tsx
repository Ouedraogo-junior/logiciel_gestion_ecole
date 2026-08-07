import { useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import EmptyState from '../ui/EmptyState';
import type { Presence } from '../../types';

export default function AbsencesDuJour({ absences }: { absences: Presence[] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg border border-border">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-sm text-ardoise font-display">Absences du jour</h2>
        <button onClick={() => navigate('/presences')} className="text-xs text-charbon-muted hover:underline">
          Voir l'appel
        </button>
      </div>
      <div className="divide-y divide-[#f3ede7]">
        {absences.length === 0 ? (
          <EmptyState message="Aucune absence enregistrée" />
        ) : (
          absences.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => p.eleve && navigate(`/eleves/${p.eleve.id}`)}
            >
              <div className="flex items-center gap-3">
                {p.eleve && <Avatar prenom={p.eleve.prenom} nom={p.eleve.nom} />}
                <p className="text-sm font-medium text-charbon">
                  {p.eleve ? `${p.eleve.prenom} ${p.eleve.nom}` : 'Élève'}
                </p>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-terracotta-light text-terracotta">
                {p.statut === 'retard' ? 'Retard' : 'Absent'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}