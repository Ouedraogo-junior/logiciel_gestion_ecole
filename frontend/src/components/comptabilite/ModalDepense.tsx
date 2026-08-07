import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { getErrorMessage } from '../../api/errors';
import { useAnneeActive } from '../../hooks/useAnneeActive';
import { useCategoriesDepenses } from '../../hooks/useCategoriesDepenses';
import { nettoyerSaisieNombre, nombreDepuisTexte } from '../../utils/nombre';

export default function ModalDepense({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { anneeActive } = useAnneeActive();
  const { categories } = useCategoriesDepenses(anneeActive?.id);

  const [categorieId, setCategorieId] = useState('');
  const [montant, setMontant] = useState('');
  const [dateDepense, setDateDepense] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  const [afficherNouvelleCategorie, setAfficherNouvelleCategorie] = useState(false);
  const [nouvelleCategorieNom, setNouvelleCategorieNom] = useState('');
  const [erreurCategorie, setErreurCategorie] = useState<string | null>(null);

  const creationCategorieMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.post('/categories-depenses', {
        annee_scolaire_id: anneeActive?.id,
        nom: nouvelleCategorieNom,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories-depenses'] });
      setCategorieId(String(data.data.id));
      setAfficherNouvelleCategorie(false);
      setNouvelleCategorieNom('');
      setErreurCategorie(null);
    },
    onError: (err) => setErreurCategorie(getErrorMessage(err)),
  });

  function handleCreerCategorie(e: FormEvent) {
    e.preventDefault();
    setErreurCategorie(null);
    if (!nouvelleCategorieNom.trim()) { setErreurCategorie('Donne un nom à la catégorie.'); return; }
    creationCategorieMutation.mutate();
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.post('/depenses', {
        categorie_depense_id: Number(categorieId),
        montant: nombreDepuisTexte(montant),
        date_depense: dateDepense,
        description,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'depenses' || q.queryKey[0] === 'rapport-financier' });
      onClose();
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!categorieId) { setErreur('Sélectionne une catégorie.'); return; }
    const montantNombre = nombreDepuisTexte(montant);
    if (!montant || isNaN(montantNombre) || montantNombre <= 0) { setErreur('Montant invalide.'); return; }
    if (!description.trim()) { setErreur('Ajoute une description.'); return; }
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-charbon/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-ardoise font-display">Nouvelle dépense</h2>
          <button type="button" onClick={onClose} className="text-sm px-2 py-1 rounded hover:bg-gray-100 text-charbon-muted">✕</button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon">Catégorie *</label>
            <select value={categorieId} onChange={(e) => setCategorieId(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white">
              <option value="">— Sélectionner —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <button type="button" onClick={() => setAfficherNouvelleCategorie((v) => !v)} className="text-xs text-ardoise hover:underline mt-1.5">
              {afficherNouvelleCategorie ? 'Annuler' : '+ Nouvelle catégorie'}
            </button>
          </div>

          {afficherNouvelleCategorie && (
            <div className="flex items-end gap-2 -mt-2">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Nom de la catégorie</label>
                <input value={nouvelleCategorieNom} onChange={(e) => setNouvelleCategorieNom(e.target.value)} placeholder="ex : Fournitures"
                  className="w-full border border-border rounded-md px-3 py-2 text-sm text-charbon bg-white" />
              </div>
              <button type="button" onClick={handleCreerCategorie} disabled={creationCategorieMutation.isPending}
                className="bg-ardoise hover:bg-ardoise-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                Créer
              </button>
            </div>
          )}
          {erreurCategorie && <p className="text-xs font-medium px-3 py-2 rounded bg-terracotta-light text-terracotta">{erreurCategorie}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon">Montant (FCFA) *</label>
              <input
                type="text" inputMode="decimal"
                value={montant}
                onChange={(e) => setMontant(nettoyerSaisieNombre(e.target.value))}
                placeholder="5000"
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon">Date</label>
              <input type="date" value={dateDepense} onChange={(e) => setDateDepense(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon">Description *</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ex : Craies et cahiers"
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>

          {erreur && <p className="text-xs font-medium px-3 py-2 rounded bg-terracotta-light text-terracotta">{erreur}</p>}

          <button type="submit" disabled={mutation.isPending}
            className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-colors bg-terracotta hover:bg-terracotta-hover disabled:opacity-50">
            {mutation.isPending ? 'Enregistrement...' : 'Enregistrer la dépense'}
          </button>
        </div>
      </form>
    </div>
  );
}