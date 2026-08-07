import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { getErrorMessage } from '../../api/errors';
import type { ExamenNational } from '../../hooks/useExamensNationaux';

interface Props {
  examen: ExamenNational;
  nomEleve: string;
  onClose: () => void;
}

export default function ModalExamenNational({ examen, nomEleve, onClose }: Props) {
  const queryClient = useQueryClient();

  const [numeroCandidat, setNumeroCandidat] = useState(examen.numero_candidat ?? '');
  const [centreExamen, setCentreExamen] = useState(examen.centre_examen ?? '');
  const [dateExamen, setDateExamen] = useState(examen.date_examen?.slice(0, 10) ?? '');
  const [resultat, setResultat] = useState(examen.resultat);
  const [mention, setMention] = useState(examen.mention ?? '');
  const [datePublication, setDatePublication] = useState(examen.date_publication_resultat?.slice(0, 10) ?? '');
  const [erreur, setErreur] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.patch(`/examens-nationaux/${examen.id}`, {
        numero_candidat: numeroCandidat || null,
        centre_examen: centreExamen || null,
        date_examen: dateExamen || null,
        resultat,
        mention: mention || null,
        date_publication_resultat: datePublication || null,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examens-nationaux'] });
      onClose();
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-charbon/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-ardoise font-display">Examen national — {nomEleve}</h2>
          <button type="button" onClick={onClose} className="text-sm px-2 py-1 rounded hover:bg-gray-100 text-charbon-muted">✕</button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon">N° Candidat</label>
              <input value={numeroCandidat} onChange={(e) => setNumeroCandidat(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon">Date de l'examen</label>
              <input type="date" value={dateExamen} onChange={(e) => setDateExamen(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon">Centre d'examen</label>
            <input value={centreExamen} onChange={(e) => setCentreExamen(e.target.value)} placeholder="si différent de l'école"
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>

          <div className="pt-3 border-t border-border">
            <p className="text-xs font-semibold text-charbon-muted uppercase mb-3">Résultat (une fois publié)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-charbon">Résultat</label>
                <select value={resultat} onChange={(e) => setResultat(e.target.value as typeof resultat)}
                  className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white">
                  <option value="en_attente">En attente</option>
                  <option value="admis">Admis</option>
                  <option value="ajourne">Ajourné</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-charbon">Date de publication</label>
                <input type="date" value={datePublication} onChange={(e) => setDatePublication(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium mb-1.5 text-charbon">
                Mention <span className="text-charbon-muted font-normal">(optionnel)</span>
              </label>
              <input value={mention} onChange={(e) => setMention(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
          </div>

          {erreur && <p className="text-xs font-medium px-3 py-2 rounded bg-terracotta-light text-terracotta">{erreur}</p>}

          <button type="submit" disabled={mutation.isPending}
            className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-colors bg-terracotta hover:bg-terracotta-hover disabled:opacity-50">
            {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}