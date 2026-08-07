import { LayoutDashboard, Users, UserCog, School, CalendarRange, BookOpen, UserCheck, Wallet, Receipt, Calendar, Settings, GraduationCap } from 'lucide-react';
import type { Role } from '../../../types';

export interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  roles: Role[];
}

export const navItems: NavItem[] = [
  { path: '/tableau-de-bord', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['direction'] },
  { path: '/eleves', label: 'Élèves', icon: Users, roles: ['direction', 'enseignant'] },
  { path: '/enseignants', label: 'Enseignants', icon: UserCog, roles: ['direction'] },
  { path: '/classes', label: 'Classes', icon: School, roles: ['direction'] },
  { path: '/annees-scolaires', label: 'Années scolaires', icon: CalendarRange, roles: ['direction'] },
  { path: '/notes', label: 'Saisie de notes', icon: BookOpen, roles: ['direction', 'enseignant'] },
  { path: '/presences', label: 'Appel de présence', icon: UserCheck, roles: ['direction', 'enseignant'] },
  { path: '/paiements', label: 'Paiements', icon: Wallet, roles: ['direction'] },
  { path: '/comptabilite', label: 'Comptabilité', icon: Receipt, roles: ['direction'] },
  { path: '/examens-nationaux', label: 'Candidats CM2', icon: GraduationCap, roles: ['direction'] },
  { path: '/emploi-du-temps', label: 'Emploi du temps', icon: Calendar, roles: ['direction', 'enseignant'] },
  { path: '/parametres', label: 'Paramètres', icon: Settings, roles: ['direction'] },
];