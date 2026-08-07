import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, IdCard, FileText } from 'lucide-react';
import client from '../api/client';
import { getErrorMessage } from '../api/errors';
import { useClasseDetail } from '../hooks/useClasseDetail';
import { usePeriodes } from '../hooks/usePeriodes';
import { useNiveaux } from '../hooks/useNiveaux';
import SelecteurEnseignant from '../components/ui/SelecteurEnseignant';
import ListeElevesClasse from '../components/classes/ListeElevesClasse';
import { genererEtOuvrirPdf } from '../utils/pdf';

export default function ClasseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { classe, loading } = useClasseDetail(id);
  const { periodes } = usePeriodes(classe?.annee_scolaire_id);
  const { niveaux } = useNiveaux();

  const [nom, setNom] = useState('');
  const [niveau, setNiveau] = useState('');
  const [effectifMax, setEffectifMax] = useState('');
  const [titulaireId, setTitulaireId] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (classe) {
      setNom(classe.nom);
      setNiveau(classe.niveau);
      setEffectifMax(classe.effectif_max ? String(classe.effectif_max) : '');
      setTitulaireId(classe.enseignant_titulaire_id ? String(classe.enseignant_titulaire_id) : '');
    }
  }, [classe?.id]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.patch(`/classes/${id}`, {
        nom,
        niveau,
        effectif_max: effectifMax ? Number(effectifMax) : null,
        enseignant_titulaire_id: titulaireId ? Number(titulaireId) : null,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['classe', id] });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'classes' });
      setMessage(data.message);
      setErreur(null);
    },
    onError: (err) => { setErreur(getErrorMessage(err)); setMessage(null); },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    mutation.mutate();
  }

  const [genererCartesEnCours, setGenererCartesEnCours] = useState(false);
  const [erreurCartes, setErreurCartes] = useState<string | null>(null);

  async function handleGenererCartesClasse() {
    if (!classe) return;
    setErreurCartes(null);
    setGenererCartesEnCours(true);
    try {
      await genererEtOuvrirPdf(`/classes/${classe.id}/cartes`);
    } catch (err) {
      setErreurCartes(err instanceof Error ? err.message : 'Erreur lors de la génération.');
    } finally {
      setGenererCartesEnCours(false);
    }
  }

  const [periodeBulletinId, setPeriodeBulletinId] = useState('');
  const [genererBulletinsEnCours, setGenererBulletinsEnCours] = useState(false);
  const [erreurBulletins, setErreurBulletins] = useState<string | null>(null);

  async function handleGenererBulletinsClasse() {
    if (!classe || !periodeBulletinId) return;
    setErreurBulletins(null);
    setGenererBulletinsEnCours(true);
    try {
      await genererEtOuvrirPdf(`/classes/${classe.id}/bulletins?periode_id=${periodeBulletinId}`);
    } catch (err) {
      setErreurBulletins(err instanceof Error ? err.message : 'Erreur lors de la génération.');
    } finally {
      setGenererBulletinsEnCours(false);
    }
  }

  if (loading) return <p className="text-sm text-charbon-muted">Chargement...</p>;
  if (!classe) return <p className="text-sm text-terracotta">Classe introuvable.</p>;

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => navigate('/classes')} className="flex items-center gap-1.5 text-sm text-charbon-muted hover:text-charbon w-fit">
        <ArrowLeft size={16} /> Retour à la liste
      </button>

      <div className="bg-white rounded-lg border border-border p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-charbon font-display">{classe.nom}</h1>
          <p className="text-sm text-charbon-muted mt-0.5">
            {classe.enseignant_titulaire ? `Titulaire : ${classe.enseignant_titulaire.prenom} ${classe.enseignant_titulaire.nom}` : 'Aucun titulaire désigné'}
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-ardoise-light text-ardoise">{classe.niveau}</span>
      </div>

      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="font-semibold text-sm text-ardoise font-display mb-4">Modifier la classe</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Nom</label>
              <input value={nom} onChange={(e) => setNom(e.target.value)} required
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Niveau</label>
              <select value={niveau} onChange={(e) => setNiveau(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white">
                {niveaux.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Effectif max</label>
              <input type="number" min="1" value={effectifMax} onChange={(e) => setEffectifMax(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Enseignant titulaire</label>
              <SelecteurEnseignant
                value={titulaireId}
                onChange={setTitulaireId}
                anneeScolaireId={classe.annee_scolaire_id}
                classeIdExclue={classe.id}
              />
            </div>
          </div>

          {erreur && <p className="text-xs font-medium px-3 py-2 rounded bg-terracotta-light text-terracotta">{erreur}</p>}
          {message && <p className="text-xs font-medium px-3 py-2 rounded bg-foret-light text-foret">{message}</p>}

          <button type="submit" disabled={mutation.isPending}
            className="self-start bg-terracotta hover:bg-terracotta-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {mutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-border p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-semibold text-charbon">Cartes scolaires</span>
          <button
            onClick={handleGenererCartesClasse}
            disabled={genererCartesEnCours}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-ardoise text-ardoise hover:bg-ardoise-light transition-colors disabled:opacity-50"
          >
            <IdCard size={16} />
            {genererCartesEnCours ? 'Génération...' : 'Générer les cartes'}
          </button>
        </div>
        {erreurCartes && <p className="text-xs text-terracotta max-w-md">{erreurCartes}</p>}

        <div className="pt-4 border-t border-border flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-semibold text-charbon">Bulletins de la classe</span>
          <div className="flex items-center gap-2">
            <select
              value={periodeBulletinId}
              onChange={(e) => setPeriodeBulletinId(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm text-charbon bg-white"
            >
              <option value="">Choisir une période</option>
              {periodes.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
            <button
              onClick={handleGenererBulletinsClasse}
              disabled={genererBulletinsEnCours || !periodeBulletinId}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-ardoise text-ardoise hover:bg-ardoise-light transition-colors disabled:opacity-50"
            >
              <FileText size={16} />
              {genererBulletinsEnCours ? 'Génération...' : 'Générer les bulletins'}
            </button>
          </div>
        </div>
        {erreurBulletins && <p className="text-xs text-terracotta max-w-md">{erreurBulletins}</p>}
      </div>

      <ListeElevesClasse classeId={classe.id} />
    </div>
  );
}