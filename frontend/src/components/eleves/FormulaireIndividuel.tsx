import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { getErrorMessage } from '../../api/errors';
import { useAnneeActive } from '../../hooks/useAnneeActive';
import { useClasses } from '../../hooks/useClasses';

export default function FormulaireIndividuel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { anneeActive } = useAnneeActive();
  const { classes } = useClasses(anneeActive?.id);

  const [classeId, setClasseId] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [sexe, setSexe] = useState<'M' | 'F'>('M');
  const [contactNom, setContactNom] = useState('');
  const [contactTelephone, setContactTelephone] = useState('');
  const [contactLien, setContactLien] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        nom, prenom,
        date_naissance: dateNaissance,
        sexe,
        classe_id: Number(classeId),
      };
      if (contactNom && contactTelephone) {
        payload.contacts = [{ nom: contactNom, telephone: contactTelephone, lien_parente: contactLien || null }];
      }
      const { data } = await client.post('/eleves', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['eleves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(`/eleves/${data.data.id}`);
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-6 flex flex-col gap-5 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-charbon">Classe</label>
        <select
          value={classeId}
          onChange={(e) => setClasseId(e.target.value)}
          required
          className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white"
        >
          <option value="">Sélectionner une classe</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-charbon">Nom</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} required
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-charbon">Prénom</label>
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} required
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-charbon">Date de naissance</label>
          <input type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} required
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-charbon">Sexe</label>
          <select value={sexe} onChange={(e) => setSexe(e.target.value as 'M' | 'F')}
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white">
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-sm font-semibold text-charbon mb-3">
          Contact / Tuteur <span className="text-charbon-muted font-normal">(optionnel)</span>
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Nom</label>
            <input value={contactNom} onChange={(e) => setContactNom(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Téléphone</label>
            <input value={contactTelephone} onChange={(e) => setContactTelephone(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Lien de parenté</label>
            <input value={contactLien} onChange={(e) => setContactLien(e.target.value)} placeholder="Père, mère, tuteur..."
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>
        </div>
      </div>

      {erreur && (
        <div className="text-sm text-terracotta bg-terracotta-light border border-terracotta/20 rounded-md px-3 py-2">
          {erreur}
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="self-start bg-terracotta hover:bg-terracotta-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {mutation.isPending ? 'Enregistrement...' : "Enregistrer l'élève"}
      </button>
    </form>
  );
}