export default function EmptyState({ message, tone = 'neutral' }: { message: string; tone?: 'neutral' | 'positive' }) {
  return (
    <p className={`px-5 py-4 text-sm ${tone === 'positive' ? 'text-foret' : 'text-charbon-muted'}`}>
      {message}
    </p>
  );
}