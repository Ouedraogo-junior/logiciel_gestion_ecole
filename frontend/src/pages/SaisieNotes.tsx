import { useState, useMemo, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { getErrorMessage } from '../api/errors';
import { useAuth } from '../auth/AuthContext';
import { useAnneeActive } from '../hooks/useAnneeActive';
import { useClasses } from '../hooks/useClasses';
import { useMatieres } from '../hooks/useMatieres';
import { usePeriodes } from '../hooks/usePeriodes';
import { useTypesEvaluation } from '../hooks/useTypesEvaluation';
import { useAffectations } from '../hooks/useAffectations';
import { useEleves } from '../hooks/useEleves';
import { getAppreciation } from '../utils/appreciation';
import { nettoyerSaisieNombre, nombreDepuisTexte } from '../utils/nombre';

interface NoteExistante {
  id: number;
  eleve_id: number;
  valeur: number;
  verrouille: boolean;
}

export default function SaisieNotes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const estEnseignant = user?.role === 'enseignant';
  const estDirection = user?.role === 'direction';

  const { anneeActive } = useAnneeActive();
  const { classes: toutesLesClasses } = useClasses(anneeActive?.id);
  const { matieres: toutesLesMatieres } = useMatieres();
  const { periodes } = usePeriodes(anneeActive?.id);
  const { typesEvaluation } = useTypesEvaluation();
  const { affectations } = useAffectations(estEnseignant ? user?.id : undefined);

  const [classeId, setClasseId] = useState('');
  const [matiereId, setMatiereId] = useState('');
  const [periodeId, setPeriodeId] = useState('');
  const [typeEvaluationId, setTypeEvaluationId] = useState('');
  const [saisies, setSaisies] = useState<Record<number, string>>({});
  const [erreur, setErreur] = useState<string | null>(null);
  const [notesBloquees, setNotesBloquees] = useState<number[]>([]);
  const [messageVerrouillage, setMessageVerrouillage] = useState<string | null>(null);

  function resetSelectionAval() {
    setSaisies({});
    setNotesBloquees([]);
    setMessageVerrouillage(null);
    setErreur(null);
  }

  const classesDisponibles = estEnseignant
    ? Array.from(new Map(affectations.map((a) => [a.classe.id, a.classe])).values())
    : toutesLesClasses;

  const matieresDisponibles = estEnseignant
    ? affectations.filter((a) => a.classe_id === Number(classeId)).map((a) => a.matiere)
    : toutesLesMatieres;

  const { eleves } = useEleves({ classe_id: classeId ? Number(classeId) : undefined });

  const filtreComplet = !!(classeId && matiereId && periodeId && typeEvaluationId);

  const { data: notesExistantes = [], isLoading: loadingNotes } = useQuery({
    queryKey: ['notes', classeId, matiereId, periodeId, typeEvaluationId],
    queryFn: async () => {
      const { data } = await client.get('/notes', {
        params: { classe_id: classeId, matiere_id: matiereId, periode_id: periodeId, type_evaluation_id: typeEvaluationId },
      });
      return data.data as NoteExistante[];
    },
    enabled: filtreComplet,
  });

  const notesParEleve = useMemo(() => {
    const map = new Map<number, NoteExistante>();
    notesExistantes.forEach((n) => map.set(n.eleve_id, n));
    return map;
  }, [notesExistantes]);

  const typeEvaluationSelectionnee = typesEvaluation.find((t) => t.id === Number(typeEvaluationId));
  const echelleSaisie = typeEvaluationSelectionnee?.note_maximale ?? 20;

  const classeSelectionnee = classesDisponibles.find((c) => c.id === Number(classeId));
  const matiereSelectionnee = matieresDisponibles.find((m) => m.id === Number(matiereId));
  const periodeSelectionnee = periodes.find((p) => p.id === Number(periodeId));

  function valeurAffichee(eleveId: number): string {
    if (eleveId in saisies) return saisies[eleveId];
    const existante = notesParEleve.get(eleveId);
    return existante ? String(existante.valeur) : '';
  }

  function handleChangeNote(eleveId: number, valeur: string) {
    setNotesBloquees([]);
    setSaisies((prev) => ({ ...prev, [eleveId]: valeur }));
  }

  const notesRemplies = eleves.filter((e) => valeurAffichee(e.id) !== '').length;

  // --- Création d'un nouveau type d'évaluation, directement depuis cet écran ---
  const [afficherCreationType, setAfficherCreationType] = useState(false);
  const [nouveauNom, setNouveauNom] = useState('');
  const [nouveauMax, setNouveauMax] = useState('20');
  const [nouveauPonderation, setNouveauPonderation] = useState('1');
  const [erreurCreationType, setErreurCreationType] = useState<string | null>(null);

  const creationTypeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.post('/types-evaluation', {
        nom: nouveauNom,
        note_maximale: nombreDepuisTexte(nouveauMax),
        ponderation: nombreDepuisTexte(nouveauPonderation) || 1,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['types-evaluation'] });
      setTypeEvaluationId(String(data.data.id));
      setAfficherCreationType(false);
      setNouveauNom('');
      setNouveauMax('20');
      setNouveauPonderation('1');
      setErreurCreationType(null);
      resetSelectionAval();
    },
    onError: (err) => setErreurCreationType(getErrorMessage(err)),
  });

  function handleCreerType(e: FormEvent) {
    e.preventDefault();
    setErreurCreationType(null);
    if (!nouveauNom.trim()) { setErreurCreationType("Donne un nom au type d'évaluation."); return; }
    const max = nombreDepuisTexte(nouveauMax);
    if (!nouveauMax || isNaN(max) || max <= 0) { setErreurCreationType('Le barème "noté sur" doit être un nombre positif.'); return; }
    creationTypeMutation.mutate();
  }

  // --- Saisie et verrouillage ---
  const enregistrementMutation = useMutation({
    mutationFn: async () => {
      const notesAEnvoyer = eleves
        .filter((e) => !notesParEleve.get(e.id)?.verrouille)
        .map((e) => ({ eleve_id: e.id, valeur: valeurAffichee(e.id) }))
        .filter((n) => n.valeur !== '')
        .map((n) => ({ eleve_id: n.eleve_id, valeur: Number(n.valeur) }));

      const { data } = await client.post('/notes/saisie-masse', {
        classe_id: Number(classeId),
        matiere_id: Number(matiereId),
        periode_id: Number(periodeId),
        type_evaluation_id: Number(typeEvaluationId),
        notes: notesAEnvoyer,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes', classeId, matiereId, periodeId, typeEvaluationId] });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'moyennes' || q.queryKey[0] === 'notes-detail' || q.queryKey[0] === 'moyennes-classe' });
      setSaisies({});
      setNotesBloquees(data.notes_bloquees ?? []);
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  const verrouillageMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.post('/notes/verrouiller', {
        classe_id: Number(classeId),
        matiere_id: Number(matiereId),
        periode_id: Number(periodeId),
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'notes' });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'moyennes' || q.queryKey[0] === 'notes-detail' || q.queryKey[0] === 'moyennes-classe' });
      setMessageVerrouillage(data.message);
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleSave() {
    setErreur(null);
    enregistrementMutation.mutate();
  }

  function handleVerrouiller() {
    const confirme = window.confirm(
      `Verrouiller les notes de ${classeSelectionnee?.nom} en ${matiereSelectionnee?.nom} pour "${periodeSelectionnee?.nom}" ?\n\n` +
      `Ceci verrouille TOUS les types d'évaluation de cette matière pour cette période (pas seulement "${typeEvaluationSelectionnee?.nom}" actuellement affiché).\n\n` +
      `Cette action ne peut pas être annulée depuis l'application.`
    );
    if (!confirme) return;
    setErreur(null);
    verrouillageMutation.mutate();
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-ardoise font-display">Saisie des notes</h1>
        <p className="text-sm mt-0.5 text-charbon-muted">Renseignez les notes par classe, matière, période et type d'évaluation</p>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        <p className="text-sm font-semibold mb-4 text-ardoise font-display">Paramètres de saisie</p>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Classe</label>
            <select
              value={classeId}
              onChange={(e) => { setClasseId(e.target.value); setMatiereId(''); resetSelectionAval(); }}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white"
            >
              <option value="">Sélectionner</option>
              {classesDisponibles.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Matière</label>
            <select
              value={matiereId}
              onChange={(e) => { setMatiereId(e.target.value); resetSelectionAval(); }}
              disabled={!classeId}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white disabled:opacity-50"
            >
              <option value="">Sélectionner</option>
              {matieresDisponibles.map((m) => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Période</label>
            <select
              value={periodeId}
              onChange={(e) => { setPeriodeId(e.target.value); resetSelectionAval(); }}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white"
            >
              <option value="">Sélectionner</option>
              {periodes.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Type d'évaluation</label>
            <select
              value={typeEvaluationId}
              onChange={(e) => { setTypeEvaluationId(e.target.value); resetSelectionAval(); }}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white"
            >
              <option value="">Sélectionner</option>
              {typesEvaluation.map((t) => (
                <option key={t.id} value={t.id}>{t.nom} (/{t.note_maximale})</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setAfficherCreationType((v) => !v)}
              className="text-xs text-ardoise hover:underline mt-1.5"
            >
              {afficherCreationType ? 'Annuler' : "+ Nouveau type d'évaluation"}
            </button>
          </div>
        </div>

        {afficherCreationType && (
          <form onSubmit={handleCreerType} className="mt-4 pt-4 border-t border-border grid grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Nom</label>
              <input value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)} placeholder="ex : Devoir 2"
                className="w-full border border-border rounded-md px-3 py-2 text-sm text-charbon bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Noté sur</label>
              <input
                type="text" inputMode="decimal"
                value={nouveauMax}
                onChange={(e) => setNouveauMax(nettoyerSaisieNombre(e.target.value))}
                className="w-full border border-border rounded-md px-3 py-2 text-sm text-charbon bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Pondération</label>
              <input
                type="text" inputMode="decimal"
                value={nouveauPonderation}
                onChange={(e) => setNouveauPonderation(nettoyerSaisieNombre(e.target.value))}
                className="w-full border border-border rounded-md px-3 py-2 text-sm text-charbon bg-white"
              />
            </div>
            <button type="submit" disabled={creationTypeMutation.isPending}
              className="bg-ardoise hover:bg-ardoise-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
              {creationTypeMutation.isPending ? 'Création...' : 'Créer'}
            </button>
            {erreurCreationType && (
              <p className="col-span-4 text-xs font-medium px-3 py-2 rounded bg-terracotta-light text-terracotta">{erreurCreationType}</p>
            )}
          </form>
        )}
      </div>

      {!filtreComplet ? (
        <div className="bg-white rounded-lg border border-border px-5 py-8 text-center text-sm text-charbon-muted">
          Sélectionne une classe, une matière, une période et un type d'évaluation pour commencer la saisie.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="font-semibold text-sm text-ardoise font-display">
                {eleves.length} élève(s) — {notesRemplies} note(s) saisie(s)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {estDirection && (
                <button
                  onClick={handleVerrouiller}
                  disabled={verrouillageMutation.isPending}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-ardoise text-ardoise hover:bg-ardoise-light transition-colors disabled:opacity-50"
                >
                  {verrouillageMutation.isPending ? 'Verrouillage...' : '🔒 Verrouiller'}
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={enregistrementMutation.isPending || eleves.length === 0}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors bg-terracotta hover:bg-terracotta-hover disabled:opacity-50"
              >
                {enregistrementMutation.isPending ? 'Enregistrement...' : 'Enregistrer les notes'}
              </button>
            </div>
          </div>

          {erreur && (
            <div className="mx-5 mt-4 text-sm text-terracotta bg-terracotta-light border border-terracotta/20 rounded-md px-3 py-2">
              {erreur}
            </div>
          )}
          {notesBloquees.length > 0 && (
            <div className="mx-5 mt-4 text-sm text-ardoise bg-ardoise-light border border-ardoise/20 rounded-md px-3 py-2">
              {notesBloquees.length} note(s) verrouillée(s) n'ont pas été modifiées.
            </div>
          )}
          {messageVerrouillage && (
            <div className="mx-5 mt-4 text-sm text-foret bg-foret-light border border-foret/20 rounded-md px-3 py-2">
              {messageVerrouillage}
            </div>
          )}

          {loadingNotes ? (
            <p className="px-5 py-8 text-center text-sm text-charbon-muted">Chargement...</p>
          ) : eleves.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-charbon-muted">Aucun élève inscrit dans cette classe.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-[#fdfcfa]">
                  {['Élève', `Note / ${echelleSaisie}`, 'Appréciation', 'Statut'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charbon-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eleves.map((eleve, i) => {
                  const val = valeurAffichee(eleve.id);
                  const num = parseFloat(val);
                  const valide = val !== '' && !isNaN(num) && num >= 0 && num <= echelleSaisie;
                  const existante = notesParEleve.get(eleve.id);
                  const verrouillee = existante?.verrouille ?? false;
                  const modifiee = val !== '' && existante && String(existante.valeur) !== val;
                  const appr = valide ? getAppreciation(num, echelleSaisie) : null;

                  return (
                    <tr key={eleve.id} className={`border-b border-[#f3ede7] ${i % 2 === 1 ? 'bg-[#fdfcfa]' : 'bg-white'}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-ardoise-light text-ardoise flex items-center justify-center text-xs font-bold shrink-0">
                            {eleve.prenom[0]}
                          </div>
                          <span className="font-medium text-charbon">{eleve.prenom} {eleve.nom}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min="0" max={echelleSaisie} step="0.25"
                            value={val}
                            placeholder="—"
                            disabled={verrouillee}
                            onChange={(e) => handleChangeNote(eleve.id, e.target.value)}
                            className={`w-20 border rounded px-2.5 py-1.5 text-sm font-semibold text-center disabled:opacity-50 disabled:bg-[#f3ede7] ${
                              val !== '' && !valide ? 'border-terracotta bg-terracotta-light' : 'border-border bg-white'
                            }`}
                          />
                          <span className="text-xs text-charbon-light">/ {echelleSaisie}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {appr && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${appr.bgClass} ${appr.textClass}`}>
                            {appr.label}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {verrouillee ? (
                          <span className="text-xs font-medium text-ardoise">🔒 Verrouillée</span>
                        ) : modifiee ? (
                          <span className="text-xs font-medium text-ardoise">● Modifiée</span>
                        ) : existante ? (
                          <span className="text-xs font-medium text-foret">✓ Déjà saisie</span>
                        ) : (
                          <span className="text-xs text-charbon-light">En attente</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}