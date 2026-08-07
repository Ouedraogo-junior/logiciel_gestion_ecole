export function nomAffichage(personne: { nom: string; prenom: string }): string {
  return `${personne.nom} ${personne.prenom}`;
}