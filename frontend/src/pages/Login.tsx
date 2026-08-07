import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { getErrorMessage } from '../api/errors';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [pseudo, setPseudo] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    try {
      const user = await login(pseudo, password);
      navigate(user.role === 'direction' ? '/tableau-de-bord' : '/mes-classes');
    } catch (err) {
      setErreur(getErrorMessage(err));
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivoire">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-lg bg-ardoise flex items-center justify-center text-white mx-auto mb-4">
            <Building2 size={28} />
          </div>
          <h1 className="text-2xl font-semibold text-ardoise font-display">
            École Primaire
          </h1>
          <p className="text-sm mt-1 text-charbon-muted">
            Système de gestion scolaire
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-lg shadow-sm border border-border p-8">
          <p className="text-sm font-semibold mb-4 text-charbon font-display">
            Connexion
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5 text-charbon">
              Identifiant
            </label>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              required
              autoFocus
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white"
              placeholder="ex : direction"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5 text-charbon">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-charbon bg-white"
            />
          </div>

          {erreur && (
            <div className="mb-4 text-sm text-terracotta bg-terracotta-light border border-terracotta/20 rounded-md px-3 py-2">
              {erreur}
            </div>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-colors font-display bg-terracotta hover:bg-terracotta-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {chargement ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-xs mt-6 text-charbon-light">
          Burkina Faso
        </p>
      </div>
    </div>
  );
}