import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { getErrorMessage } from '../api/errors';
import { useExamensNationaux } from '../hooks/useExamensNationaux';
import ModalExamenNational from '../components/examens/ModalExamenNational';
import type { CandidatCM2 } from '../hooks/useExamensNationaux';

const labelsResultat: Record<string, { label: string; bg: string; text: string }> = {
  en_attente: { label: 'En attente', bg: 'bg-[#f3ede7]', text: 'text-charbon-muted' },
  admis: { label: 'Admis', bg: 'bg-foret-light', text: 'text-foret' },
  ajourne: { label: 'Ajourné', bg: 'bg-terracotta-light', text: 'text-terracotta' },
};

export default function CandidatsCM2() {
  const queryClient = useQueryClient();
  const { candidats, loading } = useExamensNationaux();
  const [modal, setModal] = useState<CandidatCM2 | null>(null);

  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [erreurInscription, setErreurInscription] = useState<string | null>(null);
  const [messageMasse, setMessageMasse] = useState<{ texte: string; erreurs: { eleve_id: number; erreur: string }[] } | null>(null);

  const nonInscrits = useMemo(() => candidats.filter((c) => !c.examen), [candidats]);

  function basculerSelection(eleveId: number) {
    setSelection((prev) => {
      const copie = new Set(prev);
      if (copie.has(eleveId)) copie.delete(eleveId); else copie.add(eleveId);
      return copie;
    });
  }

  function toutSelectionner() {
    if (selection.size === nonInscrits.length) {
      setSelection(new Set());
    } else {
      setSelection(new Set(nonInscrits.map((c) => c.eleve.id)));
    }
  }

  const inscrireMutation = useMutation({
    mutationFn: async (eleveId: number) => {
      const { data } = await client.post('/examens-nationaux', { eleve_id: eleveId });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['examens-nationaux'] }),
    onError: (err) => setErreurInscription(getErrorMessage(err)),
  });

  const [enCoursId, setEnCoursId] = useState<number | null>(null);
  function handleInscrire(eleveId: number) {
    setErreurInscription(null);
    setEnCoursId(eleveId);
    inscrireMutation.mutate(eleveId, { onSettled: () => setEnCoursId(null) });
  }

  const inscriptionMasseMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.post('/examens-nationaux/inscription-masse', {
        eleve_ids: Array.from(selection),
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['examens-nationaux'] });
      setMessageMasse({ texte: data.message, erreurs: data.erreurs });
      setSelection(new Set());
    },
    onError: (err) => setErreurInscription(getErrorMessage(err)),
  });

  function handleInscrireSelection() {
    setErreurInscription(null);
    setMessageMasse(null);
    if (selection.size === 0) return;
    inscriptionMasseMutation.mutate();
  }

  const total = candidats.length;
  const inscrits = candidats.filter((c) => c.examen?.statut_inscription === 'inscrit').length;
  const enAttente = candidats.filter((c) => c.examen && c.examen.resultat === 'en_attente').length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ardoise font-display">Candidats CM2 — Examen national</h1>
        <p className="text-sm mt-0.5 text-charbon-muted">
          Suivi administratif de l'examen (ex : CEP) — l'école ne gère ni les sujets ni la correction, uniquement le suivi.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-border p-5">
          <p className="text-xs font-medium mb-1 text-charbon-muted">Élèves de CM2</p>
          <p className="text-2xl font-bold text-charbon font-display">{total}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-5">
          <p className="text-xs font-medium mb-1 text-charbon-muted">Inscrits à l'examen</p>
          <p className="text-2xl font-bold text-foret font-display">{inscrits}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-5">
          <p className="text-xs font-medium mb-1 text-charbon-muted">Résultats en attente</p>
          <p className="text-2xl font-bold text-ardoise font-display">{enAttente}</p>
        </div>
      </div>

      {erreurInscription && (
        <p className="text-sm text-terracotta bg-terracotta-light border border-terracotta/20 rounded-md px-3 py-2">{erreurInscription}</p>
      )}
      {messageMasse && (
        <div className="text-sm text-foret bg-foret-light border border-foret/20 rounded-md px-3 py-2">
          <p>{messageMasse.texte}</p>
          {messageMasse.erreurs.length > 0 && (
            <ul className="mt-1.5 list-disc list-inside text-charbon-muted">
              {messageMasse.erreurs.map((e, i) => <li key={i}>Élève #{e.eleve_id} : {e.erreur}</li>)}
            </ul>
          )}
        </div>
      )}

      {nonInscrits.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-border px-4 py-3">
          <span className="text-sm text-charbon-muted">
            {selection.size} élève(s) sélectionné(s) sur {nonInscrits.length} non inscrit(s)
          </span>
          <button
            onClick={handleInscrireSelection}
            disabled={selection.size === 0 || inscriptionMasseMutation.isPending}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white transition-colors disabled:opacity-50"
          >
            {inscriptionMasseMutation.isPending ? 'Inscription...' : `Inscrire les ${selection.size || ''} élève(s) sélectionné(s)`}
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-[#fdfcfa]">
              <th className="px-4 py-3 w-10">
                {nonInscrits.length > 0 && (
                  <input
                    type="checkbox"
                    checked={selection.size === nonInscrits.length}
                    onChange={toutSelectionner}
                  />
                )}
              </th>
              {['Élève', 'Classe', 'Inscription', 'N° Candidat', 'Résultat', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-charbon-muted whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-charbon-muted">Chargement...</td></tr>
            ) : candidats.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-charbon-muted">Aucun élève de CM2 inscrit cette année.</td></tr>
            ) : (
              candidats.map((c, i) => {
                const resultatInfo = c.examen ? labelsResultat[c.examen.resultat] : null;
                return (
                  <tr key={c.eleve.id} className={`border-b border-[#f3ede7] ${i % 2 === 1 ? 'bg-[#fdfcfa]' : 'bg-white'}`}>
                    <td className="px-4 py-3">
                      {!c.examen && (
                        <input
                          type="checkbox"
                          checked={selection.has(c.eleve.id)}
                          onChange={() => basculerSelection(c.eleve.id)}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-charbon">{c.eleve.prenom} {c.eleve.nom}</td>
                    <td className="px-4 py-3 text-charbon-muted">{c.classe.nom}</td>
                    <td className="px-4 py-3">
                      {c.examen?.statut_inscription === 'inscrit' ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-foret-light text-foret">Inscrit</span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#f3ede7] text-charbon-muted">Non inscrit</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-charbon-muted">{c.examen?.numero_candidat ?? '—'}</td>
                    <td className="px-4 py-3">
                      {resultatInfo ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${resultatInfo.bg} ${resultatInfo.text}`}>{resultatInfo.label}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.examen ? (
                        <button onClick={() => setModal(c)} className="text-xs font-medium text-ardoise hover:underline">
                          Mettre à jour
                        </button>
                      ) : (
                        <button
                          onClick={() => handleInscrire(c.eleve.id)}
                          disabled={enCoursId === c.eleve.id}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-ardoise text-ardoise hover:bg-ardoise-light transition-colors disabled:opacity-50"
                        >
                          {enCoursId === c.eleve.id ? '...' : 'Inscrire seul'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modal && modal.examen && (
        <ModalExamenNational
          examen={modal.examen}
          nomEleve={`${modal.eleve.prenom} ${modal.eleve.nom}`}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}