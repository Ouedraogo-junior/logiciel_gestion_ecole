import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { getErrorMessage } from '../../api/errors';
import { useNiveaux } from '../../hooks/useNiveaux';
import type { TypeFrais } from '../../hooks/useTypesFrais';

interface Props {
  anneeScolaireId: number;
  typeFrais?: TypeFrais | null;
  onClose: () => void;
}

export default function ModalTypeFrais({ anneeScolaireId, typeFrais, onClose }: Props) {
  const queryClient = useQueryClient();
  const estEdition = !!typeFrais;

  const [nom, setNom] = useState(typeFrais?.nom ?? '');
  const [niveau, setNiveau] = useState(typeFrais?.niveau ?? '');
  const [description, setDescription] = useState(typeFrais?.description ?? '');
  const [erreur, setErreur] = useState<string | null>(null);
  const { niveaux } = useNiveaux();

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { nom, niveau: niveau || null, description: description || undefined };
      if (estEdition) {
        const { data } = await client.patch(`/types-frais/${typeFrais!.id}`, payload);
        return data;
      }
      const { data } = await client.post('/types-frais', { ...payload, annee_scolaire_id: anneeScolaireId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'types-frais' });
      onClose();
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!nom.trim()) { setErreur('Donne un nom au type de frais.'); return; }
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-charbon/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-ardoise font-display">{estEdition ? 'Modifier le type de frais' : 'Nouveau type de frais'}</h2>
          <button type="button" onClick={onClose} className="text-sm px-2 py-1 rounded hover:bg-gray-100 text-charbon-muted">✕</button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon">Nom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex : Frais de scolarité, Frais d'examen CEP..."
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon">Niveau concerné</label>
            <select value={niveau} onChange={(e) => setNiveau(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white">
              <option value="">Tous les niveaux</option>
              {niveaux.map((n) => <option key={n} value={n}>{n} uniquement</option>)}
            </select>
            <p className="text-xs text-charbon-muted mt-1">
              Laisse "Tous les niveaux" pour une scolarité commune, ou choisis un niveau pour un frais spécifique (ex : examen CM2).
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon">
              Description <span className="text-charbon-muted font-normal">(optionnel)</span>
            </label>
            <input value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>

          {erreur && <p className="text-xs font-medium px-3 py-2 rounded bg-terracotta-light text-terracotta">{erreur}</p>}

          <button type="submit" disabled={mutation.isPending}
            className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-colors bg-terracotta hover:bg-terracotta-hover disabled:opacity-50">
            {mutation.isPending ? 'Enregistrement...' : estEdition ? 'Enregistrer' : 'Créer le type de frais'}
          </button>
        </div>
      </form>
    </div>
  );
}