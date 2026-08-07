import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { JOURS_SEMAINE, JOURS_LABELS } from '../../utils/joursSemaine';
import type { CreneauEmploiDuTemps } from '../../hooks/useEmploiDuTemps';

interface Props {
  creneaux: CreneauEmploiDuTemps[];
  modifiable: boolean;
  afficherClasse?: boolean;
  onAjouter?: (jour: string) => void;
  onModifier?: (creneau: CreneauEmploiDuTemps) => void;
}

export default function GrilleEmploiDuTemps({ creneaux, modifiable, afficherClasse, onAjouter, onModifier }: Props) {
  const queryClient = useQueryClient();

  const suppressionMutation = useMutation({
    mutationFn: async (id: number) => { await client.delete(`/emplois-du-temps/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'emploi-du-temps' }),
  });

  return (
    <div className="grid grid-cols-6 gap-3">
      {JOURS_SEMAINE.map((jour) => {
        const creneauxJour = creneaux
          .filter((c) => c.jour_semaine === jour)
          .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));

        return (
          <div key={jour} className="bg-white rounded-lg border border-border overflow-hidden">
            <div className="px-3 py-2.5 bg-ardoise text-white text-xs font-semibold text-center">
              {JOURS_LABELS[jour]}
            </div>
            <div className="p-2 flex flex-col gap-2 min-h-[100px]">
              {creneauxJour.length === 0 ? (
                <p className="text-xs text-charbon-light text-center py-3">—</p>
              ) : (
                creneauxJour.map((c) => (
                  <div key={c.id} className="bg-ardoise-light rounded-md p-2 text-xs">
                    <p className="font-semibold text-ardoise">{c.heure_debut.slice(0, 5)} – {c.heure_fin.slice(0, 5)}</p>
                    <p className="text-charbon mt-0.5">{c.matiere?.nom}</p>
                    {afficherClasse ? (
                      <p className="text-charbon-muted">{c.classe?.nom}</p>
                    ) : (
                      <p className="text-charbon-muted">{c.enseignant?.prenom} {c.enseignant?.nom}</p>
                    )}
                    {modifiable && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <button onClick={() => onModifier?.(c)} className="text-ardoise hover:text-ardoise-hover"><Pencil size={12} /></button>
                        <button
                          onClick={() => window.confirm('Supprimer ce créneau ?') && suppressionMutation.mutate(c.id)}
                          className="text-terracotta hover:text-terracotta-hover"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
              {modifiable && (
                <button
                  onClick={() => onAjouter?.(jour)}
                  className="flex items-center justify-center gap-1 text-xs text-ardoise hover:underline py-1.5"
                >
                  <Plus size={12} /> Ajouter
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}