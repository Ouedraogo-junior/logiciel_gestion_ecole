import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export function useMoyennesClasse(classeId?: number) {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['moyennes-classe', classeId],
    queryFn: async () => {
      const { data } = await client.get(`/classes/${classeId}/moyennes`);
      return data as { data: Record<string, number | null>; echelle: number };
    },
    enabled: !!classeId,
  });
  return { moyennes: data?.data ?? {}, echelle: data?.echelle ?? 20, loading };
}