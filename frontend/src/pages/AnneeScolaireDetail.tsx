import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import client from '../api/client';
import { getErrorMessage } from '../api/errors';
import { useAnneeScolaireDetail } from '../hooks/useAnneeScolaireDetail';
import SectionPeriodes from '../components/annees-scolaires/SectionPeriodes';
import SectionTypesFrais from '../components/annees-scolaires/SectionTypesFrais';

export default function AnneeScolaireDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { anneeScolaire, loading } = useAnneeScolaireDetail(id);

  const [libelle, setLibelle] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (anneeScolaire) {
      setLibelle(anneeScolaire.libelle);
      setDateDebut(anneeScolaire.date_debut.slice(0, 10));
      setDateFin(anneeScolaire.date_fin.slice(0, 10));
    }
  }, [anneeScolaire?.id]);

  const majMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.patch(`/annees-scolaires/${id}`, { libelle, date_debut: dateDebut, date_fin: dateFin });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['annee-scolaire', id] });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'annees-scolaires' });
      setMessage(data.message);
      setErreur(null);
    },
    onError: (err) => { setErreur(getErrorMessage(err)); setMessage(null); },
  });

  const activerMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.patch(`/annees-scolaires/${id}`, { is_active: true });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annee-scolaire', id] });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'annees-scolaires' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    majMutation.mutate();
  }

  function handleActiver() {
    const confirme = window.confirm(
      "Activer cette année désactivera automatiquement l'année scolaire actuellement active, sur tout le logiciel. Continuer ?"
    );
    if (confirme) activerMutation.mutate();
  }

  if (loading) return <p className="text-sm text-charbon-muted">Chargement...</p>;
  if (!anneeScolaire) return <p className="text-sm text-terracotta">Année scolaire introuvable.</p>;

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => navigate('/annees-scolaires')} className="flex items-center gap-1.5 text-sm text-charbon-muted hover:text-charbon w-fit">
        <ArrowLeft size={16} /> Retour à la liste
      </button>

      <div className="bg-white rounded-lg border border-border p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-charbon font-display">{anneeScolaire.libelle}</h1>
          <p className="text-sm text-charbon-muted mt-0.5">{anneeScolaire.periodes?.length ?? 0} période(s) configurée(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded ${
            anneeScolaire.is_active ? 'bg-foret-light text-foret' : 'bg-[#f3ede7] text-charbon-muted'
          }`}>
            {anneeScolaire.is_active ? 'Active' : 'Inactive'}
          </span>
          {!anneeScolaire.is_active && (
            <button
              onClick={handleActiver}
              disabled={activerMutation.isPending}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-ardoise text-ardoise hover:bg-ardoise-light transition-colors disabled:opacity-50"
            >
              {activerMutation.isPending ? 'Activation...' : 'Activer cette année'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="font-semibold text-sm text-ardoise font-display mb-4">Informations</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Libellé</label>
            <input value={libelle} onChange={(e) => setLibelle(e.target.value)} required
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Date de début</label>
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} required
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Date de fin</label>
              <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} required
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
          </div>

          {erreur && <p className="text-xs font-medium px-3 py-2 rounded bg-terracotta-light text-terracotta">{erreur}</p>}
          {message && <p className="text-xs font-medium px-3 py-2 rounded bg-foret-light text-foret">{message}</p>}

          <button type="submit" disabled={majMutation.isPending}
            className="self-start bg-ardoise hover:bg-ardoise-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {majMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>

      <SectionPeriodes anneeScolaireId={anneeScolaire.id} />
      <SectionTypesFrais anneeScolaireId={anneeScolaire.id} />
    </div>
  );
}