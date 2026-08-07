import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import client from '../../api/client';
import type { Paiement } from '../../types';
import StatGridSkeleton from '../ui/StatGridSkeleton';
import ListSkeleton from '../ui/ListSkeleton';
import { genererEtOuvrirPdf } from '../../utils/pdf';
import { formaterMontant } from '../../utils/format';
import FormulairePaiement from '../paiements/FormulairePaiement';

interface Solde { total_du: number; total_paye: number; solde_restant: number; }

interface EleveInfoPaiement {
  nom: string;
  prenom: string;
  matricule: string;
  niveau: string | null;
}

interface Props {
  eleveId: number;
  eleveInfo: EleveInfoPaiement;
}

export default function OngletPaiements({ eleveId, eleveInfo }: Props) {
  const { data: solde, isLoading: loadingSolde } = useQuery({
    queryKey: ['solde', eleveId],
    queryFn: async () => {
      const { data } = await client.get(`/eleves/${eleveId}/solde`);
      return data.data as Solde;
    },
  });

  const { data: paiements = [], isLoading: loadingPaiements } = useQuery({
    queryKey: ['paiements', eleveId],
    queryFn: async () => {
      const { data } = await client.get('/paiements', { params: { eleve_id: eleveId } });
      return data.data as Paiement[];
    },
  });

  const [chargementRecuId, setChargementRecuId] = useState<number | null>(null);
  const [erreurRecu, setErreurRecu] = useState<string | null>(null);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);

  async function handleVoirRecu(paiementId: number) {
    setErreurRecu(null);
    setChargementRecuId(paiementId);
    try {
      await genererEtOuvrirPdf(`/paiements/${paiementId}/recu`);
    } catch (err) {
      setErreurRecu(err instanceof Error ? err.message : 'Erreur lors de la génération.');
    } finally {
      setChargementRecuId(null);
    }
  }

  if (loadingSolde || loadingPaiements) {
    return (
      <div className="flex flex-col gap-4">
        <StatGridSkeleton count={3} />
        <ListSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-ardoise font-display">Solde de scolarité</h2>
        <button
          onClick={() => setAfficherFormulaire(true)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white transition-colors"
        >
          <Plus size={14} /> Enregistrer un paiement
        </button>
      </div>

      {solde && (
        <div className="bg-white rounded-lg border border-border p-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-charbon font-display">{formaterMontant(solde.total_du)} FCFA</p>
            <p className="text-xs text-charbon-muted mt-1">Total dû</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foret font-display">{formaterMontant(solde.total_paye)} FCFA</p>
            <p className="text-xs text-charbon-muted mt-1">Total payé</p>
          </div>
          <div>
            <p className={`text-lg font-bold font-display ${solde.solde_restant > 0 ? 'text-terracotta' : 'text-foret'}`}>
              {formaterMontant(solde.solde_restant)} FCFA
            </p>
            <p className="text-xs text-charbon-muted mt-1">Solde restant</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-border">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm text-ardoise font-display">Historique des paiements</h2>
          {erreurRecu && <p className="text-xs text-terracotta">{erreurRecu}</p>}
        </div>
        <div className="divide-y divide-[#f3ede7]">
          {paiements.length === 0 ? (
            <p className="px-5 py-4 text-sm text-charbon-muted">Aucun paiement enregistré</p>
          ) : (
            paiements.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm text-charbon">{p.echeance?.nom ?? '—'}</p>
                  <p className="text-xs text-charbon-muted mt-0.5">{new Date(p.date_paiement).toLocaleDateString('fr-FR')} — {p.moyen_paiement}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-foret">{formaterMontant(p.montant)} FCFA</p>
                  <button
                    onClick={() => handleVoirRecu(p.id)}
                    disabled={chargementRecuId === p.id}
                    className="text-xs font-medium text-ardoise hover:underline disabled:opacity-50"
                  >
                    {chargementRecuId === p.id ? '...' : 'Reçu'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {afficherFormulaire && (
        <FormulairePaiement
          eleveVerrouille={{ id: eleveId, ...eleveInfo }}
          onClose={() => setAfficherFormulaire(false)}
        />
      )}
    </div>
  );
}