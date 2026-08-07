interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  colorClass: string;
  onClick?: () => void;
}

export default function StatCard({ label, value, sub, icon, colorClass, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg border border-border p-5 text-left w-full transition-shadow hover:shadow-md"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClass}`}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-charbon font-display">{value}</p>
      <p className="text-sm font-medium mt-0.5 text-charbon">{label}</p>
      {sub && <p className="text-xs mt-1 text-charbon-muted">{sub}</p>}
    </button>
  );
}