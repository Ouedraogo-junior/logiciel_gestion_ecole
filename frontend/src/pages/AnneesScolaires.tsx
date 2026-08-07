import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { useAnneesScolaires } from '../hooks/useAnneesScolaires';

export default function AnneesScolaires() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { anneesScolaires, loading } = useAnneesScolaires();

  const activerMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await client.patch(`/annees-scolaires/${id}`, { is_active: true });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'annees-scolaires' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  function handleActiver(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    const confirme = window.confirm(
      "Activer cette année désactivera automatiquement l'année scolaire actuellement active, sur tout le logiciel (tableau de bord, saisie de notes, présences...). Continuer ?"
    );
    if (confirme) activerMutation.mutate(id);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ardoise font-display">Années scolaires</h1>
          <p className="text-sm mt-0.5 text-charbon-muted">{anneesScolaires.length} année(s)</p>
        </div>
        <button
          onClick={() => navigate('/annees-scolaires/nouveau')}
          className="flex items-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} /> Ajouter une année scolaire
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-[#fdfcfa]">
              {['Libellé', 'Début', 'Fin', 'Statut', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-charbon-muted whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-charbon-muted">Chargement...</td></tr>
            ) : anneesScolaires.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-charbon-muted">Aucune année scolaire.</td></tr>
            ) : (
              anneesScolaires.map((a, i) => (
                <tr
                  key={a.id}
                  onClick={() => navigate(`/annees-scolaires/${a.id}`)}
                  className={`border-b border-[#f3ede7] hover:bg-gray-50 cursor-pointer ${i % 2 === 1 ? 'bg-[#fdfcfa]' : 'bg-white'}`}
                >
                  <td className="px-4 py-3 font-medium text-charbon">{a.libelle}</td>
                  <td className="px-4 py-3 text-charbon-muted">{new Date(a.date_debut).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-charbon-muted">{new Date(a.date_fin).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      a.is_active ? 'bg-foret-light text-foret' : 'bg-[#f3ede7] text-charbon-muted'
                    }`}>
                      {a.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!a.is_active && (
                      <button
                        onClick={(e) => handleActiver(e, a.id)}
                        disabled={activerMutation.isPending}
                        className="text-xs font-medium px-3 py-1.5 rounded border border-ardoise text-ardoise hover:bg-ardoise-light transition-colors disabled:opacity-50"
                      >
                        Activer
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}