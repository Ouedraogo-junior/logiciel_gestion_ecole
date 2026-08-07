import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { getErrorMessage } from '../../api/errors';
import type { Periode } from '../../types';

interface Props {
  anneeScolaireId: number;
  periode?: Periode | null;
  onClose: () => void;
}

export default function ModalPeriode({ anneeScolaireId, periode, onClose }: Props) {
  const queryClient = useQueryClient();
  const estEdition = !!periode;

  const [nom, setNom] = useState(periode?.nom ?? '');
  const [dateDebut, setDateDebut] = useState(periode?.date_debut?.slice(0, 10) ?? '');
  const [dateFin, setDateFin] = useState(periode?.date_fin?.slice(0, 10) ?? '');
  const [ordre, setOrdre] = useState(periode?.ordre !== undefined ? String(periode.ordre) : '1');
  const [erreur, setErreur] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { nom, date_debut: dateDebut, date_fin: dateFin, ordre: Number(ordre) || 1 };
      if (estEdition) {
        const { data } = await client.patch(`/periodes/${periode!.id}`, payload);
        return data;
      }
      const { data } = await client.post('/periodes', { ...payload, annee_scolaire_id: anneeScolaireId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'periodes' });
      onClose();
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!nom.trim()) { setErreur('Donne un nom à la période.'); return; }
    if (!dateDebut || !dateFin) { setErreur('Renseigne les deux dates.'); return; }
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-charbon/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-ardoise font-display">{estEdition ? 'Modifier la période' : 'Nouvelle période'}</h2>
          <button type="button" onClick={onClose} className="text-sm px-2 py-1 rounded hover:bg-gray-100 text-charbon-muted">✕</button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon">Nom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex : Trimestre 1, Semestre 1..."
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon">Date de début</label>
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon">Date de fin</label>
              <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
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
            {mutation.isPending ? 'Enregistrement...' : estEdition ? 'Enregistrer' : 'Créer la période'}
          </button>
        </div>
      </form>
    </div>
  );
}