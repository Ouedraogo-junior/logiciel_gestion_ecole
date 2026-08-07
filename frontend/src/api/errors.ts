import { AxiosError } from 'axios';

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data?.errors) {
      const premiereErreur = Object.values(data.errors)[0];
      if (Array.isArray(premiereErreur)) return premiereErreur[0] as string;
    }
    if (data?.message) return data.message;
  }
  return 'Une erreur est survenue. Réessayez.';
}