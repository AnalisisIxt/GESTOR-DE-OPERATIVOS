
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
  Key,
  CloudCheck,
  RefreshCw
} from 'lucide-react';

import Home from './pages/Home';
import NewOperative from './pages/NewOperative';
import Statistics from './pages/Statistics';
import Admin from './pages/Admin';
import OperativeDetails from './pages/OperativeDetails';
import Login from './pages/Login';
import UserProfile from './pages/UserProfile';

import { Operative, User, CatalogEntry } from './types';
import { 
  OPERATIVE_TYPES, 
  COLONIA_CATALOG as DEFAULT_COLONIES, 
  CORPORATIONS as DEFAULT_CORPORATIONS,
  INITIAL_CRIMES,
  INITIAL_FAULTS,
  RANKS as DEFAULT_RANKS,
  INITIAL_MEETING_TOPICS
} from './constants';
import { api } from './lib/api';

const App: React.FC = () => {
  const [operatives, setOperatives] = useState<Operative[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [opTypes, setOpTypes] = useState<string[]>([]);
  const [coloniaCatalog, setColoniaCatalog] = useState<CatalogEntry[]>([]);
  const [corporationsCatalog, setCorporationsCatalog] = useState<string[]>([]);
  const [crimesCatalog, setCrimesCatalog] = useState<string[]>([]);
  const [faultsCatalog, setFaultsCatalog] = useState<string[]>([]);
  const [ranksCatalog, setRanksCatalog] = useState<string[]>([]);
  const [meetingTopicsCatalog, setMeetingTopicsCatalog] = useState<string[]>([]);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const [ops, u, types, colonies, corps, crimes, faults, ranks, topics] = await Promise.all([
          api.getOperatives(),
          api.getUsers(),
          api.getCatalog('ixta_full_op_types', OPERATIVE_TYPES),
          api.getCatalog('ixta_colonia_catalog', DEFAULT_COLONIES),
          api.getCatalog('ixta_corporations_catalog', DEFAULT_CORPORATIONS),
          api.getCatalog('ixta_crimes_catalog', INITIAL_CRIMES),
          api.getCatalog('ixta_faults_catalog', INITIAL_FAULTS),
          api.getCatalog('ixta_ranks_catalog', DEFAULT_RANKS),
          api.getCatalog('ixta_meeting_topics_catalog', INITIAL_MEETING_TOPICS)
        ]);

        setOperatives(ops);
        setOpTypes(types);
        setColoniaCatalog(colonies);
        setCorporationsCatalog(corps);
        setCrimesCatalog(crimes);
        setFaultsCatalog(faults);
        setRanksCatalog(ranks);
        setMeetingTopicsCatalog(topics);

        if (u.length === 0) {
          const initialUsers: User[] = [
            { id: '1', fullName: 'ADMINISTRADOR PRINCIPAL', username: 'admin', password: 'adm123', role: 'ADMIN' },
            { id: 'u1', fullName: 'DIRECTOR ALPHA', username: 'alpha', password: '123', role: 'DIRECTOR' }
          ];
          setUsers(initialUsers);
          await api.saveUsers(initialUsers);
        } else {
          setUsers(u);
        }

        const savedUser = localStorage.getItem('ixta_user');
        if (savedUser) setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error("Error cargando base de datos:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ixta_user');
  };

  const addOperative = async (op: Operative) => {
    setIsSyncing(true);
    await api.saveOperative(op);
    setOperatives(prev => [op, ...prev]);
    setIsSyncing(false);
  };

  const updateOperative = async (id: string, updates: Partial<Operative>) => {
    setIsSyncing(true);
    await api.updateOperative(id, updates);
    setOperatives(prev => prev.map(op => op.id === id ? { ...op, ...updates } : op));
    setIsSyncing(false);
  };

  const deleteOperative = async (id: string) => {
    setIsSyncing(true);
    await api.deleteOperative(id);
    setOperatives(prev => prev.filter(op => op.id !== id));
    setIsSyncing(false);
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) return;
    setIsSyncing(true);
    const updatedUsers = users.map(u => u.id === user.id ? { ...u, password: newPassword } : u);
    setUsers(updatedUsers);
    await api.saveUsers(updatedUsers);
    const updatedSelf = { ...user, password: newPassword };
    setUser(updatedSelf);
    localStorage.setItem('ixta_user', JSON.stringify(updatedSelf));
    setIsSyncing(false);
    alert('CONTRASEÑA ACTUALIZADA CORRECTAMENTE');
  };

  const handleSetUsers = async (updater: (prev: User[]) => User[]) => {
    setUsers(prev => {
      const updated = updater(prev);
      api.saveUsers(updated);
      return updated;
    });
  };

  const handleSetCatalog = async (key: string, data: string[], setter: (v: string[]) => void) => {
    setter(data);
    await api.saveCatalog(key, data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-black text-xs tracking-widest uppercase">CONECTANDO AL BACKEND...</p>
      </div>
    );
  }

  return (
    <Router>
      {!user ? (
        <Login users={users} onLogin={(u) => { setUser(u); localStorage.setItem('ixta_user', JSON.stringify(u)); }} />
      ) : (
        <div className="flex flex-col min-h-screen pb-24 md:pb-0 md:pl-20 bg-slate-950 text-slate-100 uppercase">
          <header className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-500" />
              <div className="hidden md:block">
                 <h1 className="text-xl font-bold">OPERATIVOS IXTAPALUCA</h1>
                 <p className="text-[10px] text-slate-500 font-bold uppercase">{user.role}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 rounded-full border border-slate-800">
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">SINCRONIZANDO</span>
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">GUARDADO</span>
                  </>
                )}
              </div>
            </div>
          </header>

          <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-20 bg-slate-900 border-t md:border-t-0 md:border-r border-slate-800 flex md:flex-col items-center z-50">
            <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible no-scrollbar w-full md:h-full items-center px-2 py-2 md:py-0 gap-1 md:gap-4">
              <NavLink to="/" icon={<LayoutDashboard />} label="PANEL" />
              <NavLink to="/stats" icon={<BarChart3 />} label="STATS" />
              <NavLink to="/new" icon={<PlusCircle />} label="NUEVO" />
              <NavLink to="/operatives" icon={<ClipboardList />} label="HISTORIAL" />
              {user.role === 'ADMIN' && <NavLink to="/admin" icon={<Settings />} label="ADMIN" />}
              <NavLink to="/profile" icon={<Key />} label="PASS" />
              <button onClick={handleLogout} className="flex flex-col items-center justify-center shrink-0 w-20 h-16 md:w-16 md:h-16 rounded-xl text-red-500 hover:bg-red-500/10 transition-all md:mt-auto">
                <LogOut className="w-6 h-6" />
                <span className="text-[9px] uppercase font-black tracking-tighter mt-1">SALIR</span>
              </button>
            </div>
          </nav>

          <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
            <Routes>
              <Route path="/" element={<Home operatives={operatives} user={user} />} />
              <Route path="/new" element={<NewOperative operatives={operatives} addOperative={addOperative} opTypes={opTypes} user={user} coloniaCatalog={coloniaCatalog} corporationsCatalog={corporationsCatalog} ranksCatalog={ranksCatalog} meetingTopicsCatalog={meetingTopicsCatalog} />} />
              <Route path="/operatives" element={<Home operatives={operatives} showAll={true} user={user} />} />
              <Route path="/stats" element={<Statistics operatives={operatives} opTypes={opTypes} />} />
              <Route path="/admin" element={<Admin 
                opTypes={opTypes} setOpTypes={(d) => handleSetCatalog('ixta_full_op_types', d, setOpTypes)} 
                corporationsCatalog={corporationsCatalog} setCorporationsCatalog={(d) => handleSetCatalog('ixta_corporations_catalog', d, setCorporationsCatalog)}
                crimesCatalog={crimesCatalog} setCrimesCatalog={(d) => handleSetCatalog('ixta_crimes_catalog', d, setCrimesCatalog)}
                faultsCatalog={faultsCatalog} setFaultsCatalog={(d) => handleSetCatalog('ixta_faults_catalog', d, setFaultsCatalog)}
                ranksCatalog={ranksCatalog} setRanksCatalog={(d) => handleSetCatalog('ixta_ranks_catalog', d, setRanksCatalog)}
                meetingTopicsCatalog={meetingTopicsCatalog} setMeetingTopicsCatalog={(d) => handleSetCatalog('ixta_meeting_topics_catalog', d, setMeetingTopicsCatalog)}
                operatives={operatives} users={users} setUsers={handleSetUsers} 
                currentUserRole={user.role} coloniaCatalog={coloniaCatalog} setColoniaCatalog={(d) => handleSetCatalog('ixta_colonia_catalog', d, setColoniaCatalog)} 
              />} />
              <Route path="/operative/:id" element={<OperativeDetails 
                operatives={operatives} updateOperative={updateOperative} role={user.role} userId={user.id} 
                deleteOperative={deleteOperative} coloniaCatalog={coloniaCatalog} 
                crimesCatalog={crimesCatalog} faultsCatalog={faultsCatalog}
              />} />
              <Route path="/profile" element={<UserProfile user={user} updatePassword={updatePassword} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      )}
    </Router>
  );
};

const NavLink: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex flex-col items-center justify-center shrink-0 w-20 h-16 md:w-16 md:h-16 rounded-xl transition-all ${isActive ? 'bg-blue-600/20 text-blue-500 shadow-inner' : 'text-slate-400 hover:bg-slate-800'}`}>
      {React.cloneElement(icon as any, { className: "w-6 h-6" })}
      <span className="text-[9px] uppercase font-black tracking-tighter mt-1">{label}</span>
    </Link>
  );
};

export default App;
