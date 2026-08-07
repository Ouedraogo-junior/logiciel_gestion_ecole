import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import client from '../api/client';
import { useAnneeActive } from '../hooks/useAnneeActive';
import { useEleves } from '../hooks/useEleves';
import { useSoldes } from '../hooks/useSoldes';
import FormulairePaiement from '../components/paiements/FormulairePaiement';
import ModalDetailPaiementsEleve from '../components/paiements/ModalDetailPaiementsEleve';
import type { Paiement, Eleve } from '../types';
import { formaterMontant } from '../utils/format';

const libellesMoyen: Record<string, string> = {
  especes: 'Espèces', mobile_money: 'Mobile Money', cheque: 'Chèque', autre: 'Autre',
};

export default function Paiements() {
  const { anneeActive } = useAnneeActive();
  const [recherche, setRecherche] = useState('');
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [eleveSelectionne, setEleveSelectionne] = useState<Eleve | null>(null);

  const { eleves } = useEleves({ recherche: recherche || undefined });
  const { soldes } = useSoldes();

  const { data: paiements = [] } = useQuery({
    queryKey: ['paiements', 'annee', anneeActive?.id],
    queryFn: async () => {
      const { data } = await client.get('/paiements', { params: { annee_scolaire_id: anneeActive?.id, statut: 'valide' } });
      return data.data as Paiement[];
    },
    enabled: !!anneeActive,
  });

  const soldeParEleve = useMemo(() => {
    const map = new Map<number, number>();
    soldes.forEach((s) => map.set(s.eleve_id, s.solde_restant));
    return map;
  }, [soldes]);

  const paiementsParEleve = useMemo(() => {
    const map = new Map<number, Paiement[]>();
    paiements.forEach((p) => {
      const liste = map.get(p.eleve_id) ?? [];
      liste.push(p);
      map.set(p.eleve_id, liste);
    });
    return map;
  }, [paiements]);

  const totalCollecte = paiements.reduce((s, p) => s + Number(p.montant), 0);
  const enRetard = eleves.filter((e) => (soldeParEleve.get(e.id) ?? 0) > 0).length;

  const lignes = eleves
    .map((eleve) => {
      const pays = (paiementsParEleve.get(eleve.id) ?? []).slice().sort((a, b) => b.date_paiement.localeCompare(a.date_paiement));
      return {
        eleve,
        montantVerse: pays.reduce((s, p) => s + Number(p.montant), 0),
        soldeRestant: soldeParEleve.get(eleve.id) ?? 0,
        dernierPaiement: pays[0],
      };
    })
    .sort((a, b) => (b.soldeRestant > 0 ? 1 : 0) - (a.soldeRestant > 0 ? 1 : 0));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ardoise font-display">Paiements de scolarité</h1>
          <p className="text-sm mt-0.5 text-charbon-muted">Suivi des frais scolaires et historique des versements</p>
        </div>
        <button onClick={() => setAfficherFormulaire(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold bg-terracotta hover:bg-terracotta-hover transition-colors">
          <Plus size={16} /> Enregistrer un paiement
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-border p-5">
          <p className="text-xs font-medium mb-1 text-charbon-muted">Total collecté (année)</p>
          <p className="text-2xl font-bold text-foret font-display">{formaterMontant(totalCollecte)}</p>
          <p className="text-xs mt-0.5 text-charbon-muted">FCFA</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-5">
          <p className="text-xs font-medium mb-1 text-charbon-muted">Élèves en retard</p>
          <p className="text-2xl font-bold text-terracotta font-display">{enRetard}</p>
          <p className="text-xs mt-0.5 text-charbon-muted">sur {eleves.length} élève(s)</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-5">
          <p className="text-xs font-medium mb-1 text-charbon-muted">Élèves à jour</p>
          <p className="text-2xl font-bold text-foret font-display">{eleves.length - enRetard}</p>
          <p className="text-xs mt-0.5 text-charbon-muted">scolarité réglée</p>
        </div>
      </div>

      {afficherFormulaire && <FormulairePaiement onClose={() => setAfficherFormulaire(false)} />}

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charbon-light" />
        <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un élève..."
          className="w-full border border-border rounded-md pl-9 pr-3 py-2.5 text-sm text-charbon bg-white" />
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-[#fdfcfa]">
                {['Élève', 'Classe', 'Montant versé', 'Solde restant', 'Dernier paiement', 'Moyen', 'Statut'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charbon-muted whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map(({ eleve, montantVerse, soldeRestant, dernierPaiement }, i) => (
                <tr
                  key={eleve.id}
                  onClick={() => setEleveSelectionne(eleve)}
                  className={`border-b border-[#f3ede7] hover:bg-gray-50 cursor-pointer transition-colors ${i % 2 === 1 ? 'bg-[#fdfcfa]' : 'bg-white'}`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-ardoise-light text-ardoise flex items-center justify-center text-xs font-bold shrink-0">
                        {eleve.prenom[0]}{eleve.nom[0]}
                      </div>
                      <span className="font-medium text-charbon">{eleve.prenom} {eleve.nom}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-ardoise-light text-ardoise">
                      {eleve.inscription_actuelle?.classe?.nom ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-foret">{formaterMontant(montantVerse)} FCFA</td>
                  <td className={`px-5 py-3 font-semibold ${soldeRestant > 0 ? 'text-terracotta' : 'text-foret'}`}>
                    {soldeRestant > 0 ? `${formaterMontant(soldeRestant)} FCFA` : '—'}
                  </td>
                  <td className="px-5 py-3 text-xs text-charbon-muted">
                    {dernierPaiement ? new Date(dernierPaiement.date_paiement).toLocaleDateString('fr-FR') : 'Aucun versement'}
                  </td>
                  <td className="px-5 py-3 text-xs text-charbon-muted">
                    {dernierPaiement ? libellesMoyen[dernierPaiement.moyen_paiement] : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded whitespace-nowrap ${
                      soldeRestant > 0 ? 'bg-terracotta-light text-terracotta' : 'bg-foret-light text-foret'
                    }`}>
                      {soldeRestant > 0 ? 'En retard' : 'À jour'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {eleveSelectionne && (
        <ModalDetailPaiementsEleve
          eleve={eleveSelectionne}
          onClose={() => setEleveSelectionne(null)}
        />
      )}
    </div>
  );
}