import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import SidebarBrand from './SidebarBrand';
import SidebarRoleBadge from './SidebarRoleBadge';
import SidebarNav from './SidebarNav';
import SidebarFooter from './SidebarFooter';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="flex flex-col h-screen w-60 shrink-0 bg-ardoise text-white">
      <SidebarBrand nomEcole="École Primaire" />
      <SidebarRoleBadge role={user.role} />
      <SidebarNav role={user.role} />
      <SidebarFooter onLogout={handleLogout} />
    </aside>
  );
}