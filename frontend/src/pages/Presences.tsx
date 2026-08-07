import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAnneeActive } from '../hooks/useAnneeActive';
import { useClasses } from '../hooks/useClasses';
import FeuilleAppel from '../components/presences/FeuilleAppel';

function aujourdHui() {
  return new Date().toISOString().slice(0, 10);
}

export default function Presences() {
  const { user } = useAuth();
  const estEnseignant = user?.role === 'enseignant';

  const { anneeActive } = useAnneeActive();
  const { classes: toutesLesClasses } = useClasses(anneeActive?.id);

  const classesDisponibles = estEnseignant
    ? toutesLesClasses.filter((c) => c.enseignant_titulaire_id === user?.id)
    : toutesLesClasses;

  const [classeId, setClasseId] = useState('');
  const [date, setDate] = useState(aujourdHui());

  const classeSelectionnee = classesDisponibles.find((c) => c.id === Number(classeId));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-ardoise font-display">Appel de présence</h1>
        <p className="text-sm mt-0.5 text-charbon-muted">Enregistrez les présences et absences d'une classe</p>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        <div className="grid grid-cols-2 gap-4 max-w-xl">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Classe</label>
            <select
              value={classeId}
              onChange={(e) => setClasseId(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white"
            >
              <option value="">Sélectionner</option>
              {classesDisponibles.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
            {estEnseignant && classesDisponibles.length === 0 && (
              <p className="text-xs text-charbon-muted mt-1.5">Tu n'es titulaire d'aucune classe.</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-charbon-muted">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white"
            />
          </div>
        </div>
      </div>

      {!classeId ? (
        <div className="bg-white rounded-lg border border-border px-5 py-8 text-center text-sm text-charbon-muted">
          Sélectionne une classe et une date pour afficher la feuille d'appel.
        </div>
      ) : (
        <FeuilleAppel
          key={`${classeId}-${date}`}
          classeId={Number(classeId)}
          classeNom={classeSelectionnee?.nom ?? ''}
          date={date}
        />
      )}
    </div>
  );
}