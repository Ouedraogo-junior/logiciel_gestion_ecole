import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { getErrorMessage } from '../../api/errors';
import { useAnneesScolaires } from '../../hooks/useAnneesScolaires';

export default function ModalDupliquerClasses({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { anneesScolaires } = useAnneesScolaires();

  const [anneeSourceId, setAnneeSourceId] = useState('');
  const [anneeCibleId, setAnneeCibleId] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultat, setResultat] = useState<{ message: string; ignorees: string[] } | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.post('/classes/dupliquer', {
        annee_source_id: Number(anneeSourceId),
        annee_cible_id: Number(anneeCibleId),
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'classes' });
      setResultat({ message: data.message, ignorees: data.ignorees });
      setErreur(null);
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleSubmit() {
    setErreur(null);
    setResultat(null);
    if (!anneeSourceId || !anneeCibleId) { setErreur('Sélectionne les deux années.'); return; }
    if (anneeSourceId === anneeCibleId) { setErreur('Choisis deux années différentes.'); return; }
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-charbon/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-ardoise font-display">Dupliquer les classes</h2>
          <button onClick={onClose} className="text-sm px-2 py-1 rounded hover:bg-gray-100 text-charbon-muted">✕</button>
        </div>

        <p className="text-sm text-charbon-muted mb-4">
          Recrée les mêmes classes (nom, niveau, effectif max) dans une autre année scolaire. Les titulaires ne sont pas reportés — à réaffecter ensuite.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Copier depuis</label>
            <select value={anneeSourceId} onChange={(e) => setAnneeSourceId(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white">
              <option value="">Sélectionner</option>
              {anneesScolaires.map((a) => <option key={a.id} value={a.id}>{a.libelle}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Vers</label>
            <select value={anneeCibleId} onChange={(e) => setAnneeCibleId(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white">
              <option value="">Sélectionner</option>
              {anneesScolaires.map((a) => <option key={a.id} value={a.id}>{a.libelle}</option>)}
            </select>
          </div>

          {erreur && <p className="text-xs font-medium px-3 py-2 rounded bg-terracotta-light text-terracotta">{erreur}</p>}
          {resultat && (
            <div className="text-xs font-medium px-3 py-2 rounded bg-foret-light text-foret">
              <p>{resultat.message}</p>
              {resultat.ignorees.length > 0 && (
                <p className="mt-1 text-charbon-muted font-normal">Déjà existantes, ignorées : {resultat.ignorees.join(', ')}</p>
              )}
            </div>
          )}

          <button onClick={handleSubmit} disabled={mutation.isPending}
            className="bg-terracotta hover:bg-terracotta-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {mutation.isPending ? 'Duplication...' : 'Dupliquer'}
          </button>
        </div>
      </div>
    </div>
  );
}