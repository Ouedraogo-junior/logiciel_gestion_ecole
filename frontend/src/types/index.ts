export type Role = 'direction' | 'enseignant' | 'parent';

export interface AnneeScolaire {
  id: number;
  libelle: string;
  date_debut: string;
  date_fin: string;
  is_active: boolean;
}

export interface Periode {
  id: number;
  annee_scolaire_id: number;
  nom: string;
  ordre: number;
  date_debut: string;
  date_fin: string;
}

export interface Classe {
  id: number;
  nom: string;
  niveau: string;
  annee_scolaire_id: number;
  enseignant_titulaire_id: number | null;
  effectif_max: number | null;
  enseignant_titulaire?: { id: number; nom: string; prenom: string } | null;
}

export interface InscriptionActuelle {
  id: number;
  classe_id: number;
  classe?: Classe;
}

export interface Inscription {
  id: number;
  classe_id: number;
  annee_scolaire_id: number;
  statut: 'inscrit' | 'reinscrit' | 'redouble' | 'transfere' | 'abandon';
  date_inscription: string;
  classe?: Classe;
  annee_scolaire?: AnneeScolaire;
}

export interface EleveContact {
  id: number;
  nom: string;
  telephone: string;
  lien_parente: string | null;
}

export interface Eleve {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: 'M' | 'F';
  statut: 'actif' | 'transfere' | 'inactif';
  photo_path: string | null;
  contacts?: EleveContact[];
  inscription_actuelle?: InscriptionActuelle;
}

export interface EleveDetail extends Eleve {
  contacts: EleveContact[];
  inscriptions: Inscription[];
}

export interface Presence {
  id: number;
  eleve_id: number;
  classe_id: number;
  date: string;
  statut: 'present' | 'absent' | 'retard';
  motif: string | null;
  eleve?: { id: number; nom: string; prenom: string };
}

export interface Paiement {
  id: number;
  numero_recu: string | null;
  eleve_id: number;
  montant: number;
  date_paiement: string;
  moyen_paiement: 'especes' | 'mobile_money' | 'cheque' | 'autre';
  eleve?: { id: number; nom: string; prenom: string; matricule: string };
  echeance?: { nom: string; type_frais?: { nom: string } };
}

export interface EleveEnRetard {
  eleve: { id: number; nom: string; prenom: string; matricule: string };
  echeance: { nom: string; montant: number };
}

export interface ReponsePaginee<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}