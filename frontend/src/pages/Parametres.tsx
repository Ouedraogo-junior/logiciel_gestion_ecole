import { useState, useEffect, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus } from 'lucide-react';
import client from '../api/client';
import { getErrorMessage } from '../api/errors';
import { useParametresEcole } from '../hooks/useParametresEcole';
import { useTypesEvaluation } from '../hooks/useTypesEvaluation';
import { useNiveaux } from '../hooks/useNiveaux';
import { useMatieres } from '../hooks/useMatieres';
import LogoEcole from '../components/parametres/LogoEcole';
import ModalMatiere from '../components/parametres/ModalMatiere';
import type { Matiere } from '../hooks/useMatieres';

export default function Parametres() {
  const queryClient = useQueryClient();
  const { parametres, loading } = useParametresEcole();
  const { typesEvaluation } = useTypesEvaluation();
  const { niveaux } = useNiveaux();
  const { matieres } = useMatieres();

  const [nomEcole, setNomEcole] = useState('');
  const [echelleNotation, setEchelleNotation] = useState('20');
  const [moyennePassage, setMoyennePassage] = useState('10');
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (parametres.nom_ecole) setNomEcole(parametres.nom_ecole);
    if (parametres.echelle_notation) setEchelleNotation(parametres.echelle_notation);
    if (parametres.moyenne_passage) setMoyennePassage(parametres.moyenne_passage);
  }, [parametres]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.put('/parametres-ecole', {
        parametres: { nom_ecole: nomEcole, echelle_notation: echelleNotation, moyenne_passage: moyennePassage },
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['parametres-ecole'] });
      setMessage(data.message);
      setErreur(null);
    },
    onError: (err) => { setErreur(getErrorMessage(err)); setMessage(null); },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    mutation.mutate();
  }

  // --- Niveaux ---
  const [nouveauNiveau, setNouveauNiveau] = useState('');
  const niveauxMutation = useMutation({
    mutationFn: async (nouvelleListe: string[]) => {
      const { data } = await client.put('/parametres-ecole', { parametres: { niveaux: nouvelleListe.join(',') } });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parametres-ecole'] }),
  });

  function ajouterNiveau() {
    if (!nouveauNiveau.trim() || niveaux.includes(nouveauNiveau.trim())) return;
    niveauxMutation.mutate([...niveaux, nouveauNiveau.trim()]);
    setNouveauNiveau('');
  }

  function retirerNiveau(n: string) {
    niveauxMutation.mutate(niveaux.filter((x) => x !== n));
  }

  // --- Types d'évaluation ---
  const suppressionTypeMutation = useMutation({
    mutationFn: async (id: number) => { await client.delete(`/types-evaluation/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['types-evaluation'] }),
  });

  // --- Matières ---
  const [modalMatiere, setModalMatiere] = useState<{ mode: 'creation' } | { mode: 'edition'; matiere: Matiere } | null>(null);
  const suppressionMatiereMutation = useMutation({
    mutationFn: async (id: number) => { await client.delete(`/matieres/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matieres'] }),
  });

  if (loading) return <p className="text-sm text-charbon-muted">Chargement...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ardoise font-display">Paramètres de l'école</h1>
        <p className="text-sm mt-0.5 text-charbon-muted">Réglages généraux, appliqués à tout le logiciel</p>
      </div>

      <div className="bg-white rounded-lg border border-border p-6 max-w-xl">
        <LogoEcole logoPath={parametres.logo_path ?? null} />
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-6 flex flex-col gap-5 max-w-xl">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-charbon">Nom de l'école</label>
          <input value={nomEcole} onChange={(e) => setNomEcole(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          <p className="text-xs text-charbon-muted mt-1">Utilisé sur les bulletins, reçus et cartes scolaires.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-charbon">Échelle de notation</label>
            <input type="number" min="1" max="1000" value={echelleNotation} onChange={(e) => setEchelleNotation(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            <p className="text-xs text-charbon-muted mt-1">Base d'affichage des moyennes (ex : 20).</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-charbon">Moyenne de passage</label>
            <input type="number" min="0" max={Number(echelleNotation) || 20} step="0.5" value={moyennePassage} onChange={(e) => setMoyennePassage(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            <p className="text-xs text-charbon-muted mt-1">Seuil utilisé pour suggérer promotion/redoublement.</p>
          </div>
        </div>

        {erreur && <p className="text-xs font-medium px-3 py-2 rounded bg-terracotta-light text-terracotta">{erreur}</p>}
        {message && <p className="text-xs font-medium px-3 py-2 rounded bg-foret-light text-foret">{message}</p>}

        <button type="submit" disabled={mutation.isPending}
          className="self-start bg-terracotta hover:bg-terracotta-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
          {mutation.isPending ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>
      </form>

      <div className="bg-white rounded-lg border border-border p-6 max-w-xl">
        <h2 className="font-semibold text-sm text-ardoise font-display mb-2">Niveaux scolaires</h2>
        <p className="text-sm text-charbon-muted mb-4">Utilisés partout où un niveau est demandé (classes, matières, frais).</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {niveaux.map((n) => (
            <span key={n} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded bg-ardoise-light text-ardoise">
              {n}
              <button onClick={() => retirerNiveau(n)} className="hover:text-terracotta">✕</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={nouveauNiveau} onChange={(e) => setNouveauNiveau(e.target.value)} placeholder="ex : Maternelle"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterNiveau())}
            className="border border-border rounded-md px-3 py-2 text-sm text-charbon bg-white flex-1 max-w-xs" />
          <button onClick={ajouterNiveau} disabled={niveauxMutation.isPending}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-ardoise hover:bg-ardoise-hover text-white transition-colors disabled:opacity-50">
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-6 max-w-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm text-ardoise font-display">Matières</h2>
          <button onClick={() => setModalMatiere({ mode: 'creation' })}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white transition-colors">
            <Plus size={14} /> Ajouter
          </button>
        </div>
        {matieres.length === 0 ? (
          <p className="text-sm text-charbon-muted">Aucune matière créée.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {matieres.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-2.5 border border-border rounded-md">
                <span className="text-sm text-charbon">
                  {m.nom} {m.niveau && <span className="text-charbon-muted">— {m.niveau}</span>}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setModalMatiere({ mode: 'edition', matiere: m })} className="text-charbon-light hover:text-ardoise transition-colors text-xs font-medium">
                    Modifier
                  </button>
                  <button
                    onClick={() => window.confirm(`Supprimer "${m.nom}" ?`) && suppressionMatiereMutation.mutate(m.id)}
                    className="text-charbon-light hover:text-terracotta transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-border p-6 max-w-xl">
        <h2 className="font-semibold text-sm text-ardoise font-display mb-2">Types d'évaluation</h2>
        <p className="text-sm text-charbon-muted mb-4">
          Les enseignants peuvent en créer directement depuis l'écran de saisie de notes. Cette liste permet de faire le ménage si besoin.
        </p>
        {typesEvaluation.length === 0 ? (
          <p className="text-sm text-charbon-muted">Aucun type d'évaluation créé.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {typesEvaluation.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-2.5 border border-border rounded-md">
                <span className="text-sm text-charbon">
                  {t.nom} <span className="text-charbon-muted">— sur {t.note_maximale}, pondération {t.ponderation}</span>
                </span>
                <button
                  onClick={() => window.confirm(`Supprimer "${t.nom}" ? Les notes déjà saisies avec ce type seront aussi supprimées.`) && suppressionTypeMutation.mutate(t.id)}
                  className="text-charbon-light hover:text-terracotta transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalMatiere && (
        <ModalMatiere
          matiere={modalMatiere.mode === 'edition' ? modalMatiere.matiere : null}
          onClose={() => setModalMatiere(null)}
        />
      )}
    </div>
  );
}