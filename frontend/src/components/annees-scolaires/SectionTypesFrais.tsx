import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import client from '../../api/client';
import { useTypesFrais } from '../../hooks/useTypesFrais';
import ModalTypeFrais from './ModalTypeFrais';
import BlocTypeFrais from './BlocTypeFrais';
import type { TypeFrais } from '../../hooks/useTypesFrais';

export default function SectionTypesFrais({ anneeScolaireId }: { anneeScolaireId: number }) {
  const queryClient = useQueryClient();
  const { typesFrais } = useTypesFrais(anneeScolaireId);
  const [modal, setModal] = useState<{ mode: 'creation' } | { mode: 'edition'; typeFrais: TypeFrais } | null>(null);

  const suppressionMutation = useMutation({
    mutationFn: async (id: number) => { await client.delete(`/types-frais/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'types-frais' }),
  });

  return (
    <div className="bg-white rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-sm text-ardoise font-display">Échéancier de paiement</h2>
          <p className="text-xs text-charbon-muted mt-0.5">Types de frais et leurs tranches — structure libre, aucun montant figé.</p>
        </div>
        <button onClick={() => setModal({ mode: 'creation' })}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white transition-colors">
          <Plus size={14} /> Ajouter un type de frais
        </button>
      </div>

      {typesFrais.length === 0 ? (
        <p className="text-sm text-charbon-muted">Aucun type de frais défini pour cette année.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {typesFrais.map((t) => (
            <BlocTypeFrais
              key={t.id}
              typeFrais={t}
              onModifier={() => setModal({ mode: 'edition', typeFrais: t })}
              onSupprimer={() => window.confirm(`Supprimer "${t.nom}" ? Toutes ses échéances seront aussi supprimées.`) && suppressionMutation.mutate(t.id)}
            />
          ))}
        </div>
      )}

      {modal && (
        <ModalTypeFrais
          anneeScolaireId={anneeScolaireId}
          typeFrais={modal.mode === 'edition' ? modal.typeFrais : null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}