import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import client from '../../api/client';
import { useEcheances } from '../../hooks/useEcheances';
import ModalEcheance from './ModalEcheance';
import { formaterMontant } from '../../utils/format';
import type { TypeFrais } from '../../hooks/useTypesFrais';
import type { Echeance } from '../../hooks/useEcheances';

interface Props {
  typeFrais: TypeFrais;
  onModifier: () => void;
  onSupprimer: () => void;
}

export default function BlocTypeFrais({ typeFrais, onModifier, onSupprimer }: Props) {
  const queryClient = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const { echeances } = useEcheances(typeFrais.id);
  const [modalEcheance, setModalEcheance] = useState<{ mode: 'creation' } | { mode: 'edition'; echeance: Echeance } | null>(null);

  const suppressionEcheanceMutation = useMutation({
    mutationFn: async (id: number) => { await client.delete(`/echeances/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'echeances' }),
  });

  const totalType = echeances.reduce((s, e) => s + Number(e.montant), 0);

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#fdfcfa]">
        <button onClick={() => setOuvert((v) => !v)} className="flex items-center gap-2 text-left flex-1">
          {ouvert ? <ChevronDown size={16} className="text-charbon-muted" /> : <ChevronRight size={16} className="text-charbon-muted" />}
          <div>
            <span className="text-sm font-medium text-charbon">{typeFrais.nom}</span>
            {typeFrais.niveau ? (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-terracotta-light text-terracotta ml-2">{typeFrais.niveau}</span>
            ) : (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-[#f3ede7] text-charbon-muted ml-2">Tous niveaux</span>
            )}
            <span className="text-xs text-charbon-muted ml-2">
              {echeances.length} échéance(s) — {formaterMontant(totalType)} FCFA au total
            </span>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={onModifier} className="text-charbon-light hover:text-ardoise transition-colors"><Pencil size={14} /></button>
          <button onClick={onSupprimer} className="text-charbon-light hover:text-terracotta transition-colors"><Trash2 size={14} /></button>
        </div>
      </div>

      {ouvert && (
        <div className="px-4 py-3 flex flex-col gap-2">
          {echeances.length === 0 ? (
            <p className="text-xs text-charbon-muted">Aucune échéance définie.</p>
          ) : (
            echeances.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-3 py-2 border border-border rounded">
                <div>
                  <span className="text-sm text-charbon">{e.nom}</span>
                  <span className="text-xs text-charbon-muted ml-2">{formaterMontant(e.montant)} FCFA</span>
                  {e.date_echeance && (
                    <span className="text-xs text-charbon-muted ml-2">— limite {new Date(e.date_echeance).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setModalEcheance({ mode: 'edition', echeance: e })} className="text-charbon-light hover:text-ardoise transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => window.confirm(`Supprimer l'échéance "${e.nom}" ?`) && suppressionEcheanceMutation.mutate(e.id)}
                    className="text-charbon-light hover:text-terracotta transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
          <button
            onClick={() => setModalEcheance({ mode: 'creation' })}
            className="flex items-center gap-1.5 text-xs font-medium text-ardoise hover:underline mt-1 w-fit"
          >
            <Plus size={13} /> Ajouter une échéance
          </button>
        </div>
      )}

      {modalEcheance && (
        <ModalEcheance
          typeFraisId={typeFrais.id}
          echeance={modalEcheance.mode === 'edition' ? modalEcheance.echeance : null}
          onClose={() => setModalEcheance(null)}
        />
      )}
    </div>
  );
}