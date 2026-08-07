import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { getErrorMessage } from '../../api/errors';
import { useAuth } from '../../auth/AuthContext';
import { useEleves } from '../../hooks/useEleves';
import type { Presence } from '../../types';
import ListSkeleton from '../ui/ListSkeleton';

type Statut = 'present' | 'absent' | 'retard';

const styleStatut: Record<Statut, { label: string; textClass: string; bgClass: string; borderClass: string }> = {
  present: { label: 'Présent', textClass: 'text-foret', bgClass: 'bg-foret-light', borderClass: 'border-foret/40' },
  absent: { label: 'Absent', textClass: 'text-terracotta', bgClass: 'bg-terracotta-light', borderClass: 'border-terracotta/40' },
  retard: { label: 'Retard', textClass: 'text-ardoise', bgClass: 'bg-ardoise-light', borderClass: 'border-ardoise/40' },
};

interface Props {
  classeId: number;
  classeNom: string;
  date: string;
}

export default function FeuilleAppel({ classeId, classeNom, date }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const estEnseignant = user?.role === 'enseignant';

  const { eleves, loading: loadingEleves } = useEleves({ classe_id: classeId });

  const { data: presencesExistantes = [], isLoading: loadingPresences } = useQuery({
    queryKey: ['presences', classeId, date],
    queryFn: async () => {
      const { data } = await client.get('/presences', { params: { classe_id: classeId, date } });
      return data.data as Presence[];
    },
  });

  const [statuts, setStatuts] = useState<Record<number, Statut>>({});
  const [motifs, setMotifs] = useState<Record<number, string>>({});
  const [initialise, setInitialise] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [messageSucces, setMessageSucces] = useState<string | null>(null);

  useEffect(() => {
    if (initialise || loadingEleves || loadingPresences) return;
    const baseStatuts: Record<number, Statut> = {};
    const baseMotifs: Record<number, string> = {};
    eleves.forEach((e) => {
      const existante = presencesExistantes.find((p) => p.eleve_id === e.id);
      baseStatuts[e.id] = (existante?.statut as Statut) ?? 'present';
      if (existante?.motif) baseMotifs[e.id] = existante.motif;
    });
    setStatuts(baseStatuts);
    setMotifs(baseMotifs);
    setInitialise(true);
  }, [initialise, loadingEleves, loadingPresences, eleves, presencesExistantes]);

  function changerStatut(eleveId: number, statut: Statut) {
    setMessageSucces(null);
    setStatuts((prev) => ({ ...prev, [eleveId]: statut }));
  }

  function selectionRapide(statut: Statut) {
    setMessageSucces(null);
    const tous: Record<number, Statut> = {};
    eleves.forEach((e) => { tous[e.id] = statut; });
    setStatuts(tous);
    setMotifs({});
  }

  const compteurs = eleves.reduce(
    (acc, e) => {
      const s = statuts[e.id] ?? 'present';
      acc[s]++;
      return acc;
    },
    { present: 0, absent: 0, retard: 0 } as Record<Statut, number>
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const absents = eleves
        .filter((e) => (statuts[e.id] ?? 'present') !== 'present')
        .map((e) => ({
          eleve_id: e.id,
          statut: statuts[e.id],
          motif: motifs[e.id] || undefined,
        }));

      const { data } = await client.post('/presences/appel', { classe_id: classeId, date, absents });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['presences', classeId, date] });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'assiduite' || q.queryKey[0] === 'dashboard' });
      setMessageSucces(data.message);
      setErreur(null);
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  if (loadingEleves || loadingPresences) {
    return <ListSkeleton rows={5} />;
  }

  if (eleves.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-border px-5 py-8 text-center text-sm text-charbon-muted">
        Aucun élève inscrit dans cette classe.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-3">
          {(['present', 'absent', 'retard'] as Statut[]).map((s) => {
            const style = styleStatut[s];
            return (
              <div key={s} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${style.bgClass}`}>
                <span className={`text-sm font-bold font-display ${style.textClass}`}>{compteurs[s]}</span>
                <span className={`text-xs ${style.textClass}`}>{style.label}{compteurs[s] > 1 ? 's' : ''}</span>
              </div>
            );
          })}
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded ml-2 ${estEnseignant ? 'bg-foret-light text-foret' : 'bg-[#f3ede7] text-charbon-muted'}`}>
          {estEnseignant ? 'Enseignant — temps réel' : 'Direction — saisie différée'}
        </span>
        <div className="flex gap-2 ml-auto flex-wrap">
          <span className="text-xs self-center text-charbon-muted">Sélection rapide :</span>
          {(['present', 'absent', 'retard'] as Statut[]).map((s) => {
            const style = styleStatut[s];
            return (
              <button
                key={s}
                onClick={() => selectionRapide(s)}
                className={`text-xs px-3 py-1.5 rounded border ${style.borderClass} ${style.textClass} ${style.bgClass}`}
              >
                Tous {style.label.toLowerCase()}s
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm text-ardoise font-display">
            {classeNom} — {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => { setErreur(null); mutation.mutate(); }}
            disabled={mutation.isPending}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors bg-terracotta hover:bg-terracotta-hover disabled:opacity-50"
          >
            {mutation.isPending ? 'Enregistrement...' : "Valider l'appel"}
          </button>
        </div>

        {erreur && (
          <div className="mx-5 mt-4 text-sm text-terracotta bg-terracotta-light border border-terracotta/20 rounded-md px-3 py-2">
            {erreur}
          </div>
        )}
        {messageSucces && (
          <div className="mx-5 mt-4 text-sm text-foret bg-foret-light border border-foret/20 rounded-md px-3 py-2">
            {messageSucces}
          </div>
        )}

        <div className="divide-y divide-[#f3ede7]">
          {eleves.map((eleve, i) => {
            const statut = statuts[eleve.id] ?? 'present';
            return (
              <div key={eleve.id} className={`flex items-center justify-between px-5 py-3.5 ${i % 2 === 1 ? 'bg-[#fdfcfa]' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-charbon-light" style={{ minWidth: '1.5rem' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-ardoise-light text-ardoise flex items-center justify-center text-xs font-bold shrink-0">
                    {eleve.prenom[0]}{eleve.nom[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charbon">{eleve.prenom} {eleve.nom}</p>
                    {statut !== 'present' && (
                      <input
                        value={motifs[eleve.id] ?? ''}
                        onChange={(e) => setMotifs((prev) => ({ ...prev, [eleve.id]: e.target.value }))}
                        placeholder="Motif (optionnel)"
                        className="text-xs border border-border rounded px-2 py-1 mt-1 text-charbon bg-white w-48"
                      />
                    )}
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {(['present', 'absent', 'retard'] as Statut[]).map((s) => {
                    const style = styleStatut[s];
                    const actif = statut === s;
                    return (
                      <button
                        key={s}
                        onClick={() => changerStatut(eleve.id, s)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                          actif ? `${style.bgClass} ${style.textClass} ${style.borderClass}` : 'text-charbon-light border-border hover:bg-gray-50'
                        }`}
                      >
                        {style.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}