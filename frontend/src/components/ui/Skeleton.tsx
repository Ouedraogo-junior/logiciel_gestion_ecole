export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e8e2da] rounded ${className}`} />;
}