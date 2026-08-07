import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import type { Presence } from '../../types';
import StatGridSkeleton from '../ui/StatGridSkeleton';
import ListSkeleton from '../ui/ListSkeleton';

const styleParStatut = {
  present: { label: 'Présent', bg: 'bg-foret-light', text: 'text-foret' },
  absent: { label: 'Absent', bg: 'bg-terracotta-light', text: 'text-terracotta' },
  retard: { label: 'Retard', bg: 'bg-ardoise-light', text: 'text-ardoise' },
};

export default function OngletPresences({ eleveId }: { eleveId: number }) {
  const debut = new Date();
  debut.setMonth(debut.getMonth() - 3);
  const dateDebut = debut.toISOString().slice(0, 10);
  const dateFin = new Date().toISOString().slice(0, 10);

  const { data: presences = [], isLoading: loadingPresences } = useQuery({
    queryKey: ['presences', eleveId],
    queryFn: async () => {
      const { data } = await client.get('/presences', { params: { eleve_id: eleveId } });
      return data.data as Presence[];
    },
  });

  const { data: assiduite, isLoading: loadingAssiduite } = useQuery({
    queryKey: ['assiduite', eleveId, dateDebut, dateFin],
    queryFn: async () => {
      const { data } = await client.get(`/eleves/${eleveId}/assiduite`, { params: { date_debut: dateDebut, date_fin: dateFin } });
      return data.data as { nb_presences: number; nb_absences: number; nb_retards: number; taux_presence: number | null };
    },
  });

  if (loadingPresences || loadingAssiduite) {
    return (
      <div className="flex flex-col gap-4">
        <StatGridSkeleton count={3} />
        <ListSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {assiduite && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-foret-light rounded-lg px-4 py-3 text-center">
            <p className="text-2xl font-bold text-foret font-display">{assiduite.nb_presences}</p>
            <p className="text-xs text-foret mt-0.5">Présences</p>
          </div>
          <div className="bg-terracotta-light rounded-lg px-4 py-3 text-center">
            <p className="text-2xl font-bold text-terracotta font-display">{assiduite.nb_absences}</p>
            <p className="text-xs text-terracotta mt-0.5">Absences</p>
          </div>
          <div className="bg-ardoise-light rounded-lg px-4 py-3 text-center">
            <p className="text-2xl font-bold text-ardoise font-display">{assiduite.nb_retards}</p>
            <p className="text-xs text-ardoise mt-0.5">Retards</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-border">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm text-ardoise font-display">Historique (3 derniers mois)</h2>
        </div>
        <div className="divide-y divide-[#f3ede7]">
          {presences.length === 0 ? (
            <p className="px-5 py-4 text-sm text-charbon-muted">Aucun enregistrement de présence.</p>
          ) : (
            presences.map((p) => {
              const style = styleParStatut[p.statut];
              return (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-charbon">
                      {new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    {p.motif && <p className="text-xs text-charbon-muted mt-0.5">{p.motif}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}