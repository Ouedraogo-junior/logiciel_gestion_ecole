export function nettoyerSaisieNombre(valeur: string): string {
  return valeur.replace(/[^0-9.,]/g, '');
}

export function nombreDepuisTexte(valeur: string): number {
  return Number(valeur.replace(',', '.'));
}