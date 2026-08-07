import Skeleton from './Skeleton';

export default function StatGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="bg-white rounded-lg border border-border p-6 grid gap-4" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}