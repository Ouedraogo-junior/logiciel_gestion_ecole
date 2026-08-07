import type { Eleve } from '../../types';
import OngletPaiements from '../eleves/OngletPaiements';

interface Props {
  eleve: Eleve;
  onClose: () => void;
}

export default function ModalDetailPaiementsEleve({ eleve, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-charbon/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-ardoise font-display">Paiements — {eleve.prenom} {eleve.nom}</h2>
          <button onClick={onClose} className="text-sm px-2 py-1 rounded hover:bg-gray-100 text-charbon-muted">✕</button>
        </div>
        <div className="p-6">
          <OngletPaiements
            eleveId={eleve.id}
            eleveInfo={{
              nom: eleve.nom,
              prenom: eleve.prenom,
              matricule: eleve.matricule,
              niveau: eleve.inscription_actuelle?.classe?.niveau ?? null,
            }}
          />
        </div>
      </div>
    </div>
  );
}