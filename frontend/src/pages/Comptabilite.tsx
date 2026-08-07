import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { useAnneeActive } from '../hooks/useAnneeActive';
import { usePeriodes } from '../hooks/usePeriodes';
import { useDepenses } from '../hooks/useDepenses';
import { useRapportFinancier } from '../hooks/useRapportFinancier';
import ModalDepense from '../components/comptabilite/ModalDepense';
import { formaterMontant } from '../utils/format';

type ModeRapport = 'annee' | 'periode';

export default function Comptabilite() {
  const queryClient = useQueryClient();
  const { anneeActive } = useAnneeActive();
  const { periodes } = usePeriodes(anneeActive?.id);

  const [modeRapport, setModeRapport] = useState<ModeRapport>('annee');
  const [periodeId, setPeriodeId] = useState('');

  const { rapport } = useRapportFinancier(
    modeRapport === 'annee'
      ? { anneeScolaireId: anneeActive?.id }
      : { periodeId: periodeId ? Number(periodeId) : undefined }
  );

  const { depenses } = useDepenses({ statut: 'valide' });
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);

  const annulerMutation = useMutation({
    mutationFn: async (id: number) => { await client.post(`/depenses/${id}/annuler`); },
    onSuccess: () => queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'depenses' || q.queryKey[0] === 'rapport-financier' }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ardoise font-display">Comptabilité</h1>
          <p className="text-sm mt-0.5 text-charbon-muted">Suivi des dépenses et du solde financier de l'école</p>
        </div>
        <button onClick={() => setAfficherFormulaire(true)}
          className="flex items-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={16} /> Enregistrer une dépense
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1.5">
            <button
              onClick={() => setModeRapport('annee')}
              className={`text-xs px-3 py-1.5 rounded border font-medium transition-colors ${
                modeRapport === 'annee' ? 'bg-ardoise-light border-ardoise text-ardoise' : 'border-border text-charbon-muted'
              }`}
            >
              Année scolaire complète
            </button>
            <button
              onClick={() => setModeRapport('periode')}
              className={`text-xs px-3 py-1.5 rounded border font-medium transition-colors ${
                modeRapport === 'periode' ? 'bg-ardoise-light border-ardoise text-ardoise' : 'border-border text-charbon-muted'
              }`}
            >
              Par période
            </button>
          </div>
          {modeRapport === 'periode' && (
            <select value={periodeId} onChange={(e) => setPeriodeId(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm text-charbon bg-white">
              <option value="">Sélectionner une période</option>
              {periodes.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          )}
        </div>
      </div>

      {rapport && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-border p-5">
            <p className="text-xs font-medium mb-1 text-charbon-muted">Recettes — {rapport.periode}</p>
            <p className="text-2xl font-bold text-foret font-display">{formaterMontant(rapport.total_recettes)}</p>
            <p className="text-xs mt-0.5 text-charbon-muted">FCFA</p>
          </div>
          <div className="bg-white rounded-lg border border-border p-5">
            <p className="text-xs font-medium mb-1 text-charbon-muted">Dépenses — {rapport.periode}</p>
            <p className="text-2xl font-bold text-terracotta font-display">{formaterMontant(rapport.total_depenses)}</p>
            <p className="text-xs mt-0.5 text-charbon-muted">FCFA</p>
          </div>
          <div className="bg-white rounded-lg border border-border p-5">
            <p className="text-xs font-medium mb-1 text-charbon-muted">Solde net</p>
            <p className={`text-2xl font-bold font-display ${rapport.solde_net >= 0 ? 'text-foret' : 'text-terracotta'}`}>
              {formaterMontant(rapport.solde_net)}
            </p>
            <p className="text-xs mt-0.5 text-charbon-muted">FCFA</p>
          </div>
        </div>
      )}

      {afficherFormulaire && <ModalDepense onClose={() => setAfficherFormulaire(false)} />}

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm text-ardoise font-display">Dépenses enregistrées</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-[#fdfcfa]">
              {['Catégorie', 'Description', 'Montant', 'Date', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-charbon-muted whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {depenses.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-charbon-muted">Aucune dépense enregistrée.</td></tr>
            ) : (
              depenses.map((d, i) => (
                <tr key={d.id} className={`border-b border-[#f3ede7] ${i % 2 === 1 ? 'bg-[#fdfcfa]' : 'bg-white'}`}>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-ardoise-light text-ardoise">{d.categorie?.nom ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-charbon">{d.description}</td>
                  <td className="px-4 py-3 font-semibold text-terracotta">{formaterMontant(d.montant)} FCFA</td>
                  <td className="px-4 py-3 text-charbon-muted">{new Date(d.date_depense).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => window.confirm(`Annuler la dépense "${d.description}" ?`) && annulerMutation.mutate(d.id)}
                      className="text-xs font-medium text-charbon-muted hover:text-terracotta transition-colors"
                    >
                      Annuler
                    </button>
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