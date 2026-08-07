import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon } from 'lucide-react';
import client from '../../api/client';
import { getErrorMessage } from '../../api/errors';

const BASE_STOCKAGE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api/v1').replace('/api/v1', '');

export default function LogoEcole({ logoPath }: { logoPath: string | null }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (fichier: File) => {
      const formData = new FormData();
      formData.append('logo', fichier);
      const { data } = await client.post('/parametres-ecole/logo', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parametres-ecole'] });
      setErreur(null);
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleFichierChoisi(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (fichier) mutation.mutate(fichier);
  }

  return (
    <div className="flex items-center gap-4">
      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-20 h-20 rounded-lg bg-ardoise-light overflow-hidden cursor-pointer group shrink-0 border border-border"
      >
        {logoPath ? (
          <img src={`${BASE_STOCKAGE}/storage/${logoPath}`} alt="Logo de l'école" className="w-full h-full object-contain p-1" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ardoise">
            <ImageIcon size={24} />
          </div>
        )}
        <div className="absolute inset-0 bg-charbon/0 group-hover:bg-charbon/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <ImageIcon size={18} className="text-white" />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-charbon">Logo de l'école</p>
        <p className="text-xs text-charbon-muted mt-0.5">Utilisé sur les reçus, cartes scolaires et bulletins. Clique sur le logo pour le modifier.</p>
        {mutation.isPending && <p className="text-xs text-charbon-muted mt-1">Envoi...</p>}
        {erreur && <p className="text-xs text-terracotta mt-1">{erreur}</p>}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" onChange={handleFichierChoisi} className="hidden" />
    </div>
  );
}