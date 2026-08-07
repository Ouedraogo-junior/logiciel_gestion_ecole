import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Copy, ArrowUpCircle } from 'lucide-react';
import { useAnneeActive } from '../hooks/useAnneeActive';
import { useAnneesScolaires } from '../hooks/useAnneesScolaires';
import { useClasses } from '../hooks/useClasses';
import ModalDupliquerClasses from '../components/classes/ModalDupliquerClasses';

export default function Classes() {
  const navigate = useNavigate();
  const { anneeActive } = useAnneeActive();
  const { anneesScolaires } = useAnneesScolaires();
  const [anneeChoisie, setAnneeChoisie] = useState<number | undefined>(undefined);
  const [afficherDuplication, setAfficherDuplication] = useState(false);

  const anneeId = anneeChoisie ?? anneeActive?.id;
  const { classes, loading } = useClasses(anneeId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ardoise font-display">Classes</h1>
          <p className="text-sm mt-0.5 text-charbon-muted">{classes.length} classe(s)</p>
        </div>
        <div className="flex gap-2">
        <button
            onClick={() => navigate('/classes/passage')}
            className="flex items-center gap-2 border border-ardoise text-ardoise hover:bg-ardoise-light text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
            <ArrowUpCircle size={16} /> Passage en classe supérieure
        </button>
        <button
            onClick={() => setAfficherDuplication(true)}
            className="flex items-center gap-2 border border-ardoise text-ardoise hover:bg-ardoise-light text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
            <Copy size={16} /> Dupliquer depuis une autre année
        </button>
        <button
            onClick={() => navigate('/classes/nouveau')}
            className="flex items-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
            <Plus size={16} /> Ajouter une classe
        </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Année scolaire</label>
        <select
          value={anneeId ?? ''}
          onChange={(e) => setAnneeChoisie(Number(e.target.value))}
          className="border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white max-w-xs"
        >
          {anneesScolaires.map((a) => (
            <option key={a.id} value={a.id}>{a.libelle}{a.is_active ? ' (active)' : ''}</option>
          ))}
        </select>
      </div>

      {afficherDuplication && <ModalDupliquerClasses onClose={() => setAfficherDuplication(false)} />}

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-[#fdfcfa]">
              {['Classe', 'Niveau', 'Titulaire', 'Effectif max', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-charbon-muted whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-charbon-muted">Chargement...</td></tr>
            ) : classes.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-charbon-muted">Aucune classe pour cette année scolaire.</td></tr>
            ) : (
              classes.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/classes/${c.id}`)}
                  className={`border-b border-[#f3ede7] hover:bg-gray-50 cursor-pointer ${i % 2 === 1 ? 'bg-[#fdfcfa]' : 'bg-white'}`}
                >
                  <td className="px-4 py-3 font-medium text-charbon">{c.nom}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-ardoise-light text-ardoise">{c.niveau}</span>
                  </td>
                  <td className="px-4 py-3 text-charbon">
                    {c.enseignant_titulaire ? `${c.enseignant_titulaire.prenom} ${c.enseignant_titulaire.nom}` : (
                      <span className="text-charbon-light">Non désigné</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-charbon-muted">{c.effectif_max ?? '—'}</td>
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