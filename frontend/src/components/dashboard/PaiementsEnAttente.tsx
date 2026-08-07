import { useNavigate } from 'react-router-dom';
import EmptyState from '../ui/EmptyState';
import type { EleveEnRetard } from '../../types';

export default function PaiementsEnAttente({ retards }: { retards: EleveEnRetard[] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg border border-border">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-sm text-ardoise font-display">Paiements en attente</h2>
        <button onClick={() => navigate('/paiements')} className="text-xs text-charbon-muted hover:underline">
          Gérer les paiements
        </button>
      </div>
      <div className="divide-y divide-[#f3ede7]">
        {retards.length === 0 ? (
          <EmptyState message="Tous les paiements sont à jour" tone="positive" />
        ) : (
          retards.slice(0, 6).map(({ eleve, echeance }) => (
            <div
              key={`${eleve.id}-${echeance.nom}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/eleves/${eleve.id}`)}
            >
              <p className="text-sm font-medium text-charbon">{eleve.prenom} {eleve.nom}</p>
              <div className="text-right">
                <p className="text-sm font-semibold text-terracotta">
                  {echeance.montant.toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-xs text-charbon-muted">{echeance.nom}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}