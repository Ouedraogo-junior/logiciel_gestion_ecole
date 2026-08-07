import { Link } from 'react-router-dom';
import { useEleves } from '../../hooks/useEleves';
import { nomAffichage } from '../../utils/nom';
import ListSkeleton from '../ui/ListSkeleton';

export default function ListeElevesClasse({ classeId }: { classeId: number }) {
  const { eleves, total, loading } = useEleves({ classe_id: classeId, per_page: 100 });

  if (loading) return <ListSkeleton rows={5} />;

  return (
    <div className="bg-white rounded-lg border border-border">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-sm text-ardoise font-display">Élèves de la classe ({total})</h2>
      </div>
      {eleves.length === 0 ? (
        <p className="px-5 py-4 text-sm text-charbon-muted">Aucun élève inscrit dans cette classe pour le moment.</p>
      ) : (
        <div className="divide-y divide-[#f3ede7]">
          {eleves.map((eleve) => (
            <Link
              key={eleve.id}
              to={`/eleves/${eleve.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-ardoise-light text-ardoise flex items-center justify-center text-xs font-bold shrink-0">
                  {eleve.nom[0]}{eleve.prenom[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-charbon">{nomAffichage(eleve)}</p>
                  <p className="text-xs text-charbon-muted">{eleve.matricule}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                eleve.statut === 'actif' ? 'bg-foret-light text-foret' : 'bg-[#f3ede7] text-charbon-muted'
              }`}>
                {eleve.statut === 'actif' ? 'Actif' : eleve.statut === 'transfere' ? 'Transféré' : 'Inactif'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}