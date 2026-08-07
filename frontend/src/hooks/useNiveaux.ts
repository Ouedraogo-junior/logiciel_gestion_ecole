import { useParametresEcole } from './useParametresEcole';

const NIVEAUX_PAR_DEFAUT = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'];

export function useNiveaux() {
  const { parametres, loading } = useParametresEcole();
  const niveaux = parametres.niveaux
    ? parametres.niveaux.split(',').map((n) => n.trim()).filter(Boolean)
    : NIVEAUX_PAR_DEFAUT;
  return { niveaux, loading };
}