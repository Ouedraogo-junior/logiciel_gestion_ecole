import { LogOut } from 'lucide-react';

export default function SidebarFooter({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="px-3 pb-4 border-t border-white/10 pt-3">
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/55 hover:bg-white/8 hover:text-white/90 transition-colors"
      >
        <LogOut size={16} />
        <span>Déconnexion</span>
      </button>
    </div>
  );
}