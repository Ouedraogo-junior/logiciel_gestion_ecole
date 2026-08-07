import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useEleves } from '../../hooks/useEleves';
import type { Eleve } from '../../types';

interface Props {
  value: Eleve | null;
  onChange: (eleve: Eleve | null) => void;
  classeId?: number;
}

export default function SelecteurEleve({ value, onChange, classeId }: Props) {
  const [recherche, setRecherche] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);

  const { eleves, loading } = useEleves({ recherche: recherche || undefined, classe_id: classeId });

  useEffect(() => {
    function fermerSiExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    document.addEventListener('mousedown', fermerSiExterieur);
    return () => document.removeEventListener('mousedown', fermerSiExterieur);
  }, []);

  function choisir(eleve: Eleve) {
    onChange(eleve);
    setRecherche('');
    setOuvert(false);
  }

  function effacer() {
    onChange(null);
    setRecherche('');
  }

  return (
    <div ref={conteneurRef} className="relative">
      {value ? (
        <div className="flex items-center justify-between border border-border rounded-md px-3 py-2.5 text-sm bg-white">
          <span className="text-charbon font-medium">
            {value.prenom} {value.nom} — {value.matricule}
          </span>
          <button type="button" onClick={effacer} className="text-charbon-light hover:text-terracotta">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charbon-light" />
          <input
            value={recherche}
            onChange={(e) => { setRecherche(e.target.value); setOuvert(true); }}
            onFocus={() => setOuvert(true)}
            placeholder="Rechercher un élève par nom ou matricule..."
            className="w-full border border-border rounded-md pl-9 pr-3 py-2.5 text-sm text-charbon bg-white"
          />
        </div>
      )}

      {ouvert && !value && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <p className="px-3 py-3 text-xs text-charbon-muted">Recherche...</p>
          ) : eleves.length === 0 ? (
            <p className="px-3 py-3 text-xs text-charbon-muted">Aucun élève trouvé.</p>
          ) : (
            eleves.map((eleve) => (
              <button
                key={eleve.id}
                type="button"
                onClick={() => choisir(eleve)}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-ardoise-light transition-colors flex items-center justify-between gap-3"
              >
                <span className="text-charbon">{eleve.prenom} {eleve.nom}</span>
                <span className="text-xs text-charbon-muted whitespace-nowrap">
                  {eleve.matricule} — {eleve.inscription_actuelle?.classe?.nom ?? '—'}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}