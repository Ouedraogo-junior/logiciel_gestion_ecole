export default function Avatar({ prenom, nom }: { prenom: string; nom: string }) {
  return (
    <div className="w-7 h-7 rounded-full bg-ardoise-light text-ardoise flex items-center justify-center text-xs font-bold shrink-0">
      {prenom[0]}{nom[0]}
    </div>
  );
}