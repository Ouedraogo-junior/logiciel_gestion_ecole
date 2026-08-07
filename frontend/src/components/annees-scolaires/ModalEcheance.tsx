import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { getErrorMessage } from '../../api/errors';
import { nettoyerSaisieNombre, nombreDepuisTexte } from '../../utils/nombre';
import type { Echeance } from '../../hooks/useEcheances';

interface Props {
  typeFraisId: number;
  echeance?: Echeance | null;
  onClose: () => void;
}

export default function ModalEcheance({ typeFraisId, echeance, onClose }: Props) {
  const queryClient = useQueryClient();
  const estEdition = !!echeance;

  const [nom, setNom] = useState(echeance?.nom ?? '');
  const [montant, setMontant] = useState(echeance ? String(echeance.montant) : '');
  const [dateEcheance, setDateEcheance] = useState(echeance?.date_echeance?.slice(0, 10) ?? '');
  const [ordre, setOrdre] = useState('1');
  const [erreur, setErreur] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nom,
        montant: nombreDepuisTexte(montant),
        date_echeance: dateEcheance || undefined,
        ordre: Number(ordre) || 1,
      };
      if (estEdition) {
        const { data } = await client.patch(`/echeances/${echeance!.id}`, payload);
        return data;
      }
      const { data } = await client.post('/echeances', { ...payload, type_frais_id: typeFraisId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'echeances' });
      onClose();
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!nom.trim()) { setErreur('Donne un nom à cette échéance.'); return; }
    const montantNombre = nombreDepuisTexte(montant);
    if (!montant || isNaN(montantNombre) || montantNombre <= 0) { setErreur('Montant invalide.'); return; }
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-charbon/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-ardoise font-display">{estEdition ? "Modifier l'échéance" : 'Nouvelle échéance'}</h2>
          <button type="button" onClick={onClose} className="text-sm px-2 py-1 rounded hover:bg-gray-100 text-charbon-muted">✕</button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon">Nom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex : Tranche 1, Mensualité Octobre..."
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon">Montant (FCFA)</label>
              <input type="text" inputMode="decimal" value={montant} onChange={(e) => setMontant(nettoyerSaisieNombre(e.target.value))} placeholder="15000"
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon">
                Date limite <span className="text-charbon-muted font-normal">(optionnel)</span>
              </label>
              <input type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon">Ordre d'affichage</label>
            <input type="number" min="1" value={ordre} onChange={(e) => setOrdre(e.target.value)}
              className="w-24 border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>

          {erreur && <p className="text-xs font-medium px-3 py-2 rounded bg-terracotta-light text-terracotta">{erreur}</p>}

          <button type="submit" disabled={mutation.isPending}
            className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-colors bg-terracotta hover:bg-terracotta-hover disabled:opacity-50">
            {mutation.isPending ? 'Enregistrement...' : estEdition ? 'Enregistrer' : "Créer l'échéance"}
          </button>
        </div>
      </form>
    </div>
  );
}