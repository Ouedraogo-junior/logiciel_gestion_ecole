import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Eleves from './pages/Eleves';
import EleveDetail from './pages/EleveDetail';
import AppLayout from './components/layout/AppLayout';
import EleveForm from './pages/EleveForm';
import SaisieNotes from './pages/SaisieNotes';
import Presences from './pages/Presences';
import MesClasses from './pages/MesClasses';
import Paiements from './pages/Paiements';
import Enseignants from './pages/Enseignants';
import EnseignantForm from './pages/EnseignantForm';
import EnseignantDetail from './pages/EnseignantDetail';
import Classes from './pages/Classes';
import ClasseForm from './pages/ClasseForm';
import ClasseDetail from './pages/ClasseDetail';
import PassageClasseSuperieure from './pages/PassageClasseSuperieure';
import AnneesScolaires from './pages/AnneesScolaires';
import AnneeScolaireForm from './pages/AnneeScolaireForm';
import AnneeScolaireDetail from './pages/AnneeScolaireDetail';
import RequireRole from './components/auth/RequireRole';
import Parametres from './pages/Parametres';
import Comptabilite from './pages/Comptabilite';
import CandidatsCM2 from './pages/CandidatsCM2';
import EmploiDuTemps from './pages/EmploiDuTemps';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/tableau-de-bord" element={<Dashboard />} />
        <Route path="/mes-classes" element={<MesClasses />} />
        <Route path="/eleves" element={<Eleves />} />
        <Route path="/eleves/nouveau" element={<RequireRole roles={['direction']}><EleveForm /></RequireRole>} />
        <Route path="/eleves/:id" element={<EleveDetail />} />
        <Route path="/enseignants" element={<RequireRole roles={['direction']}><Enseignants /></RequireRole>} />
        <Route path="/enseignants/nouveau" element={<RequireRole roles={['direction']}><EnseignantForm /></RequireRole>} />
        <Route path="/enseignants/:id" element={<RequireRole roles={['direction']}><EnseignantDetail /></RequireRole>} />
        <Route path="/classes" element={<RequireRole roles={['direction']}><Classes /></RequireRole>} />
        <Route path="/classes/nouveau" element={<RequireRole roles={['direction']}><ClasseForm /></RequireRole>} />
        <Route path="/classes/passage" element={<RequireRole roles={['direction']}><PassageClasseSuperieure /></RequireRole>} />
        <Route path="/classes/:id" element={<RequireRole roles={['direction']}><ClasseDetail /></RequireRole>} />
        <Route path="/annees-scolaires" element={<RequireRole roles={['direction']}><AnneesScolaires /></RequireRole>} />
        <Route path="/annees-scolaires/nouveau" element={<RequireRole roles={['direction']}><AnneeScolaireForm /></RequireRole>} />
        <Route path="/annees-scolaires/:id" element={<RequireRole roles={['direction']}><AnneeScolaireDetail /></RequireRole>} />
        <Route path="/notes" element={<SaisieNotes />} />
        <Route path="/presences" element={<Presences />} />
        <Route path="/paiements" element={<RequireRole roles={['direction']}><Paiements /></RequireRole>} />
        <Route path="/parametres" element={<RequireRole roles={['direction']}><Parametres /></RequireRole>} />
        <Route path="/comptabilite" element={<RequireRole roles={['direction']}><Comptabilite /></RequireRole>} />
        <Route path="/examens-nationaux" element={<RequireRole roles={['direction']}><CandidatsCM2 /></RequireRole>} />
        <Route path="/emploi-du-temps" element={<EmploiDuTemps />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}