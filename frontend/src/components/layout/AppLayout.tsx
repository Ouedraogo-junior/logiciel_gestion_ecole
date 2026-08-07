import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar/Sidebar';

export default function AppLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto p-8 bg-ivoire">
        <Outlet />
      </main>
    </div>
  );
}