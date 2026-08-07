import { useNavigate } from 'react-router-dom';
import { BookOpen, UserCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useAffectations } from '../hooks/useAffectations';
import ListSkeleton from '../components/ui/ListSkeleton';

export default function MesClasses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { affectations, loading } = useAffectations(user?.id);

  if (loading) return <ListSkeleton rows={3} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ardoise font-display">Mes classes</h1>
        <p className="text-sm mt-0.5 text-charbon-muted">
          Bonjour {user?.prenom} — voici tes classes et matières affectées
        </p>
      </div>

      {affectations.length === 0 ? (
        <div className="bg-white rounded-lg border border-border px-5 py-8 text-center text-sm text-charbon-muted">
          Aucune classe ne t'est affectée pour le moment. Contacte la direction si ça te semble anormal.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {affectations.map((a) => (
            <div key={a.id} className="bg-white rounded-lg border border-border p-5 flex flex-col gap-4">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-ardoise-light text-ardoise">
                  {a.classe.nom}
                </span>
                <h2 className="text-base font-semibold text-charbon font-display mt-2">{a.matiere.nom}</h2>
              </div>
              <div className="flex flex-col gap-2 mt-auto">
                <button
                  onClick={() => navigate('/notes')}
                  className="flex items-center gap-2 text-sm text-ardoise border border-ardoise/30 rounded-md px-3 py-2 hover:bg-ardoise-light transition-colors"
                >
                  <BookOpen size={16} /> Saisir des notes
                </button>
                <button
                  onClick={() => navigate('/presences')}
                  className="flex items-center gap-2 text-sm text-ardoise border border-ardoise/30 rounded-md px-3 py-2 hover:bg-ardoise-light transition-colors"
                >
                  <UserCheck size={16} /> Faire l'appel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}