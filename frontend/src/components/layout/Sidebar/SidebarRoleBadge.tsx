import { User } from 'lucide-react';
import type { Role } from '../../../types';

export default function SidebarRoleBadge({ role }: { role: Role }) {
  return (
    <div className="px-4 py-3">
      <div className="rounded px-2.5 py-1.5 text-xs flex items-center gap-2 bg-white/10">
        <User size={14} />
        <p className="font-semibold leading-none">
          {role === 'direction' ? 'Direction' : 'Enseignant(e)'}
        </p>
      </div>
    </div>
  );
}