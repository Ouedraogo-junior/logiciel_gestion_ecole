import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2 } from 'lucide-react';
import client from '../api/client';
import { getErrorMessage } from '../api/errors';
import { useEnseignant } from '../hooks/useEnseignant';
import { useAnneeActive } from '../hooks/useAnneeActive';
import { useClasses } from '../hooks/useClasses';
import { useMatieres } from '../hooks/useMatieres';

export default function EnseignantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enseignant, loading } = useEnseignant(id);

  const { anneeActive } = useAnneeActive();
  const { classes } = useClasses(anneeActive?.id);
  const { matieres } = useMatieres();

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [telephone, setTelephone] = useState('');
  const [erreurInfos, setErreurInfos] = useState<string | null>(null);
  const [messageInfos, setMessageInfos] = useState<string | null>(null);

  useEffect(() => {
    if (enseignant) {
      setNom(enseignant.nom);
      setPrenom(enseignant.prenom);
      setPseudo(enseignant.pseudo);
      setTelephone(enseignant.telephone_contact ?? '');
    }
  }, [enseignant?.id]);

  const majInfosMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.patch(`/enseignants/${id}`, { nom, prenom, pseudo, telephone_contact: telephone || null });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enseignant', id] });
      queryClient.invalidateQueries({ queryKey: ['enseignants'] });
      setMessageInfos(data.message);
      setErreurInfos(null);
    },
    onError: (err) => { setErreurInfos(getErrorMessage(err)); setMessageInfos(null); },
  });

  const toggleActifMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.patch(`/enseignants/${id}`, { actif: !enseignant?.actif });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enseignant', id] });
      queryClient.invalidateQueries({ queryKey: ['enseignants'] });
    },
  });

  const [afficherReinit, setAfficherReinit] = useState(false);
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [messageReinit, setMessageReinit] = useState<string | null>(null);

  const reinitMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.post(`/enseignants/${id}/reinitialiser-mot-de-passe`, { password: nouveauMotDePasse });
      return data;
    },
    onSuccess: (data) => {
      setMessageReinit(data.message);
      setNouveauMotDePasse('');
      setAfficherReinit(false);
    },
  });

  const [classeAffectation, setClasseAffectation] = useState('');
  const [matiereAffectation, setMatiereAffectation] = useState('');
  const [coefficient, setCoefficient] = useState('1');
  const [erreurAffectation, setErreurAffectation] = useState<string | null>(null);

  const ajouterAffectationMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.post('/affectations', {
        classe_id: Number(classeAffectation),
        matiere_id: Number(matiereAffectation),
        enseignant_id: Number(id),
        coefficient: Number(coefficient) || 1,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enseignant', id] });
      setClasseAffectation('');
      setMatiereAffectation('');
      setCoefficient('1');
      setErreurAffectation(null);
    },
    onError: (err) => setErreurAffectation(getErrorMessage(err)),
  });

  const retirerAffectationMutation = useMutation({
    mutationFn: async (affectationId: number) => {
      await client.delete(`/affectations/${affectationId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enseignant', id] }),
  });

  function handleSubmitInfos(e: FormEvent) {
    e.preventDefault();
    setMessageInfos(null);
    majInfosMutation.mutate();
  }

  function handleAjouterAffectation(e: FormEvent) {
    e.preventDefault();
    if (!classeAffectation || !matiereAffectation) {
      setErreurAffectation('Sélectionne une classe et une matière.');
      return;
    }
    ajouterAffectationMutation.mutate();
  }

  if (loading) return <p className="text-sm text-charbon-muted">Chargement...</p>;
  if (!enseignant) return <p className="text-sm text-terracotta">Enseignant introuvable.</p>;

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => navigate('/enseignants')} className="flex items-center gap-1.5 text-sm text-charbon-muted hover:text-charbon w-fit">
        <ArrowLeft size={16} /> Retour à la liste
      </button>

      <div className="bg-white rounded-lg border border-border p-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-ardoise-light text-ardoise flex items-center justify-center text-lg font-bold font-display shrink-0">
            {enseignant.prenom[0]}{enseignant.nom[0]}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-charbon font-display">{enseignant.prenom} {enseignant.nom}</h1>
            <p className="text-sm text-charbon-muted mt-0.5">Identifiant : {enseignant.pseudo}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded ${
            enseignant.actif ? 'bg-foret-light text-foret' : 'bg-[#f3ede7] text-charbon-muted'
          }`}>
            {enseignant.actif ? 'Actif' : 'Désactivé'}
          </span>
          <button
            onClick={() => toggleActifMutation.mutate()}
            disabled={toggleActifMutation.isPending}
            className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
              enseignant.actif ? 'border-terracotta text-terracotta hover:bg-terracotta-light' : 'border-foret text-foret hover:bg-foret-light'
            }`}
          >
            {enseignant.actif ? 'Désactiver' : 'Réactiver'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="font-semibold text-sm text-ardoise font-display mb-4">Informations</h2>
        <form onSubmit={handleSubmitInfos} className="flex flex-col gap-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Nom</label>
              <input value={nom} onChange={(e) => setNom(e.target.value)} required
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Prénom</label>
              <input value={prenom} onChange={(e) => setPrenom(e.target.value)} required
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Identifiant (pseudo)</label>
              <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} required
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Téléphone</label>
              <input value={telephone} onChange={(e) => setTelephone(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
            </div>
          </div>

          {erreurInfos && <p className="text-xs font-medium px-3 py-2 rounded bg-terracotta-light text-terracotta">{erreurInfos}</p>}
          {messageInfos && <p className="text-xs font-medium px-3 py-2 rounded bg-foret-light text-foret">{messageInfos}</p>}

          <button type="submit" disabled={majInfosMutation.isPending}
            className="self-start bg-ardoise hover:bg-ardoise-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {majInfosMutation.isPending ? 'Enregistrement...' : 'Enregistrer les informations'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="font-semibold text-sm text-ardoise font-display mb-4">Mot de passe</h2>
        {!afficherReinit ? (
          <button onClick={() => setAfficherReinit(true)}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-border text-charbon hover:bg-gray-50 transition-colors">
            Réinitialiser le mot de passe
          </button>
        ) : (
          <div className="flex flex-col gap-3 max-w-sm">
            <input
              type="text"
              value={nouveauMotDePasse}
              onChange={(e) => setNouveauMotDePasse(e.target.value)}
              placeholder="Nouveau mot de passe (min. 6 caractères)"
              minLength={6}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white"
            />
            <div className="flex gap-2">
              <button
                onClick={() => reinitMutation.mutate()}
                disabled={nouveauMotDePasse.length < 6 || reinitMutation.isPending}
                className="bg-terracotta hover:bg-terracotta-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Confirmer
              </button>
              <button
                onClick={() => { setAfficherReinit(false); setNouveauMotDePasse(''); }}
                className="text-sm font-medium px-4 py-2 rounded-lg border border-border text-charbon-muted hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
        {messageReinit && <p className="text-xs font-medium px-3 py-2 rounded bg-foret-light text-foret mt-3 max-w-sm">{messageReinit}</p>}
      </div>

      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="font-semibold text-sm text-ardoise font-display mb-4">Affectations classe / matière</h2>

        {enseignant.affectations.length === 0 ? (
          <p className="text-sm text-charbon-muted mb-4">Aucune affectation pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-2 mb-5">
            {enseignant.affectations.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-2.5 border border-border rounded-md">
                <span className="text-sm text-charbon">
                  <span className="font-medium">{a.classe.nom}</span> — {a.matiere.nom}
                  <span className="text-charbon-muted"> (coeff. {a.coefficient})</span>
                </span>
                <button onClick={() => window.confirm('Retirer cette affectation ?') && retirerAffectationMutation.mutate(a.id)}
                  className="text-charbon-light hover:text-terracotta transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAjouterAffectation} className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Classe</label>
            <select value={classeAffectation} onChange={(e) => setClasseAffectation(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm text-charbon bg-white">
              <option value="">Sélectionner</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Matière</label>
            <select value={matiereAffectation} onChange={(e) => setMatiereAffectation(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm text-charbon bg-white">
              <option value="">Sélectionner</option>
              {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Coefficient</label>
            <input type="number" min="0.5" step="0.5" value={coefficient} onChange={(e) => setCoefficient(e.target.value)}
              className="w-24 border border-border rounded-md px-3 py-2 text-sm text-charbon bg-white" />
          </div>
          <button type="submit" disabled={ajouterAffectationMutation.isPending}
            className="bg-ardoise hover:bg-ardoise-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
            Ajouter
          </button>
        </form>
        {erreurAffectation && <p className="text-xs font-medium px-3 py-2 rounded bg-terracotta-light text-terracotta mt-3">{erreurAffectation}</p>}
      </div>
    </div>
  );
}