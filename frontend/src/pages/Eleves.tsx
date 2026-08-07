import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useAnneeActive } from '../hooks/useAnneeActive';
import { useClasses } from '../hooks/useClasses';
import { useEleves } from '../hooks/useEleves';
// import client from '../api/client';
import { useSoldes } from '../hooks/useSoldes';

export default function Eleves() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { anneeActive } = useAnneeActive();
  const { classes } = useClasses(anneeActive?.id);
  const [recherche, setRecherche] = useState('');
  const [classeId, setClasseId] = useState<number | undefined>(undefined);
  const { eleves, total, loading } = useEleves({ recherche: recherche || undefined, classe_id: classeId });

  const { soldes: soldesListe } = useSoldes(classeId, user?.role === 'direction');
  const soldes = useMemo(() => {
    const map: Record<number, number> = {};
    soldesListe.forEach((s) => { map[s.eleve_id] = s.solde_restant; });
    return map;
  }, [soldesListe]);

  const estDirection = user?.role === 'direction';
  const colonnes = ['Matricule', 'Élève', 'Classe', 'Sexe', 'Né(e) le', 'Tuteur', 'Téléphone', ...(estDirection ? ['Paiement'] : []), ''];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ardoise font-display">Élèves</h1>
          <p className="text-sm mt-0.5 text-charbon-muted">{total} élève(s)</p>
        </div>
        {estDirection && (
          <button
            onClick={() => navigate('/eleves/nouveau')}
            className="flex items-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} /> Ajouter un élève
          </button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charbon-light" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par nom, matricule..."
            className="w-full border border-border rounded-md pl-9 pr-3 py-2.5 text-sm text-charbon bg-white"
          />
        </div>
        <select
          value={classeId ?? ''}
          onChange={(e) => setClasseId(e.target.value ? Number(e.target.value) : undefined)}
          className="border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white"
        >
          <option value="">Toutes les classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-[#fdfcfa]">
                {colonnes.map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-charbon-muted whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={colonnes.length} className="px-4 py-8 text-center text-charbon-muted">Chargement...</td></tr>
              ) : eleves.length === 0 ? (
                <tr><td colSpan={colonnes.length} className="px-4 py-8 text-center text-charbon-muted">Aucun élève ne correspond à votre recherche.</td></tr>
              ) : (
                eleves.map((eleve, i) => {
                  const contact = eleve.contacts?.[0];
                  const solde = soldes[eleve.id];
                  return (
                    <tr
                      key={eleve.id}
                      onClick={() => navigate(`/eleves/${eleve.id}`)}
                      className={`border-b border-[#f3ede7] hover:bg-gray-50 cursor-pointer ${i % 2 === 1 ? 'bg-[#fdfcfa]' : 'bg-white'}`}
                    >
                      <td className="px-4 py-3 text-xs text-charbon-muted font-mono">{eleve.matricule}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-ardoise-light text-ardoise flex items-center justify-center text-xs font-bold shrink-0">
                            {eleve.prenom[0]}{eleve.nom[0]}
                          </div>
                          <span className="font-medium text-charbon whitespace-nowrap">{eleve.prenom} {eleve.nom}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-ardoise-light text-ardoise">
                          {eleve.inscription_actuelle?.classe?.nom ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-charbon-muted">{eleve.sexe === 'M' ? 'Masculin' : 'Féminin'}</td>
                      <td className="px-4 py-3 text-xs text-charbon-muted whitespace-nowrap">
                        {new Date(eleve.date_naissance).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-charbon">{contact?.nom ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-charbon-muted">{contact?.telephone ?? '—'}</td>
                      {estDirection && (
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ${
                            solde === undefined ? 'bg-[#f3ede7] text-charbon-muted'
                              : solde <= 0 ? 'bg-foret-light text-foret' : 'bg-terracotta-light text-terracotta'
                          }`}>
                            {solde === undefined ? '—' : solde <= 0 ? 'À jour' : `${solde.toLocaleString('fr-FR')} FCFA`}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-right text-charbon-light">→</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}