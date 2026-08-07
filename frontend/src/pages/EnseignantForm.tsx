import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import client from '../api/client';
import { getErrorMessage } from '../api/errors';

export default function EnseignantForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.post('/enseignants', {
        nom, prenom, pseudo,
        telephone_contact: telephone || undefined,
        password,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enseignants'] });
      navigate(`/enseignants/${data.data.id}`);
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    mutation.mutate();
  }

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => navigate('/enseignants')} className="flex items-center gap-1.5 text-sm text-charbon-muted hover:text-charbon w-fit">
        <ArrowLeft size={16} /> Retour à la liste
      </button>

      <h1 className="text-xl font-semibold text-ardoise font-display">Ajouter un enseignant</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-6 flex flex-col gap-5 max-w-xl">
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
            <label className="block text-sm font-medium mb-1.5 text-charbon">
              Identifiant de connexion <span className="text-charbon-muted font-normal">(pseudo)</span>
            </label>
            <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} required
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-charbon">
              Téléphone <span className="text-charbon-muted font-normal">(optionnel)</span>
            </label>
            <input value={telephone} onChange={(e) => setTelephone(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-charbon">Mot de passe initial</label>
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          <p className="text-xs text-charbon-muted mt-1">Au moins 6 caractères — à communiquer à l'enseignant.</p>
        </div>

        {erreur && (
          <div className="text-sm text-terracotta bg-terracotta-light border border-terracotta/20 rounded-md px-3 py-2">
            {erreur}
          </div>
        )}

        <button type="submit" disabled={mutation.isPending}
          className="self-start bg-terracotta hover:bg-terracotta-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
          {mutation.isPending ? 'Enregistrement...' : 'Créer le compte'}
        </button>
      </form>
    </div>
  );
}