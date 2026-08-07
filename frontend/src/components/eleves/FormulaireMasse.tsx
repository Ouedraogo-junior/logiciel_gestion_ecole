import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import client from '../../api/client';
import { getErrorMessage } from '../../api/errors';
import { useAnneeActive } from '../../hooks/useAnneeActive';
import { useClasses } from '../../hooks/useClasses';

interface Ligne {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: 'M' | 'F';
  contact_nom: string;
  contact_telephone: string;
  contact_lien_parente: string;
}

let prochainId = 1;
function ligneVide(): Ligne {
  return {
    id: prochainId++, nom: '', prenom: '', date_naissance: '', sexe: 'M',
    contact_nom: '', contact_telephone: '', contact_lien_parente: '',
  };
}

interface ResultatMasse {
  data: unknown[];
  erreurs: { ligne: number; erreur: string }[];
  message: string;
}

export default function FormulaireMasse() {
  const queryClient = useQueryClient();
  const { anneeActive } = useAnneeActive();
  const { classes } = useClasses(anneeActive?.id);

  const [classeId, setClasseId] = useState('');
  const [lignes, setLignes] = useState<Ligne[]>([ligneVide(), ligneVide(), ligneVide()]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultat, setResultat] = useState<ResultatMasse | null>(null);

  function majLigne(id: number, champ: keyof Ligne, valeur: string) {
    setLignes((prev) => prev.map((l) => (l.id === id ? { ...l, [champ]: valeur } : l)));
  }

  function ajouterLigne() {
    setLignes((prev) => [...prev, ligneVide()]);
  }

  function supprimerLigne(id: number) {
    setLignes((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const lignesRemplies = lignes.filter((l) => l.nom.trim() && l.prenom.trim());
      const { data } = await client.post('/eleves/masse', {
        classe_id: Number(classeId),
        eleves: lignesRemplies.map((l) => ({
          nom: l.nom, prenom: l.prenom, date_naissance: l.date_naissance, sexe: l.sexe,
          contact_nom: l.contact_nom || null,
          contact_telephone: l.contact_telephone || null,
          contact_lien_parente: l.contact_lien_parente || null,
        })),
      });
      return data as ResultatMasse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['eleves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setResultat(data);
      if (data.erreurs.length === 0) {
        setLignes([ligneVide(), ligneVide(), ligneVide()]);
      }
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleSubmit() {
    setErreur(null);
    setResultat(null);
    if (!classeId) {
      setErreur("Sélectionne une classe avant d'enregistrer.");
      return;
    }
    if (!lignes.some((l) => l.nom.trim() && l.prenom.trim())) {
      setErreur("Remplis au moins une ligne (nom et prénom) avant d'enregistrer.");
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-lg border border-border p-6">
        <label className="block text-sm font-medium mb-1.5 text-charbon">
          Classe <span className="text-charbon-muted font-normal">(commune à toutes les lignes ci-dessous)</span>
        </label>
        <select
          value={classeId}
          onChange={(e) => setClasseId(e.target.value)}
          className="w-full max-w-xs border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white"
        >
          <option value="">Sélectionner une classe</option>
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
                {['Nom', 'Prénom', 'Naissance', 'Sexe', 'Contact parent/tuteur', 'Téléphone', 'Lien', ''].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-charbon-muted whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne) => (
                <tr key={ligne.id} className="border-b border-[#f3ede7]">
                  <td className="p-2">
                    <input value={ligne.nom} onChange={(e) => majLigne(ligne.id, 'nom', e.target.value)}
                      className="w-full border border-border rounded px-2 py-1.5 text-sm text-charbon bg-white" />
                  </td>
                  <td className="p-2">
                    <input value={ligne.prenom} onChange={(e) => majLigne(ligne.id, 'prenom', e.target.value)}
                      className="w-full border border-border rounded px-2 py-1.5 text-sm text-charbon bg-white" />
                  </td>
                  <td className="p-2">
                    <input type="date" value={ligne.date_naissance} onChange={(e) => majLigne(ligne.id, 'date_naissance', e.target.value)}
                      className="w-full border border-border rounded px-2 py-1.5 text-sm text-charbon bg-white" />
                  </td>
                  <td className="p-2">
                    <select value={ligne.sexe} onChange={(e) => majLigne(ligne.id, 'sexe', e.target.value)}
                      className="w-full border border-border rounded px-2 py-1.5 text-sm text-charbon bg-white">
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input value={ligne.contact_nom} onChange={(e) => majLigne(ligne.id, 'contact_nom', e.target.value)}
                      className="w-full border border-border rounded px-2 py-1.5 text-sm text-charbon bg-white" />
                  </td>
                  <td className="p-2">
                    <input value={ligne.contact_telephone} onChange={(e) => majLigne(ligne.id, 'contact_telephone', e.target.value)}
                      className="w-full border border-border rounded px-2 py-1.5 text-sm text-charbon bg-white" />
                  </td>
                  <td className="p-2">
                    <input value={ligne.contact_lien_parente} onChange={(e) => majLigne(ligne.id, 'contact_lien_parente', e.target.value)} placeholder="Père..."
                      className="w-full border border-border rounded px-2 py-1.5 text-sm text-charbon bg-white" />
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => supprimerLigne(ligne.id)} disabled={lignes.length === 1}
                      className="text-charbon-light hover:text-terracotta disabled:opacity-30 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={ajouterLigne}
          className="flex items-center gap-1.5 text-sm text-ardoise font-medium px-4 py-3 hover:bg-gray-50 w-full transition-colors"
        >
          <Plus size={16} /> Ajouter une ligne
        </button>
      </div>

      {erreur && (
        <div className="text-sm text-terracotta bg-terracotta-light border border-terracotta/20 rounded-md px-3 py-2">
          {erreur}
        </div>
      )}

      {resultat && (
        <div className={`text-sm rounded-md px-3 py-2 border ${
          resultat.erreurs.length === 0 ? 'text-foret bg-foret-light border-foret/20' : 'text-terracotta bg-terracotta-light border-terracotta/20'
        }`}>
          <p className="font-medium">{resultat.message}</p>
          {resultat.erreurs.length > 0 && (
            <ul className="mt-1.5 list-disc list-inside">
              {resultat.erreurs.map((e) => (
                <li key={e.ligne}>Ligne {e.ligne} : {e.erreur}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={mutation.isPending}
        className="self-start bg-terracotta hover:bg-terracotta-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {mutation.isPending ? 'Enregistrement...' : `Enregistrer les élèves (${lignes.filter((l) => l.nom.trim() && l.prenom.trim()).length})`}
      </button>
    </div>
  );
}