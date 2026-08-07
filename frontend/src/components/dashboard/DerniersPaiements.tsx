import { useNavigate } from 'react-router-dom';
import type { Paiement } from '../../types';

export default function DerniersPaiements({ paiements }: { paiements: Paiement[] }) {
  const navigate = useNavigate();
  const colonnes = ['Élève', 'Type', 'Montant', 'Moyen', 'Date'];

  return (
    <div className="bg-white rounded-lg border border-border">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-sm text-ardoise font-display">Derniers paiements enregistrés</h2>
        <button onClick={() => navigate('/paiements')} className="text-xs text-charbon-muted hover:underline">
          Voir tout
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {colonnes.map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-charbon-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paiements.map((p, i) => (
              <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fdfcfa]'} style={{ borderBottom: '1px solid #f3ede7' }}>
                <td className="px-5 py-3 font-medium text-charbon">{p.eleve?.prenom} {p.eleve?.nom}</td>
                <td className="px-5 py-3 text-charbon">{p.echeance?.type_frais?.nom ?? '—'}</td>
                <td className="px-5 py-3 font-semibold text-foret">{p.montant.toLocaleString('fr-FR')} FCFA</td>
                <td className="px-5 py-3 text-charbon">{p.moyen_paiement}</td>
                <td className="px-5 py-3 text-charbon-muted">{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}