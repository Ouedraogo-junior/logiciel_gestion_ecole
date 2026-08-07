import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useEnseignants } from '../hooks/useEnseignants';

export default function Enseignants() {
  const navigate = useNavigate();
  const { enseignants, loading } = useEnseignants();
  const [recherche, setRecherche] = useState('');

  const filtres = useMemo(() => {
    const q = recherche.toLowerCase();
    return enseignants.filter(
      (e) => e.nom.toLowerCase().includes(q) || e.prenom.toLowerCase().includes(q) || e.pseudo.toLowerCase().includes(q)
    );
  }, [enseignants, recherche]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ardoise font-display">Enseignants</h1>
          <p className="text-sm mt-0.5 text-charbon-muted">{enseignants.length} enseignant(s)</p>
        </div>
        <button
          onClick={() => navigate('/enseignants/nouveau')}
          className="flex items-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} /> Ajouter un enseignant
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charbon-light" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par nom, pseudo..."
          className="w-full border border-border rounded-md pl-9 pr-3 py-2.5 text-sm text-charbon bg-white"
        />
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-[#fdfcfa]">
              {['Enseignant', 'Pseudo', 'Téléphone', 'Affectations', 'Statut', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-charbon-muted whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-charbon-muted">Chargement...</td></tr>
            ) : filtres.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-charbon-muted">Aucun enseignant trouvé.</td></tr>
            ) : (
              filtres.map((ens, i) => (
                <tr
                  key={ens.id}
                  onClick={() => navigate(`/enseignants/${ens.id}`)}
                  className={`border-b border-[#f3ede7] hover:bg-gray-50 cursor-pointer ${i % 2 === 1 ? 'bg-[#fdfcfa]' : 'bg-white'}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-ardoise-light text-ardoise flex items-center justify-center text-xs font-bold shrink-0">
                        {ens.prenom[0]}{ens.nom[0]}
                      </div>
                      <span className="font-medium text-charbon">{ens.prenom} {ens.nom}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-charbon-muted font-mono text-xs">{ens.pseudo}</td>
                  <td className="px-4 py-3 text-charbon-muted text-xs">{ens.telephone_contact ?? '—'}</td>
                  <td className="px-4 py-3">
                    {ens.affectations.length === 0 ? (
                      <span className="text-xs text-charbon-light">Aucune</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {ens.affectations.slice(0, 2).map((a) => (
                          <span key={a.id} className="text-xs font-medium px-2 py-0.5 rounded bg-ardoise-light text-ardoise">
                            {a.classe.nom} · {a.matiere.nom}
                          </span>
                        ))}
                        {ens.affectations.length > 2 && (
                          <span className="text-xs text-charbon-muted">+{ens.affectations.length - 2}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      ens.actif ? 'bg-foret-light text-foret' : 'bg-[#f3ede7] text-charbon-muted'
                    }`}>
                      {ens.actif ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-charbon-light">→</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}