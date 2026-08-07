import { useState } from 'react';
import { Printer } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useAnneeActive } from '../hooks/useAnneeActive';
import { useClasses } from '../hooks/useClasses';
import { useEmploiDuTemps } from '../hooks/useEmploiDuTemps';
import GrilleEmploiDuTemps from '../components/emploi-du-temps/GrilleEmploiDuTemps';
import ModalCreneau from '../components/emploi-du-temps/ModalCreneau';
import { genererEtOuvrirPdf } from '../utils/pdf';
import type { CreneauEmploiDuTemps } from '../hooks/useEmploiDuTemps';

export default function EmploiDuTemps() {
  const { user } = useAuth();
  const estDirection = user?.role === 'direction';

  const { anneeActive } = useAnneeActive();
  const { classes } = useClasses(anneeActive?.id);
  const [classeId, setClasseId] = useState('');
  const classeSelectionnee = classes.find((c) => c.id === Number(classeId));

  const { creneaux, loading } = useEmploiDuTemps(estDirection && classeId ? Number(classeId) : undefined);

  const [modal, setModal] = useState<{ jour: string; creneau?: CreneauEmploiDuTemps } | null>(null);

  const [impressionEnCours, setImpressionEnCours] = useState(false);
  const [erreurImpression, setErreurImpression] = useState<string | null>(null);

  async function handleImprimer() {
    if (!classeId) return;
    setErreurImpression(null);
    setImpressionEnCours(true);
    try {
      await genererEtOuvrirPdf(`/classes/${classeId}/emploi-du-temps/pdf`);
    } catch (err) {
      setErreurImpression(err instanceof Error ? err.message : 'Erreur lors de la génération.');
    } finally {
      setImpressionEnCours(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ardoise font-display">Emploi du temps</h1>
        <p className="text-sm mt-0.5 text-charbon-muted">
          {estDirection ? "Gère l'emploi du temps d'une classe" : 'Ton emploi du temps personnel'}
        </p>
      </div>

      {estDirection && (
        <div className="bg-white rounded-lg border border-border p-5 flex items-end justify-between flex-wrap gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Classe</label>
            <select value={classeId} onChange={(e) => setClasseId(e.target.value)}
              className="border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white max-w-xs">
              <option value="">Sélectionner une classe</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          {classeId && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleImprimer}
                disabled={impressionEnCours}
                className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg border border-ardoise text-ardoise hover:bg-ardoise-light transition-colors disabled:opacity-50"
              >
                <Printer size={16} />
                {impressionEnCours ? 'Génération...' : 'Imprimer'}
              </button>
              {erreurImpression && <p className="text-xs text-terracotta">{erreurImpression}</p>}
            </div>
          )}
        </div>
      )}

      {estDirection && !classeId ? (
        <div className="bg-white rounded-lg border border-border px-5 py-8 text-center text-sm text-charbon-muted">
          Sélectionne une classe pour voir et modifier son emploi du temps.
        </div>
      ) : loading ? (
        <p className="text-sm text-charbon-muted">Chargement...</p>
      ) : (
        <GrilleEmploiDuTemps
          creneaux={creneaux}
          modifiable={estDirection}
          afficherClasse={!estDirection}
          onAjouter={(jour) => setModal({ jour })}
          onModifier={(creneau) => setModal({ jour: creneau.jour_semaine, creneau })}
        />
      )}

      {modal && classeSelectionnee && (
        <ModalCreneau
          classe={classeSelectionnee}
          jour={modal.jour}
          creneau={modal.creneau ?? null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}