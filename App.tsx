
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  PlusCircle,
  LogOut,
  Shield,
  LayoutDashboard,
  Users as UsersIcon,
  Key
} from 'lucide-react';

import Home from './pages/Home';
import NewOperative from './pages/NewOperative';
import Statistics from './pages/Statistics';
import Admin from './pages/Admin';
import OperativeDetails from './pages/OperativeDetails';
import Login from './pages/Login';
import UserProfile from './pages/UserProfile';

import { Operative, User, CatalogEntry } from './types';
import { OPERATIVE_TYPES, COLONIA_CATALOG as DEFAULT_COLONIES } from './constants';
import { removeAccents } from './utils';

const App: React.FC = () => {
  const [operatives, setOperatives] = useState<Operative[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [opTypes, setOpTypes] = useState<string[]>([]);
  const [coloniaCatalog, setColoniaCatalog] = useState<CatalogEntry[]>([]);

  useEffect(() => {
    const savedOps = localStorage.getItem('ixta_operatives');
    if (savedOps) setOperatives(JSON.parse(savedOps));
    
    const savedTypes = localStorage.getItem('ixta_full_op_types');
    if (savedTypes) setOpTypes(JSON.parse(savedTypes));
    else setOpTypes(OPERATIVE_TYPES);

    const savedColonies = localStorage.getItem('ixta_colonia_catalog');
    if (savedColonies) setColoniaCatalog(JSON.parse(savedColonies));
    else setColoniaCatalog(DEFAULT_COLONIES);

    const savedUsers = localStorage.getItem('ixta_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const initialUsers: User[] = [
        { id: '1', fullName: 'ADMINISTRADOR PRINCIPAL', username: 'admin', password: 'adm123', role: 'ADMIN' },
        { id: 'u1', fullName: 'DIRECTOR ALPHA', username: 'alpha', password: '123', role: 'DIRECTOR' },
        { id: 'u2', fullName: 'DIRECTOR ISIS', username: 'isis', password: '123', role: 'DIRECTOR' },
        { id: 'u3', fullName: 'DIRECTOR DELTA', username: 'delta', password: '123', role: 'DIRECTOR' },
        { id: 'u4', fullName: 'REGIONAL POSEIDON', username: 'poseidon', password: '123', role: 'REGIONAL', assignedRegion: 'REGION 1' },
        { id: 'u5', fullName: 'REGIONAL AGUILA', username: 'aguila', password: '123', role: 'REGIONAL', assignedRegion: 'REGION 2' },
        { id: 'u6', fullName: 'REGIONAL EFESTO', username: 'efesto', password: '123', role: 'REGIONAL', assignedRegion: 'REGION 3' },
        { id: 'u7', fullName: 'REGIONAL HERMES', username: 'hermes', password: '123', role: 'REGIONAL', assignedRegion: 'REGION 4' },
        { id: 'u8', fullName: 'REGIONAL LIBRA', username: 'libra', password: '123', role: 'REGIONAL', assignedRegion: 'REGION 5' },
        { id: 'u9', fullName: 'REGIONAL LINCE', username: 'lince', password: '123', role: 'REGIONAL', assignedRegion: 'REGION 6' },
        { id: 'u10', fullName: 'REGIONAL CRATOS', username: 'cratos', password: '123', role: 'REGIONAL', assignedRegion: 'REGION 7' },
        { id: 'u11', fullName: 'JEFE ANUBIS', username: 'anubis', password: '123', role: 'JEFE_AGRUPAMIENTO', isAgrupamiento: true },
        { id: 'u12', fullName: 'JEFE CONDOR', username: 'condor', password: '123', role: 'JEFE_AGRUPAMIENTO', isAgrupamiento: true },
      ];
      setUsers(initialUsers);
      localStorage.setItem('ixta_users', JSON.stringify(initialUsers));
    }

    const savedUser = localStorage.getItem('ixta_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    localStorage.setItem('ixta_operatives', JSON.stringify(operatives));
  }, [operatives]);

  useEffect(() => {
    localStorage.setItem('ixta_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (opTypes.length > 0) localStorage.setItem('ixta_full_op_types', JSON.stringify(opTypes));
  }, [opTypes]);

  useEffect(() => {
    if (coloniaCatalog.length > 0) localStorage.setItem('ixta_colonia_catalog', JSON.stringify(coloniaCatalog));
  }, [coloniaCatalog]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ixta_user');
  };

  const addOperative = (op: Operative) => {
    setOperatives(prev => [op, ...prev]);
  };

  const updateOperative = (id: string, updates: Partial<Operative>) => {
    setOperatives(prev => prev.map(op => op.id === id ? { ...op, ...updates } : op));
  };

  const deleteOperative = (id: string) => {
    setOperatives(prev => prev.filter(op => op.id !== id));
  };

  const updatePassword = (newPassword: string) => {
    if (!user) return;
    const updatedUsers = users.map(u => u.id === user.id ? { ...u, password: newPassword } : u);
    setUsers(updatedUsers);
    const updatedSelf = { ...user, password: newPassword };
    setUser(updatedSelf);
    localStorage.setItem('ixta_user', JSON.stringify(updatedSelf));
    alert('CONTRASEÑA ACTUALIZADA CORRECTAMENTE');
  };

  if (!user) {
    return <Login users={users} onLogin={(u) => { setUser(u); localStorage.setItem('ixta_user', JSON.stringify(u)); }} />;
  }

  // Permission Checks
  const canViewDashboard = ['ADMIN', 'DIRECTOR', 'REGIONAL', 'SHIFT_LEADER', 'JEFE_AGRUPAMIENTO', 'ANALISTA'].includes(user.role);
  const canViewStats = ['ADMIN', 'DIRECTOR', 'REGIONAL', 'JEFE_AGRUPAMIENTO', 'ANALISTA'].includes(user.role);
  const canAddOp = !['DIRECTOR', 'ANALISTA'].includes(user.role);
  const canManageUsers = user.role === 'ADMIN';
  const canManageCatalog = ['ADMIN', 'ANALISTA'].includes(user.role);
  const canUpdatePassword = ['ADMIN', 'DIRECTOR', 'REGIONAL', 'JEFE_AGRUPAMIENTO', 'ANALISTA'].includes(user.role);

  return (
    <Router>
      <div className="flex flex-col min-h-screen pb-24 md:pb-0 md:pl-20 bg-slate-950 text-slate-100 uppercase">
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-bold">OPERATIVOS</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded uppercase">
              {user.role.replace('_', ' ')}
            </span>
          </div>
        </header>

        <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-20 bg-slate-900 border-t md:border-t-0 md:border-r border-slate-800 flex md:flex-col items-center z-50">
          <div className="hidden md:flex items-center justify-center py-6 w-full">
            <Shield className="w-10 h-10 text-blue-500" />
          </div>
          
          <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible no-scrollbar w-full md:h-full items-center px-2 py-2 md:py-0 gap-1 md:gap-4 scroll-smooth">
            {canViewDashboard ? (
              <NavLink to="/" icon={<LayoutDashboard />} label="PANEL" />
            ) : (
              <NavLink to="/operatives" icon={<ClipboardList />} label="HISTORIAL" />
            )}

            {canViewStats && (
              <NavLink to="/stats" icon={<BarChart3 />} label="ESTADISTICAS" />
            )}

            {canAddOp && (
              <NavLink to="/new" icon={<PlusCircle />} label="NUEVO" />
            )}

            {canViewDashboard && (
              <NavLink to="/operatives" icon={<ClipboardList />} label="LISTA" />
            )}

            {(canManageUsers || canManageCatalog) && (
              <NavLink to="/admin" icon={<Settings />} label="ADMIN" />
            )}

            {canUpdatePassword && (
              <NavLink to="/profile" icon={<Key />} label="CONTRASEÑA" />
            )}

            <button 
              onClick={handleLogout} 
              className="flex flex-col items-center justify-center shrink-0 w-20 h-16 md:w-16 md:h-16 rounded-xl text-red-500 hover:bg-red-500/10 transition-all md:mt-auto md:mb-6"
            >
              <LogOut className="w-6 h-6" />
              <span className="text-[9px] uppercase font-black tracking-tighter mt-1">SALIR</span>
            </button>
          </div>
        </nav>

        <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
          <Routes>
            <Route path="/" element={canViewDashboard ? <Home operatives={operatives} user={user} /> : <Navigate to="/operatives" />} />
            <Route path="/new" element={canAddOp ? <NewOperative operatives={operatives} addOperative={addOperative} opTypes={opTypes} user={user} coloniaCatalog={coloniaCatalog} /> : <Navigate to="/" />} />
            <Route path="/operatives" element={<Home operatives={operatives} showAll={true} user={user} />} />
            <Route path="/stats" element={canViewStats ? <Statistics operatives={operatives} opTypes={opTypes} /> : <Navigate to="/" />} />
            <Route path="/admin" element={(canManageUsers || canManageCatalog) ? <Admin opTypes={opTypes} setOpTypes={setOpTypes} operatives={operatives} users={users} setUsers={setUsers} currentUserRole={user.role} coloniaCatalog={coloniaCatalog} setColoniaCatalog={setColoniaCatalog} /> : <Navigate to="/" />} />
            <Route path="/operative/:id" element={<OperativeDetails operatives={operatives} updateOperative={updateOperative} role={user.role} userId={user.id} deleteOperative={deleteOperative} coloniaCatalog={coloniaCatalog} />} />
            <Route path="/profile" element={canUpdatePassword ? <UserProfile user={user} updatePassword={updatePassword} /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const NavLink: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center shrink-0 w-20 h-16 md:w-16 md:h-16 rounded-xl transition-all ${isActive ? 'bg-blue-600/20 text-blue-500' : 'text-slate-400 hover:bg-slate-800'}`}
    >
      {/* Cast to any to bypass type error for Lucide icon cloning */}
      {React.cloneElement(icon as any, { className: "w-6 h-6" })}
      <span className="text-[9px] uppercase font-black tracking-tighter mt-1">{label}</span>
    </Link>
  );
};

export default App;
