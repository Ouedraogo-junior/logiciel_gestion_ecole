import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import client from '../../api/client';
import { getErrorMessage } from '../../api/errors';

interface Props {
  eleveId: number;
  photoPath: string | null;
}

const BASE_STOCKAGE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api/v1').replace('/api/v1', '');

export default function PhotoEleve({ eleveId, photoPath }: Props) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (fichier: File) => {
      const formData = new FormData();
      formData.append('photo', fichier);
      const { data } = await client.post(`/eleves/${eleveId}/photo`, formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eleve', String(eleveId)] });
      setErreur(null);
    },
    onError: (err) => setErreur(getErrorMessage(err)),
  });

  function handleFichierChoisi(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (fichier) mutation.mutate(fichier);
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-16 h-16 rounded-xl bg-ardoise-light overflow-hidden cursor-pointer group shrink-0"
      >
        {photoPath ? (
          <img src={`${BASE_STOCKAGE}/storage/${photoPath}`} alt="Photo élève" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ardoise">
            <Camera size={20} />
          </div>
        )}
        <div className="absolute inset-0 bg-charbon/0 group-hover:bg-charbon/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Camera size={16} className="text-white" />
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" onChange={handleFichierChoisi} className="hidden" />
      {mutation.isPending && <span className="text-xs text-charbon-muted">Envoi...</span>}
      {erreur && <span className="text-xs text-terracotta max-w-[8rem] text-center">{erreur}</span>}
    </div>
  );
}