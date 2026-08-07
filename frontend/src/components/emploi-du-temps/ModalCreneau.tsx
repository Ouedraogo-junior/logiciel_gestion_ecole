import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { getErrorMessage } from '../../api/errors';
import { useMatieres } from '../../hooks/useMatieres';
import { useAffectationsClasse } from '../../hooks/useAffectationsClasse';
import { JOURS_LABELS } from '../../utils/joursSemaine';
import type { CreneauEmploiDuTemps } from '../../hooks/useEmploiDuTemps';
import type { Classe } from '../../types';

interface Props {
  classe: Classe;
  jour: string;
  creneau?: CreneauEmploiDuTemps | null;
  onClose: () => void;
}

export default function ModalCreneau({ classe, jour, creneau, onClose }: Props) {
  const queryClient = useQueryClient();
  const estEdition = !!creneau;
  const { matieres } = useMatieres();
  const { affectations } = useAffectationsClasse(classe.id);

  const [matiereId, setMatiereId] = useState(creneau ? String(creneau.matiere_id) : '');
  const [heureDebut, setHeureDebut] = useState(creneau?.heure_debut?.slice(0, 5) ?? '');
  const [heureFin, setHeureFin] = useState(creneau?.heure_fin?.slice(0, 5) ?? '');
  const [erreur, setErreur] = useState<string | null>(null);

  const enseignantDerive = useMemo(() => {
    if (!matiereId) return null;
    const affectation = affectations.find((a) => String(a.matiere_id) === matiereId);
    if (affectation) return `${affectation.enseignant.prenom} ${affectation.enseignant.nom}`;
    if (classe.enseignant_titulaire) return `${classe.enseignant_titulaire.prenom} ${classe.enseignant_titulaire.nom} (titulaire)`;
    return null;
  }, [matiereId, affectations, classe.enseignant_titulaire]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { matiere_id: Number(matiereId), jour_semaine: jour, heure_debut: heureDebut, heure_fin: heureFin };
      if (estEdition) {
        const { data } = await client.patch(`/emplois-du-temps/${creneau!.id}`, payload);
        return data;
      }
      const { data } = await client.post('/emplois-du-temps', { ...payload, classe_id: classe.id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'emploi-du-temps' });
      onClose();
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!matiereId || !heureDebut || !heureFin) { setErreur('Remplis tous les champs.'); return; }
    if (heureFin <= heureDebut) { setErreur("L'heure de fin doit être après l'heure de début."); return; }
    if (!enseignantDerive) { setErreur("Aucun enseignant n'est assigné à cette matière pour cette classe."); return; }
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-charbon/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-ardoise font-display">{estEdition ? 'Modifier le créneau' : 'Nouveau créneau'} — {JOURS_LABELS[jour]}</h2>
          <button type="button" onClick={onClose} className="text-sm px-2 py-1 rounded hover:bg-gray-100 text-charbon-muted">✕</button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon">Matière</label>
            <select value={matiereId} onChange={(e) => setMatiereId(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white">
              <option value="">Sélectionner</option>
              {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>

          {matiereId && (
            <div className={`text-xs px-3 py-2 rounded-md ${enseignantDerive ? 'bg-ardoise-light text-ardoise' : 'bg-terracotta-light text-terracotta'}`}>
              {enseignantDerive
                ? `Enseignant : ${enseignantDerive}`
                : "Aucun enseignant assigné — désigne d'abord un titulaire ou une affectation pour cette matière."}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon">Heure début</label>
              <input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon">Heure fin</label>
              <input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
          </div>
          {erreur && <p className="text-xs font-medium px-3 py-2 rounded bg-terracotta-light text-terracotta">{erreur}</p>}
          <button type="submit" disabled={mutation.isPending || !enseignantDerive}
            className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-colors bg-terracotta hover:bg-terracotta-hover disabled:opacity-50">
            {mutation.isPending ? 'Enregistrement...' : estEdition ? 'Enregistrer' : 'Ajouter le créneau'}
          </button>
        </div>
      </form>
    </div>
  );
}