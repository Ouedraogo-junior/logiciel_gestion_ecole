import { Building2 } from 'lucide-react';

export default function SidebarBrand({ nomEcole }: { nomEcole: string }) {
  return (
    <div className="px-5 py-5 border-b border-white/10">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md bg-terracotta flex items-center justify-center shrink-0">
          <Building2 size={16} className="text-white" />
        </div>
        <p className="text-xs font-semibold leading-tight opacity-90 font-display">{nomEcole}</p>
      </div>
    </div>
  );
}