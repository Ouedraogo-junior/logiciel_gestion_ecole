import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import client from '../../api/client';
import Skeleton from '../ui/Skeleton';
import { getAppreciation } from '../../utils/appreciation';
import { genererEtOuvrirPdf } from '../../utils/pdf';
import { useAuth } from '../../auth/AuthContext';

interface Props {
  eleveId: number;
  anneeScolaireId: number;
}

interface MoyenneMatiere {
  matiere_id: number;
  moyenne: number | null;
}

interface NoteDetail {
  id: number;
  matiere_id: number;
  type_evaluation_id: number;
  valeur: number;
  saisi_le: string;
}

export default function OngletNotes({ eleveId, anneeScolaireId }: Props) {
  const { user } = useAuth();

  const { data: periodes = [] } = useQuery({
    queryKey: ['periodes', anneeScolaireId],
    queryFn: async () => {
      const { data } = await client.get('/periodes', { params: { annee_scolaire_id: anneeScolaireId } });
      return data.data;
    },
  });

  const { data: matieres = [] } = useQuery({
    queryKey: ['matieres'],
    queryFn: async () => (await client.get('/matieres')).data.data,
    staleTime: 30 * 60 * 1000,
  });

  const { data: typesEvaluation = [] } = useQuery({
    queryKey: ['types-evaluation'],
    queryFn: async () => (await client.get('/types-evaluation')).data.data,
    staleTime: 30 * 60 * 1000,
  });

  const [periodeIdChoisie, setPeriodeIdChoisie] = useState<number | null>(null);
  const periodeActive = periodeIdChoisie ?? periodes[0]?.id ?? null;

  const { data: moyennes, isLoading: loadingMoyennes } = useQuery({
    queryKey: ['moyennes', eleveId, periodeActive],
    queryFn: async () => {
      const { data } = await client.get(`/eleves/${eleveId}/moyennes`, { params: { periode_id: periodeActive } });
      return data.data as { par_matiere: MoyenneMatiere[]; moyenne_generale: number | null; echelle: number };
    },
    enabled: !!periodeActive,
  });

  const { data: notesDetail = [], isLoading: loadingNotes } = useQuery({
    queryKey: ['notes-detail', eleveId, periodeActive],
    queryFn: async () => {
      const { data } = await client.get('/notes', { params: { eleve_id: eleveId, periode_id: periodeActive } });
      return data.data as NoteDetail[];
    },
    enabled: !!periodeActive,
  });

  const [genererBulletinEnCours, setGenererBulletinEnCours] = useState(false);
  const [erreurBulletin, setErreurBulletin] = useState<string | null>(null);

  async function handleGenererBulletin() {
    if (!periodeActive) return;
    setErreurBulletin(null);
    setGenererBulletinEnCours(true);
    try {
      await genererEtOuvrirPdf(`/eleves/${eleveId}/bulletin?periode_id=${periodeActive}`);
    } catch (err) {
      setErreurBulletin(err instanceof Error ? err.message : 'Erreur lors de la génération.');
    } finally {
      setGenererBulletinEnCours(false);
    }
  }

  function nomMatiere(id: number) {
    return matieres.find((m: { id: number; nom: string }) => m.id === id)?.nom ?? `Matière ${id}`;
  }
  function typeEvaluation(id: number) {
    return typesEvaluation.find((t: { id: number; nom: string; note_maximale: number }) => t.id === id);
  }

  if (loadingMoyennes || loadingNotes || !periodeActive) {
    return (
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-[#f3ede7]">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm text-ardoise font-display">Moyennes par matière</h2>
          <div className="flex items-center gap-2">
            <select
              value={periodeActive}
              onChange={(e) => setPeriodeIdChoisie(Number(e.target.value))}
              className="border border-border rounded-md px-3 py-1.5 text-sm text-charbon bg-white"
            >
              {periodes.map((p: { id: number; nom: string }) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
            {user?.role === 'direction' && (
              <button
                onClick={handleGenererBulletin}
                disabled={genererBulletinEnCours}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-ardoise text-ardoise hover:bg-ardoise-light transition-colors disabled:opacity-50"
              >
                <FileText size={14} />
                {genererBulletinEnCours ? '...' : 'Bulletin'}
              </button>
            )}
          </div>
        </div>
        {erreurBulletin && <p className="text-xs text-terracotta mb-2">{erreurBulletin}</p>}

        {!moyennes || moyennes.par_matiere.length === 0 ? (
          <p className="text-sm text-charbon-muted">Aucune note saisie pour cette période.</p>
        ) : (
          <>
            <table className="w-full text-sm mb-4">
              <tbody>
                {moyennes.par_matiere.map((m) => (
                  <tr key={m.matiere_id} className="border-b border-[#f3ede7]">
                    <td className="py-2 text-charbon">{nomMatiere(m.matiere_id)}</td>
                    <td className="py-2 text-right font-medium text-charbon">{m.moyenne?.toFixed(2) ?? '—'} / {moyennes?.echelle ?? 20}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm font-semibold text-charbon">Moyenne générale</span>
              <span className="text-lg font-bold text-ardoise font-display">
                {moyennes.moyenne_generale?.toFixed(2) ?? '—'} / {moyennes.echelle}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-lg border border-border">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm text-ardoise font-display">Détail des notes</h2>
        </div>
        {notesDetail.length === 0 ? (
          <p className="px-5 py-4 text-sm text-charbon-muted">Aucune note individuelle pour cette période.</p>
        ) : (
          <div className="divide-y divide-[#f3ede7]">
            {notesDetail.map((n) => {
              const type = typeEvaluation(n.type_evaluation_id);
              const appr = getAppreciation(n.valeur, type?.note_maximale ?? 20);
              return (
                <div key={n.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-charbon">{nomMatiere(n.matiere_id)}</p>
                    <p className="text-xs text-charbon-muted mt-0.5">
                      {type?.nom ?? '—'} — {new Date(n.saisi_le).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${appr.bgClass} ${appr.textClass}`}>
                      {appr.label}
                    </span>
                    <span className="text-sm font-bold text-charbon font-display w-16 text-right">
                      {n.valeur} / {type?.note_maximale ?? 20}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}