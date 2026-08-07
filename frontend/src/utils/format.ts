export function formaterMontant(valeur: number | string | null | undefined): string {
  return Number(valeur ?? 0).toLocaleString('fr-FR');
}