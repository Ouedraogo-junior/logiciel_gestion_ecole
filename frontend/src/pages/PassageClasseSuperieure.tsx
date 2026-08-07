import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import client from '../api/client';
import { getErrorMessage } from '../api/errors';
import { useAnneesScolaires } from '../hooks/useAnneesScolaires';
import { useClasses } from '../hooks/useClasses';
import { useEleves } from '../hooks/useEleves';
import { useMoyennesClasse } from '../hooks/useMoyennesClasse';
import { useParametresEcole } from '../hooks/useParametresEcole';
import { getAppreciation } from '../utils/appreciation';

type Action = 'promouvoir' | 'redoubler' | 'aucune';

export default function PassageClasseSuperieure() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { anneesScolaires } = useAnneesScolaires();

  const [anneeSourceId, setAnneeSourceId] = useState('');
  const [classeSourceId, setClasseSourceId] = useState('');
  const { classes: classesSource } = useClasses(anneeSourceId ? Number(anneeSourceId) : undefined);

  const [anneeCibleId, setAnneeCibleId] = useState('');
  const [classeCiblePromotionId, setClasseCiblePromotionId] = useState('');
  const [classeCibleRedoublementId, setClasseCibleRedoublementId] = useState('');
  const { classes: classesCible } = useClasses(anneeCibleId ? Number(anneeCibleId) : undefined);

  const { eleves } = useEleves({ classe_id: classeSourceId ? Number(classeSourceId) : undefined });
  const { moyennes, echelle } = useMoyennesClasse(classeSourceId ? Number(classeSourceId) : undefined);
  const { parametres } = useParametresEcole();

  const [seuilSaisi, setSeuilSaisi] = useState('');
  useEffect(() => {
    if (parametres.moyenne_passage) setSeuilSaisi(parametres.moyenne_passage);
    else setSeuilSaisi(String(echelle / 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parametres.moyenne_passage, echelle]);

  const seuilPassage = Number(seuilSaisi) || echelle / 2;

  const seuilMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.put('/parametres-ecole', { parametres: { moyenne_passage: seuilSaisi } });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parametres-ecole'] }),
  });

  const [decisions, setDecisions] = useState<Record<number, Action>>({});
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultat, setResultat] = useState<{ message: string; erreurs: { eleve_id: number; erreur: string }[] } | null>(null);

  function suggestionEleve(eleveId: number): Action {
    const moyenne = moyennes[String(eleveId)];
    if (moyenne === undefined || moyenne === null) return 'promouvoir';
    return moyenne >= seuilPassage ? 'promouvoir' : 'redoubler';
  }

  function actionEleve(id: number): Action {
    return decisions[id] ?? suggestionEleve(id);
  }

  function estSuggestion(id: number): boolean {
    return decisions[id] === undefined;
  }

  function changerAction(id: number, action: Action) {
    setResultat(null);
    setDecisions((prev) => ({ ...prev, [id]: action }));
  }

  function toutMettre(action: Action) {
    const tous: Record<number, Action> = {};
    eleves.forEach((e) => { tous[e.id] = action; });
    setDecisions(tous);
    setResultat(null);
  }

  function reinitialiserSuggestions() {
    setDecisions({});
    setResultat(null);
  }

  const compteurs = useMemo(() => {
    const c = { promouvoir: 0, redoubler: 0, aucune: 0 };
    eleves.forEach((e) => { c[actionEleve(e.id)]++; });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eleves, decisions, seuilPassage]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.post('/inscriptions/promotion-masse', {
        classe_source_id: Number(classeSourceId),
        classe_cible_promotion_id: classeCiblePromotionId ? Number(classeCiblePromotionId) : undefined,
        classe_cible_redoublement_id: classeCibleRedoublementId ? Number(classeCibleRedoublementId) : undefined,
        decisions: eleves.map((e) => ({ eleve_id: e.id, action: actionEleve(e.id) })),
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'eleves' || q.queryKey[0] === 'inscriptions' });
      setResultat({ message: data.message, erreurs: data.erreurs });
      setErreur(null);
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleSubmit() {
    setErreur(null);
    setResultat(null);
    if (!classeSourceId) { setErreur('Sélectionne une classe de départ.'); return; }
    if (compteurs.promouvoir > 0 && !classeCiblePromotionId) { setErreur('Sélectionne une classe cible pour la promotion.'); return; }
    if (compteurs.redoubler > 0 && !classeCibleRedoublementId) { setErreur('Sélectionne une classe cible pour le redoublement.'); return; }
    mutation.mutate();
  }

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => navigate('/classes')} className="flex items-center gap-1.5 text-sm text-charbon-muted hover:text-charbon w-fit">
        <ArrowLeft size={16} /> Retour aux classes
      </button>

      <div>
        <h1 className="text-xl font-semibold text-ardoise font-display">Passage en classe supérieure</h1>
        <p className="text-sm mt-0.5 text-charbon-muted">Réinscris en masse les élèves d'une classe vers l'année suivante</p>
      </div>

      <div className="bg-white rounded-lg border border-border p-5 flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-charbon mb-3">Classe de départ</p>
          <div className="grid grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Année scolaire</label>
              <select value={anneeSourceId} onChange={(e) => { setAnneeSourceId(e.target.value); setClasseSourceId(''); setDecisions({}); setResultat(null); }}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white">
                <option value="">Sélectionner</option>
                {anneesScolaires.map((a) => <option key={a.id} value={a.id}>{a.libelle}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Classe</label>
              <select value={classeSourceId} onChange={(e) => { setClasseSourceId(e.target.value); setDecisions({}); setResultat(null); }} disabled={!anneeSourceId}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white disabled:opacity-50">
                <option value="">Sélectionner</option>
                {classesSource.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm font-semibold text-charbon mb-3">Classes de destination (nouvelle année)</p>
          <div className="grid grid-cols-3 gap-4 max-w-2xl">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Année scolaire</label>
              <select value={anneeCibleId} onChange={(e) => { setAnneeCibleId(e.target.value); setClasseCiblePromotionId(''); setClasseCibleRedoublementId(''); }}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white">
                <option value="">Sélectionner</option>
                {anneesScolaires.map((a) => <option key={a.id} value={a.id}>{a.libelle}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Classe (promotion)</label>
              <select value={classeCiblePromotionId} onChange={(e) => setClasseCiblePromotionId(e.target.value)} disabled={!anneeCibleId}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white disabled:opacity-50">
                <option value="">Sélectionner</option>
                {classesCible.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Classe (redoublement)</label>
              <select value={classeCibleRedoublementId} onChange={(e) => setClasseCibleRedoublementId(e.target.value)} disabled={!anneeCibleId}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white disabled:opacity-50">
                <option value="">Sélectionner</option>
                {classesCible.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm font-semibold text-charbon mb-3">Seuil de promotion</p>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Moyenne minimale pour promouvoir</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" max={echelle} step="0.5"
                  value={seuilSaisi}
                  onChange={(e) => setSeuilSaisi(e.target.value)}
                  className="w-24 border border-border rounded-md px-3 py-2 text-sm text-charbon bg-white"
                />
                <span className="text-sm text-charbon-muted">/ {echelle}</span>
              </div>
            </div>
            <button
              onClick={() => seuilMutation.mutate()}
              disabled={seuilMutation.isPending}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-ardoise text-ardoise hover:bg-ardoise-light transition-colors disabled:opacity-50"
            >
              {seuilMutation.isPending ? 'Enregistrement...' : 'Enregistrer ce seuil'}
            </button>
            {seuilMutation.isSuccess && <span className="text-xs text-foret">Seuil enregistré.</span>}
          </div>
          <p className="text-xs text-charbon-muted mt-2">
            Les suggestions ci-dessous se recalculent automatiquement selon ce seuil, sauf pour les élèves déjà corrigés manuellement.
          </p>
        </div>
      </div>

      {!classeSourceId ? (
        <div className="bg-white rounded-lg border border-border px-5 py-8 text-center text-sm text-charbon-muted">
          Sélectionne une classe de départ pour afficher ses élèves.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3">
            <div className="flex gap-3">
              <span className="text-xs font-medium px-2.5 py-1 rounded bg-foret-light text-foret">{compteurs.promouvoir} à promouvoir</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded bg-ardoise-light text-ardoise">{compteurs.redoubler} redoublant(s)</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded bg-[#f3ede7] text-charbon-muted">{compteurs.aucune} non réinscrit(s)</span>
            </div>
            <div className="flex gap-2">
              <button onClick={reinitialiserSuggestions} className="text-xs px-3 py-1.5 rounded border border-ardoise/40 text-ardoise bg-ardoise-light">Réinitialiser aux suggestions</button>
              <button onClick={() => toutMettre('promouvoir')} className="text-xs px-3 py-1.5 rounded border border-foret/40 text-foret bg-foret-light">Tout promouvoir</button>
              <button onClick={() => toutMettre('aucune')} className="text-xs px-3 py-1.5 rounded border border-border text-charbon-muted">Tout désélectionner</button>
            </div>
          </div>

          {erreur && <div className="mx-5 mt-4 text-sm text-terracotta bg-terracotta-light border border-terracotta/20 rounded-md px-3 py-2">{erreur}</div>}
          {resultat && (
            <div className="mx-5 mt-4 text-sm text-foret bg-foret-light border border-foret/20 rounded-md px-3 py-2">
              <p>{resultat.message}</p>
              {resultat.erreurs.length > 0 && (
                <ul className="mt-1.5 list-disc list-inside">
                  {resultat.erreurs.map((e, i) => <li key={i}>Élève #{e.eleve_id} : {e.erreur}</li>)}
                </ul>
              )}
            </div>
          )}

          <div className="divide-y divide-[#f3ede7]">
            {eleves.map((eleve) => {
              const action = actionEleve(eleve.id);
              const moyenne = moyennes[String(eleve.id)];
              const suggestion = estSuggestion(eleve.id);

              return (
                <div key={eleve.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-ardoise-light text-ardoise flex items-center justify-center text-xs font-bold shrink-0">
                      {eleve.prenom[0]}{eleve.nom[0]}
                    </div>
                    <span className="text-sm font-medium text-charbon">{eleve.prenom} {eleve.nom}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {moyenne === undefined || moyenne === null ? (
                      <span className="text-xs text-charbon-light">Pas de note</span>
                    ) : (
                      (() => {
                        const appr = getAppreciation(moyenne, echelle);
                        return (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${appr.bgClass} ${appr.textClass}`}>
                            {moyenne.toFixed(2)} / {echelle}
                          </span>
                        );
                      })()
                    )}

                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex gap-1.5">
                        {([
                          { value: 'promouvoir', label: 'Promouvoir' },
                          { value: 'redoubler', label: 'Redouble' },
                          { value: 'aucune', label: 'Non réinscrit' },
                        ] as { value: Action; label: string }[]).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => changerAction(eleve.id, opt.value)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                              action === opt.value ? 'bg-ardoise-light border-ardoise text-ardoise' : 'text-charbon-light border-border hover:bg-gray-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {suggestion && moyenne !== undefined && moyenne !== null && (
                        <span className="text-xs text-charbon-light italic">Suggestion automatique</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-4 border-t border-border flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending || eleves.length === 0}
              className="bg-terracotta hover:bg-terracotta-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? 'Traitement...' : 'Valider le passage'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}