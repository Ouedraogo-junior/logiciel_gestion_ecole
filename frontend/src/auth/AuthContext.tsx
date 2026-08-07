import { createContext, useContext, useState, type ReactNode } from 'react';
import client from '../api/client';

interface User {
  id: number;
  nom: string;
  prenom: string;
  pseudo: string;
  role: 'direction' | 'enseignant' | 'parent';
}

interface AuthContextType {
  user: User | null;
  login: (pseudo: string, password: string) => Promise<User>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  async function login(pseudo: string, password: string): Promise<User> {
    setLoading(true);
    try {
      const { data } = await client.post('/login', { pseudo, password });
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      setUser(data.data.user);
      return data.data.user;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}