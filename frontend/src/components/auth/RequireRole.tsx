import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import type { Role } from '../../types';

function pageAtterrissage(role: Role) {
  return role === 'direction' ? '/tableau-de-bord' : '/mes-classes';
}

export default function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to={pageAtterrissage(user?.role ?? 'enseignant')} replace />;
  }
  return <>{children}</>;
}