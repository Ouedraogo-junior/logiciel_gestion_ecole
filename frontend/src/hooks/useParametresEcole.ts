import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export function useParametresEcole() {
  const { data: parametres = {}, isLoading: loading } = useQuery({
    queryKey: ['parametres-ecole'],
    queryFn: async () => {
      const { data } = await client.get('/parametres-ecole');
      return data.data as Record<string, string>;
    },
  });
  return { parametres, loading };
}