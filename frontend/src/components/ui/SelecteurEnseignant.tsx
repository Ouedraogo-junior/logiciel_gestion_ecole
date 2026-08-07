import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useEnseignants } from '../../hooks/useEnseignants';
import { useClasses } from '../../hooks/useClasses';

interface Props {
  value: string;
  onChange: (id: string) => void;
  anneeScolaireId?: number;
  classeIdExclue?: number;
}

export default function SelecteurEnseignant({ value, onChange, anneeScolaireId, classeIdExclue }: Props) {
  const [recherche, setRecherche] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const [seulementDisponibles, setSeulementDisponibles] = useState(true);
  const conteneurRef = useRef<HTMLDivElement>(null);

  const { enseignants } = useEnseignants(true);
  const { classes } = useClasses(anneeScolaireId);

  const titulairesOccupes = useMemo(() => {
    const map = new Map<number, string>();
    classes.forEach((c) => {
      if (c.enseignant_titulaire_id && c.id !== classeIdExclue) {
        map.set(c.enseignant_titulaire_id, c.nom);
      }
    });
    return map;
  }, [classes, classeIdExclue]);

  useEffect(() => {
    function fermerSiExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    document.addEventListener('mousedown', fermerSiExterieur);
    return () => document.removeEventListener('mousedown', fermerSiExterieur);
  }, []);

  const enseignantChoisi = enseignants.find((e) => String(e.id) === value);

  const filtres = enseignants.filter((e) => {
    const q = recherche.toLowerCase();
    const correspond = e.nom.toLowerCase().includes(q) || e.prenom.toLowerCase().includes(q);
    if (!correspond) return false;
    if (seulementDisponibles && titulairesOccupes.has(e.id)) return false;
    return true;
  });

  function choisir(id: number) {
    onChange(String(id));
    setRecherche('');
    setOuvert(false);
  }

  function effacer() {
    onChange('');
    setRecherche('');
  }

  return (
    <div ref={conteneurRef} className="relative">
      {enseignantChoisi ? (
        <div className="flex items-center justify-between border border-border rounded-md px-3 py-2.5 text-sm bg-white">
          <span className="text-charbon font-medium">{enseignantChoisi.prenom} {enseignantChoisi.nom}</span>
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
            placeholder="Rechercher un enseignant..."
            className="w-full border border-border rounded-md pl-9 pr-3 py-2.5 text-sm text-charbon bg-white"
          />
        </div>
      )}

      {ouvert && !enseignantChoisi && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
          <label className="flex items-center gap-2 px-3 py-2 border-b border-border text-xs text-charbon-muted cursor-pointer">
            <input
              type="checkbox"
              checked={seulementDisponibles}
              onChange={(e) => setSeulementDisponibles(e.target.checked)}
            />
            Afficher seulement les enseignants disponibles
          </label>

          {filtres.length === 0 ? (
            <p className="px-3 py-3 text-xs text-charbon-muted">Aucun enseignant trouvé.</p>
          ) : (
            filtres.map((e) => {
              const occupePar = titulairesOccupes.get(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  disabled={!!occupePar}
                  onClick={() => choisir(e.id)}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between gap-3 ${
                    occupePar ? 'opacity-50 cursor-not-allowed' : 'hover:bg-ardoise-light'
                  }`}
                >
                  <span className="text-charbon">{e.prenom} {e.nom}</span>
                  {occupePar && <span className="text-xs text-charbon-muted whitespace-nowrap">Déjà titulaire de {occupePar}</span>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}