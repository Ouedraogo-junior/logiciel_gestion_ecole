import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import client from '../api/client';
import { getErrorMessage } from '../api/errors';
import { useAnneeActive } from '../hooks/useAnneeActive';
import { useAnneesScolaires } from '../hooks/useAnneesScolaires';
import SelecteurEnseignant from '../components/ui/SelecteurEnseignant';
import { useNiveaux } from '../hooks/useNiveaux';

export default function ClasseForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { anneeActive } = useAnneeActive();
  const { anneesScolaires } = useAnneesScolaires();

  const [nom, setNom] = useState('');
  const { niveaux } = useNiveaux();
  const [niveau, setNiveau] = useState('');
  const [anneeScolaireId, setAnneeScolaireId] = useState('');
  const [effectifMax, setEffectifMax] = useState('');
  const [titulaireId, setTitulaireId] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!anneeScolaireId && anneeActive) setAnneeScolaireId(String(anneeActive.id));
  }, [anneeActive, anneeScolaireId]);

  useEffect(() => {
    if (!niveau && niveaux.length > 0) setNiveau(niveaux[0]);
  }, [niveaux, niveau]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.post('/classes', {
        nom,
        niveau,
        annee_scolaire_id: Number(anneeScolaireId),
        effectif_max: effectifMax ? Number(effectifMax) : undefined,
        enseignant_titulaire_id: titulaireId ? Number(titulaireId) : undefined,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'classes' });
      navigate(`/classes/${data.data.id}`);
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    mutation.mutate();
  }

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => navigate('/classes')} className="flex items-center gap-1.5 text-sm text-charbon-muted hover:text-charbon w-fit">
        <ArrowLeft size={16} /> Retour à la liste
      </button>

      <h1 className="text-xl font-semibold text-ardoise font-display">Ajouter une classe</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-6 flex flex-col gap-5 max-w-xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-charbon">Nom de la classe</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} required placeholder="ex : CE1 A"
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-charbon">Niveau</label>
            <select value={niveau} onChange={(e) => setNiveau(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white">
              {niveaux.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-charbon">Année scolaire</label>
            <select value={anneeScolaireId} onChange={(e) => setAnneeScolaireId(e.target.value)} required
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white">
              <option value="">Sélectionner</option>
              {anneesScolaires.map((a) => (
                <option key={a.id} value={a.id}>{a.libelle}{a.is_active ? ' (active)' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-charbon">
              Effectif max <span className="text-charbon-muted font-normal">(optionnel)</span>
            </label>
            <input type="number" min="1" value={effectifMax} onChange={(e) => setEffectifMax(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-charbon">
            Enseignant titulaire <span className="text-charbon-muted font-normal">(optionnel, modifiable plus tard)</span>
          </label>
          <SelecteurEnseignant
            value={titulaireId}
            onChange={setTitulaireId}
            anneeScolaireId={anneeScolaireId ? Number(anneeScolaireId) : undefined}
          />
        </div>

        {erreur && (
          <div className="text-sm text-terracotta bg-terracotta-light border border-terracotta/20 rounded-md px-3 py-2">
            {erreur}
          </div>
        )}

        <button type="submit" disabled={mutation.isPending}
          className="self-start bg-terracotta hover:bg-terracotta-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
          {mutation.isPending ? 'Enregistrement...' : 'Créer la classe'}
        </button>
      </form>
    </div>
  );
}