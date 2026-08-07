export interface Appreciation {
  label: string;
  textClass: string;
  bgClass: string;
}

export function getAppreciation(note: number, echelle: number = 20): Appreciation {
  const ratio = note / echelle;
  if (ratio >= 0.8) return { label: 'Très bien', textClass: 'text-foret', bgClass: 'bg-foret-light' };
  if (ratio >= 0.7) return { label: 'Bien', textClass: 'text-foret', bgClass: 'bg-foret-light' };
  if (ratio >= 0.5) return { label: 'Passable', textClass: 'text-ardoise', bgClass: 'bg-ardoise-light' };
  return { label: 'Insuffisant', textClass: 'text-terracotta', bgClass: 'bg-terracotta-light' };
}