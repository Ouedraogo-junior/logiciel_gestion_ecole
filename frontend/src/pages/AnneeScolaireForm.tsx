import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import client from '../api/client';
import { getErrorMessage } from '../api/errors';

export default function AnneeScolaireForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [libelle, setLibelle] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [activerImmediatement, setActiverImmediatement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.post('/annees-scolaires', {
        libelle, date_debut: dateDebut, date_fin: dateFin, is_active: activerImmediatement,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'annees-scolaires' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(`/annees-scolaires/${data.data.id}`);
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (activerImmediatement) {
      const confirme = window.confirm(
        "Activer cette année dès sa création désactivera automatiquement l'année scolaire actuellement active, sur tout le logiciel. Continuer ?"
      );
      if (!confirme) return;
    }
    mutation.mutate();
  }

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => navigate('/annees-scolaires')} className="flex items-center gap-1.5 text-sm text-charbon-muted hover:text-charbon w-fit">
        <ArrowLeft size={16} /> Retour à la liste
      </button>

      <h1 className="text-xl font-semibold text-ardoise font-display">Ajouter une année scolaire</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-6 flex flex-col gap-5 max-w-xl">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-charbon">Libellé</label>
          <input value={libelle} onChange={(e) => setLibelle(e.target.value)} required placeholder="ex : 2028-2029"
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-charbon">Date de début</label>
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} required
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-charbon">Date de fin</label>
            <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} required
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-charbon cursor-pointer">
          <input type="checkbox" checked={activerImmediatement} onChange={(e) => setActiverImmediatement(e.target.checked)} />
          Activer cette année dès sa création
        </label>
        {activerImmediatement && (
          <p className="text-xs text-terracotta -mt-2">
            Désactivera automatiquement l'année actuellement active sur tout le logiciel.
          </p>
        )}

        {erreur && (
          <div className="text-sm text-terracotta bg-terracotta-light border border-terracotta/20 rounded-md px-3 py-2">
            {erreur}
          </div>
        )}

        <button type="submit" disabled={mutation.isPending}
          className="self-start bg-terracotta hover:bg-terracotta-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
          {mutation.isPending ? 'Enregistrement...' : "Créer l'année scolaire"}
        </button>
      </form>
    </div>
  );
}