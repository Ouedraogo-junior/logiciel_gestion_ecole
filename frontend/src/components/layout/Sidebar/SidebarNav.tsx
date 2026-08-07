import { NavLink } from 'react-router-dom';
import type { Role } from '../../../types';
import { navItems } from './navItems';

export default function SidebarNav({ role }: { role: Role }) {
  const visibles = navItems.filter((item) => item.roles.includes(role));

  return (
    <nav className="flex-1 px-3 pb-4 overflow-y-auto">
      <p className="text-xs opacity-40 uppercase tracking-widest px-2 mb-2 mt-1">Navigation</p>
      <ul className="flex flex-col gap-0.5">
        {visibles.map(({ path, label, icon: Icon }) => (
          <li key={path}>
            <NavLink
              to={path}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive ? 'bg-white/15 text-white font-semibold' : 'text-white/65 hover:bg-white/8'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} />
                  <span>{label}</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-terracotta" />}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}