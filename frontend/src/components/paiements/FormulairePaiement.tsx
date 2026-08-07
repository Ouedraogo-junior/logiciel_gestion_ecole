import { useState, useMemo, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { getErrorMessage } from '../../api/errors';
import { useAnneeActive } from '../../hooks/useAnneeActive';
import { useTypesFrais } from '../../hooks/useTypesFrais';
import { useEcheances } from '../../hooks/useEcheances';
import SelecteurEleve from '../ui/SelecteurEleve';
import { genererEtOuvrirPdf } from '../../utils/pdf';
import { formaterMontant } from '../../utils/format';
import { nettoyerSaisieNombre, nombreDepuisTexte } from '../../utils/nombre';
import type { Eleve } from '../../types';

type Moyen = 'especes' | 'mobile_money' | 'cheque' | 'autre';

const moyens: { value: Moyen; label: string }[] = [
  { value: 'especes', label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'autre', label: 'Autre' },
];

interface EleveVerrouille {
  id: number;
  nom: string;
  prenom: string;
  matricule: string;
  niveau?: string | null;
}

interface Props {
  onClose: () => void;
  eleveVerrouille?: EleveVerrouille;
}

export default function FormulairePaiement({ onClose, eleveVerrouille }: Props) {
  const queryClient = useQueryClient();
  const { anneeActive } = useAnneeActive();

  const [eleveLibre, setEleveLibre] = useState<Eleve | null>(null);
  const eleveId = eleveVerrouille?.id ?? eleveLibre?.id;
  const niveauEleve = eleveVerrouille?.niveau ?? eleveLibre?.inscription_actuelle?.classe?.niveau;

  const { typesFrais } = useTypesFrais(anneeActive?.id, niveauEleve ?? undefined);

  const [typeFraisId, setTypeFraisId] = useState('');
  const [echeanceId, setEcheanceId] = useState('');
  const { echeances } = useEcheances(typeFraisId ? Number(typeFraisId) : undefined, eleveId);
  const [montant, setMontant] = useState('');
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().slice(0, 10));
  const [moyen, setMoyen] = useState<Moyen>('especes');
  const [reference, setReference] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  const [paiementCreeId, setPaiementCreeId] = useState<number | null>(null);
  const [genererRecuEnCours, setGenererRecuEnCours] = useState(false);
  const [erreurRecu, setErreurRecu] = useState<string | null>(null);

  const echeanceSelectionnee = echeances.find((e) => String(e.id) === echeanceId);
  const soldeMax = echeanceSelectionnee?.solde_restant ?? echeanceSelectionnee?.montant ?? null;

  function handleEleveChange(nouvelEleve: Eleve | null) {
    setEleveLibre(nouvelEleve);
    setTypeFraisId('');
    setEcheanceId('');
    setMontant('');
  }

  function choisirEcheance(id: string) {
    setEcheanceId(id);
    setErreur(null);
    const echeanceChoisie = echeances.find((e) => String(e.id) === id);
    if (echeanceChoisie) {
      const solde = echeanceChoisie.solde_restant ?? echeanceChoisie.montant;
      setMontant(String(solde));
    }
  }

  function handleMontantChange(valeur: string) {
    setErreur(null);
    setMontant(nettoyerSaisieNombre(valeur));
  }

  const montantNombre = useMemo(() => nombreDepuisTexte(montant), [montant]);
  const depasseSolde = soldeMax !== null && !isNaN(montantNombre) && montantNombre > soldeMax;

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.post('/paiements', {
        eleve_id: eleveId,
        echeance_id: Number(echeanceId),
        montant: montantNombre,
        date_paiement: datePaiement,
        moyen_paiement: moyen,
        reference: reference || undefined,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'paiements' });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'soldes' || q.queryKey[0] === 'solde' });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'echeances' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setPaiementCreeId(data.data.id);
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!eleveId) { setErreur('Sélectionne un élève.'); return; }
    if (!echeanceId) { setErreur('Sélectionne une échéance.'); return; }
    if (!montant || isNaN(montantNombre) || montantNombre <= 0) { setErreur('Montant invalide.'); return; }
    if (depasseSolde) { setErreur(`Le montant dépasse le solde restant (${formaterMontant(soldeMax)} FCFA).`); return; }
    mutation.mutate();
  }

  async function handleVoirRecu() {
    if (!paiementCreeId) return;
    setErreurRecu(null);
    setGenererRecuEnCours(true);
    try {
      await genererEtOuvrirPdf(`/paiements/${paiementCreeId}/recu`);
    } catch (err) {
      setErreurRecu(err instanceof Error ? err.message : 'Erreur lors de la génération.');
    } finally {
      setGenererRecuEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-charbon/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {paiementCreeId ? (
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-ardoise font-display">Paiement enregistré</h2>
            <button type="button" onClick={onClose} className="text-sm px-2 py-1 rounded hover:bg-gray-100 text-charbon-muted">✕</button>
          </div>
          <p className="text-sm text-charbon-muted mb-4">
            Le paiement a bien été enregistré. Tu peux imprimer le reçu maintenant, ou le récupérer plus tard depuis l'historique de l'élève.
          </p>
          {erreurRecu && <p className="text-xs font-medium px-3 py-2 rounded bg-terracotta-light text-terracotta mb-3">{erreurRecu}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleVoirRecu}
              disabled={genererRecuEnCours}
              className="flex-1 bg-terracotta hover:bg-terracotta-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {genererRecuEnCours ? 'Génération...' : 'Voir le reçu'}
            </button>
            <button onClick={onClose} className="text-sm font-medium px-4 py-2.5 rounded-lg border border-border text-charbon-muted hover:bg-gray-50">
              Fermer
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-ardoise font-display">Nouveau paiement</h2>
            <button type="button" onClick={onClose} className="text-sm px-2 py-1 rounded hover:bg-gray-100 text-charbon-muted">✕</button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon">Élève *</label>
              {eleveVerrouille ? (
                <div className="border border-border rounded-md px-3 py-2.5 text-sm bg-[#f3ede7] text-charbon font-medium">
                  {eleveVerrouille.prenom} {eleveVerrouille.nom} — {eleveVerrouille.matricule}
                </div>
              ) : (
                <SelecteurEleve value={eleveLibre} onChange={handleEleveChange} />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon">Type de frais *</label>
              <select
                value={typeFraisId}
                onChange={(e) => { setTypeFraisId(e.target.value); setEcheanceId(''); setMontant(''); }}
                disabled={!eleveId}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white disabled:opacity-50"
              >
                <option value="">— Sélectionner —</option>
                {typesFrais.map((t) => (
                  <option key={t.id} value={t.id}>{t.nom}{t.niveau ? ` (${t.niveau})` : ''}</option>
                ))}
              </select>
              {!eleveId && <p className="text-xs text-charbon-muted mt-1">Sélectionne d'abord un élève — les frais dépendent de son niveau.</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon">Échéance *</label>
              <select
                value={echeanceId}
                onChange={(e) => choisirEcheance(e.target.value)}
                disabled={!typeFraisId}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white disabled:opacity-50"
              >
                <option value="">— Sélectionner —</option>
                {echeances.map((e) => {
                  const solde = e.solde_restant ?? e.montant;
                  const soldee = solde <= 0;
                  return (
                    <option key={e.id} value={e.id} disabled={soldee}>
                      {e.nom} — {formaterMontant(e.montant)} FCFA
                      {soldee ? ' (Soldée)' : e.montant_paye ? ` (reste ${formaterMontant(solde)})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-charbon">Montant (FCFA) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={montant}
                  onChange={(e) => handleMontantChange(e.target.value)}
                  placeholder="15000"
                  className={`w-full border rounded-md px-3 py-2.5 text-sm text-charbon bg-white ${
                    depasseSolde ? 'border-terracotta bg-terracotta-light' : 'border-border'
                  }`}
                />
                {soldeMax !== null && (
                  <p className={`text-xs mt-1 ${depasseSolde ? 'text-terracotta font-medium' : 'text-charbon-muted'}`}>
                    Solde restant sur cette échéance : {formaterMontant(soldeMax)} FCFA
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-charbon">Date</label>
                <input type="date" value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon">Moyen de paiement</label>
              <div className="grid grid-cols-4 gap-2">
                {moyens.map((m) => (
                  <button key={m.value} type="button" onClick={() => setMoyen(m.value)}
                    className={`py-2 rounded-md text-xs font-medium border transition-colors ${
                      moyen === m.value ? 'bg-ardoise-light border-ardoise text-ardoise' : 'border-border text-charbon-muted'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon">
                Référence <span className="text-charbon-muted font-normal">(optionnel)</span>
              </label>
              <input value={reference} onChange={(e) => setReference(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>

            {erreur && <p className="text-xs font-medium px-3 py-2 rounded bg-terracotta-light text-terracotta">{erreur}</p>}

            <button type="submit" disabled={mutation.isPending || depasseSolde}
              className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-colors bg-terracotta hover:bg-terracotta-hover disabled:opacity-50">
              {mutation.isPending ? 'Enregistrement...' : 'Valider le paiement'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}