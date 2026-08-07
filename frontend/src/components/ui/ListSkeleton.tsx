import Skeleton from './Skeleton';

export default function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg border border-border">
      <div className="px-5 py-4 border-b border-border">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y divide-[#f3ede7]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}