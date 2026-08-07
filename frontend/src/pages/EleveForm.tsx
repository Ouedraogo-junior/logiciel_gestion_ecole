import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import FormulaireIndividuel from '../components/eleves/FormulaireIndividuel';
import FormulaireMasse from '../components/eleves/FormulaireMasse';

type Mode = 'individuel' | 'masse';

export default function EleveForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('individuel');

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => navigate('/eleves')} className="flex items-center gap-1.5 text-sm text-charbon-muted hover:text-charbon w-fit">
        <ArrowLeft size={16} /> Retour à la liste
      </button>

      <h1 className="text-xl font-semibold text-ardoise font-display">Ajouter des élèves</h1>

      <div className="border-b border-border flex gap-1">
        {([
          { id: 'individuel', label: 'Un élève' },
          { id: 'masse', label: 'Plusieurs élèves' },
        ] as { id: Mode; label: string }[]).map((o) => (
          <button
            key={o.id}
            onClick={() => setMode(o.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              mode === o.id ? 'border-ardoise text-ardoise' : 'border-transparent text-charbon-muted hover:text-charbon'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {mode === 'individuel' ? <FormulaireIndividuel /> : <FormulaireMasse />}
    </div>
  );
}