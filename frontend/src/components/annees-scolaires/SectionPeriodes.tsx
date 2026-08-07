import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import client from '../../api/client';
import { usePeriodes } from '../../hooks/usePeriodes';
import ModalPeriode from './ModalPeriode';
import type { Periode } from '../../types';

export default function SectionPeriodes({ anneeScolaireId }: { anneeScolaireId: number }) {
  const queryClient = useQueryClient();
  const { periodes } = usePeriodes(anneeScolaireId);
  const [modal, setModal] = useState<{ mode: 'creation' } | { mode: 'edition'; periode: Periode } | null>(null);

  const suppressionMutation = useMutation({
    mutationFn: async (id: number) => { await client.delete(`/periodes/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'periodes' }),
  });

  return (
    <div className="bg-white rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-sm text-ardoise font-display">Périodes</h2>
          <p className="text-xs text-charbon-muted mt-0.5">Trimestres, semestres, ou tout autre découpage — librement défini.</p>
        </div>
        <button onClick={() => setModal({ mode: 'creation' })}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white transition-colors">
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {periodes.length === 0 ? (
        <p className="text-sm text-charbon-muted">Aucune période définie pour cette année.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {periodes.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-2.5 border border-border rounded-md">
              <div>
                <span className="text-sm font-medium text-charbon">{p.nom}</span>
                <span className="text-xs text-charbon-muted ml-2">
                  {new Date(p.date_debut).toLocaleDateString('fr-FR')} → {new Date(p.date_fin).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setModal({ mode: 'edition', periode: p })} className="text-charbon-light hover:text-ardoise transition-colors">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => window.confirm(`Supprimer "${p.nom}" ?`) && suppressionMutation.mutate(p.id)}
                  className="text-charbon-light hover:text-terracotta transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ModalPeriode
          anneeScolaireId={anneeScolaireId}
          periode={modal.mode === 'edition' ? modal.periode : null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}