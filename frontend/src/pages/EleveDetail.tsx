import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, IdCard } from 'lucide-react';
import client from '../api/client';
import { useEleve } from '../hooks/useEleve';
import OngletNotes from '../components/eleves/OngletNotes';
import OngletPresences from '../components/eleves/OngletPresences';
import OngletPaiements from '../components/eleves/OngletPaiements';
import PhotoEleve from '../components/eleves/PhotoEleve';
import { genererEtOuvrirPdf } from '../utils/pdf';

type Onglet = 'notes' | 'presences' | 'paiements';

interface Solde { total_du: number; total_paye: number; solde_restant: number; }

export default function EleveDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { eleve, loading } = useEleve(id);
  const [onglet, setOnglet] = useState<Onglet>('notes');

  const { data: solde } = useQuery({
    queryKey: ['solde', eleve?.id],
    queryFn: async () => {
      const { data } = await client.get(`/eleves/${eleve!.id}/solde`);
      return data.data as Solde;
    },
    enabled: !!eleve,
  });

  const [genererCarteEnCours, setGenererCarteEnCours] = useState(false);
  const [erreurCarte, setErreurCarte] = useState<string | null>(null);

  async function handleGenererCarte() {
    if (!eleve) return;
    setErreurCarte(null);
    setGenererCarteEnCours(true);
    try {
      await genererEtOuvrirPdf(`/eleves/${eleve.id}/carte`);
    } catch (err) {
      setErreurCarte(err instanceof Error ? err.message : 'Erreur lors de la génération.');
    } finally {
      setGenererCarteEnCours(false);
    }
  }

  if (loading) return <p className="text-sm text-charbon-muted">Chargement...</p>;
  if (!eleve) return <p className="text-sm text-terracotta">Élève introuvable.</p>;

  const inscriptionActuelle = eleve.inscriptions.find((i) => i.annee_scolaire?.is_active);
  const contact = eleve.contacts[0];
  const onglets: { id: Onglet; label: string }[] = [
    { id: 'notes', label: 'Notes' },
    { id: 'presences', label: 'Présences' },
    { id: 'paiements', label: 'Paiements' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-charbon-muted">
        <button onClick={() => navigate('/eleves')} className="hover:underline text-ardoise flex items-center gap-1">
          <ArrowLeft size={14} /> Élèves
        </button>
        <ChevronRight size={14} />
        <span className="text-charbon">{eleve.prenom} {eleve.nom}</span>
      </div>

      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <PhotoEleve eleveId={eleve.id} photoPath={eleve.photo_path} />
            <div>
              <h1 className="text-xl font-semibold text-charbon font-display">{eleve.prenom} {eleve.nom}</h1>
              <p className="text-sm text-charbon-muted mt-0.5">
                Matricule {eleve.matricule} — {inscriptionActuelle?.classe?.nom ?? 'Non inscrit cette année'}
              </p>
              {contact && (
                <p className="text-xs text-charbon-muted mt-2">
                  {contact.lien_parente ?? 'Contact'} : {contact.nom} — {contact.telephone}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              {solde && (
                <div className={`text-center px-4 py-2 rounded-lg ${solde.solde_restant > 0 ? 'bg-terracotta-light' : 'bg-foret-light'}`}>
                  <p className={`text-lg font-bold font-display ${solde.solde_restant > 0 ? 'text-terracotta' : 'text-foret'}`}>
                    {solde.solde_restant > 0 ? `${solde.solde_restant.toLocaleString('fr-FR')} FCFA` : 'À jour'}
                  </p>
                  <p className="text-xs text-charbon-muted mt-0.5">
                    {solde.solde_restant > 0 ? 'Solde restant' : 'Paiement'}
                  </p>
                </div>
              )}
              <span className={`text-xs font-medium px-2.5 py-1 rounded ${
                eleve.statut === 'actif' ? 'bg-foret-light text-foret' : 'bg-[#f3ede7] text-charbon-muted'
              }`}>
                {eleve.statut === 'actif' ? 'Actif' : eleve.statut === 'transfere' ? 'Transféré' : 'Inactif'}
              </span>
            </div>

            <button
              onClick={handleGenererCarte}
              disabled={genererCarteEnCours}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-ardoise text-ardoise hover:bg-ardoise-light transition-colors disabled:opacity-50"
            >
              <IdCard size={14} />
              {genererCarteEnCours ? 'Génération...' : 'Générer la carte scolaire'}
            </button>
            {erreurCarte && <p className="text-xs text-terracotta max-w-[16rem] text-right">{erreurCarte}</p>}
          </div>
        </div>
      </div>

      <div className="border-b border-border flex gap-1">
        {onglets.map((o) => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              onglet === o.id ? 'border-ardoise text-ardoise' : 'border-transparent text-charbon-muted hover:text-charbon'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {onglet === 'notes' && inscriptionActuelle && (
        <OngletNotes eleveId={eleve.id} anneeScolaireId={inscriptionActuelle.annee_scolaire_id} />
      )}
      {onglet === 'presences' && <OngletPresences eleveId={eleve.id} />}
      {onglet === 'paiements' && (
        <OngletPaiements
          eleveId={eleve.id}
          eleveInfo={{
            nom: eleve.nom,
            prenom: eleve.prenom,
            matricule: eleve.matricule,
            niveau: inscriptionActuelle?.classe?.niveau ?? null,
          }}
        />
      )}
    </div>
  );
}