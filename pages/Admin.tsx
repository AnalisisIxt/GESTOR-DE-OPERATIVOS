
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Download, 
  Database, 
  ShieldAlert, 
  Users as UsersIcon, 
  UserPlus,
  ArrowRight,
  Edit2,
  Save,
  X,
  MapPin,
  CheckCircle2,
  Building2,
  Calendar,
  Filter
} from 'lucide-react';
import { Operative, User, Role, CatalogEntry } from '../types';
import { REGIONS, REGION_QUADRANTS } from '../constants';
import { removeAccents } from '../utils';

interface AdminProps {
  opTypes: string[];
  setOpTypes: (val: string[]) => void;
  corporationsCatalog: string[];
  setCorporationsCatalog: (val: string[]) => void;
  operatives: Operative[];
  users: User[];
  setUsers: (updater: (prev: User[]) => User[]) => void;
  currentUserRole: Role;
  coloniaCatalog: CatalogEntry[];
  setColoniaCatalog: (val: CatalogEntry[]) => void;
}

const ROLES: Role[] = ['ADMIN', 'DIRECTOR', 'REGIONAL', 'JEFE_DE_TURNO', 'JEFE_DE_CUADRANTE', 'PATRULLERO', 'JEFE_AGRUPAMIENTO', 'ANALISTA'];

const Admin: React.FC<AdminProps> = ({ 
  opTypes, setOpTypes, 
  corporationsCatalog, setCorporationsCatalog,
  operatives, users, setUsers, 
  currentUserRole, coloniaCatalog, setColoniaCatalog 
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'users' | 'export' | 'colonies' | 'corporations'>('users');
  const [newType, setNewType] = useState("");
  const [newCorp, setNewCorp] = useState("");
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Colony Form State
  const [newColony, setNewColony] = useState<CatalogEntry>({ region: REGIONS[0], quadrant: '', colony: '' });
  const [colonyFilterRegion, setColonyFilterRegion] = useState("TODOS");

  // User Form State
  const [newUser, setNewUser] = useState<Partial<User>>({
    fullName: '',
    username: '',
    password: '',
    role: 'PATRULLERO',
    assignedRegion: REGIONS[0],
    isAgrupamiento: false
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    if (currentUserRole === 'ANALISTA') {
      setActiveTab('catalog');
    }
  }, [currentUserRole]);

  const addUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.fullName || !newUser.username || !newUser.password) return;

    const userToAdd: User = {
      id: Math.random().toString(36).substring(2, 11),
      fullName: removeAccents(newUser.fullName!),
      username: newUser.username!, 
      password: newUser.password!, 
      role: newUser.role!,
      assignedRegion: ['ADMIN', 'DIRECTOR', 'ANALISTA'].includes(newUser.role!) ? undefined : newUser.assignedRegion,
      isAgrupamiento: newUser.isAgrupamiento
    };

    setUsers(prev => [...prev, userToAdd]);
    setNewUser({
      fullName: '',
      username: '',
      password: '',
      role: 'PATRULLERO',
      assignedRegion: REGIONS[0],
      isAgrupamiento: false
    });
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({ ...user });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveEditUser = () => {
    if (!editingUser) return;
    setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...newUser as User, fullName: removeAccents(newUser.fullName || '') } : u));
    setEditingUser(null);
    setNewUser({ fullName: '', username: '', password: '', role: 'PATRULLERO', assignedRegion: REGIONS[0], isAgrupamiento: false });
  };

  const deleteUser = (id: string) => {
    if (confirm('¿ELIMINAR ESTE USUARIO DEFINITIVAMENTE?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  // Catalog Management
  const addType = () => {
    if (newType && !opTypes.includes(removeAccents(newType))) {
      setOpTypes([...opTypes, removeAccents(newType)]);
      setNewType("");
    }
  };

  const removeType = (index: number) => {
    const newList = [...opTypes];
    newList.splice(index, 1);
    setOpTypes(newList);
  };

  // Corporation Management
  const addCorporation = () => {
    if (newCorp && !corporationsCatalog.includes(removeAccents(newCorp))) {
      setCorporationsCatalog([...corporationsCatalog, removeAccents(newCorp)]);
      setNewCorp("");
    }
  };

  const removeCorporation = (index: number) => {
    const newList = [...corporationsCatalog];
    newList.splice(index, 1);
    setCorporationsCatalog(newList);
  };

  // Colony Management
  const addColony = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColony.colony || !newColony.quadrant) return;
    
    const entry = { ...newColony, colony: removeAccents(newColony.colony) };
    const exists = coloniaCatalog.some(c => c.colony === entry.colony && c.region === entry.region);
    
    if (exists) {
      alert("ESTA COLONIA YA EXISTE EN ESTA REGION");
      return;
    }

    setColoniaCatalog([...coloniaCatalog, entry]);
    setNewColony({ ...newColony, colony: '' });
  };

  const removeColony = (col: string, reg: string) => {
    if (confirm(`¿ELIMINAR LA COLONIA ${col}?`)) {
      setColoniaCatalog(coloniaCatalog.filter(c => !(c.colony === col && c.region === reg)));
    }
  };

  const filteredColonies = useMemo(() => {
    let list = [...coloniaCatalog].sort((a, b) => a.colony.localeCompare(b.colony));
    if (colonyFilterRegion !== "TODOS") {
      list = list.filter(c => c.region === colonyFilterRegion);
    }
    return list;
  }, [coloniaCatalog, colonyFilterRegion]);

  const moveItem = (list: any[], setList: (v: any[]) => void, index: number, direction: 'up' | 'down') => {
    const newList = [...list];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newList.length) {
      [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
      setList(newList);
    }
  };

  const downloadCSV = () => {
    if (!dateRange.start || !dateRange.end) {
      alert("POR FAVOR SELECCIONE EL RANGO DE FECHAS");
      return;
    }

    const startLimit = new Date(`${dateRange.start}T09:00:00`);
    const endLimit = new Date(`${dateRange.end}T09:00:00`);
    endLimit.setDate(endLimit.getDate() + 1);

    let list = operatives.filter(op => {
      const opDateTime = new Date(`${op.startDate}T${op.startTime}:00`);
      return opDateTime >= startLimit && opDateTime < endLimit;
    });

    if (list.length === 0) {
      alert("NO SE ENCONTRARON REGISTROS EN EL PERIODO SELECCIONADO");
      return;
    }

    const headers = [
      "ID", "TIPO", "ESTATUS DETALLADO", "ESTATUS", "FECHA", "HORA INICIO", "HORA CIERRE", 
      "REGION", "CUADRANTE", "COLONIA", "CALLE", "COORDENADAS", "REPRESENTANTE", 
      "TELEFONO_REP", "PARTICIPANTES", "REVISIONES_PERSONAS", 
      "REVISIONES_TRANSPORTE_PUBLICO", "REVISIONES_PARTICULARES", "REVISIONES_MOTOCICLETAS",
      "DETENIDOS", "PETICIONES_VECINALES"
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = removeAccents(String(val)).trim();
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = list.map(op => [
      escapeCSV(op.id), escapeCSV(op.type), escapeCSV(op.conclusion?.result || op.specificType || 'EN DESARROLLO'), 
      escapeCSV(op.status), escapeCSV(op.startDate.split('-').reverse().join('/')), 
      escapeCSV(op.startTime), escapeCSV(op.conclusion?.concludedAt || '--:--'), 
      escapeCSV(op.region), escapeCSV(op.quadrant), escapeCSV(op.location.colony), 
      escapeCSV(op.location.street), escapeCSV(`${op.location.latitude.toFixed(6)}, ${op.location.longitude.toFixed(6)}`), 
      escapeCSV(op.conclusion?.reunionDetails?.representativeName || ''),
      escapeCSV(op.conclusion?.reunionDetails?.phone || ''),
      escapeCSV(op.conclusion?.reunionDetails?.participantCount || ''),
      escapeCSV(op.conclusion?.peopleChecked || 0), 
      escapeCSV(op.conclusion?.publicTransportChecked || 0),
      escapeCSV(op.conclusion?.privateVehiclesChecked || 0),
      escapeCSV(op.conclusion?.motorcyclesChecked || 0),
      escapeCSV(op.conclusion?.detaineesCount || 0), 
      escapeCSV(op.conclusion?.reunionDetails?.petitions ? op.conclusion.reunionDetails.petitions.replace(/\n/g, ' ') : '')
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `OPERATIVOS_IXTAPALUCA_${dateRange.start}_AL_${dateRange.end}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canManageUsers = currentUserRole === 'ADMIN';

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20 uppercase">
      <header>
        <h2 className="text-3xl font-black uppercase">PANEL DE ADMINISTRACION</h2>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {canManageUsers && (
            <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon />} label="USUARIOS" />
          )}
          <TabButton active={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')} icon={<ShieldAlert />} label="TIPOS OPERATIVO" />
          <TabButton active={activeTab === 'corporations'} onClick={() => setActiveTab('corporations')} icon={<Building2 />} label="CORPORACIONES" />
          <TabButton active={activeTab === 'colonies'} onClick={() => setActiveTab('colonies')} icon={<MapPin />} label="COLONIAS" />
          <TabButton active={activeTab === 'export'} onClick={() => setActiveTab('export')} icon={<Database />} label="DATOS" />
        </div>
      </header>

      {activeTab === 'users' && canManageUsers && (
        <div className="space-y-6 animate-in fade-in duration-300 uppercase">
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl uppercase">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
              {editingUser ? <Edit2 className="w-6 h-6 text-emerald-500" /> : <UserPlus className="w-6 h-6 text-blue-500" />}
              <h3 className="font-black text-lg uppercase">{editingUser ? `EDITANDO: ${editingUser.username}` : 'REGISTRAR NUEVO USUARIO'}</h3>
              {editingUser && (
                <button onClick={() => { setEditingUser(null); setNewUser({ fullName: '', username: '', password: '', role: 'PATRULLERO', assignedRegion: REGIONS[0], isAgrupamiento: false }); }} className="ml-auto text-slate-500 hover:text-white p-2">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <form onSubmit={editingUser ? (e) => { e.preventDefault(); saveEditUser(); } : addUser} className="space-y-4 uppercase">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 uppercase">
                <label className="block">
                  <span className="text-xs text-slate-500 uppercase font-bold">NOMBRE COMPLETO</span>
                  <input 
                    type="text" required
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-white uppercase"
                    value={newUser.fullName}
                    onChange={e => setNewUser({...newUser, fullName: removeAccents(e.target.value)})}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500 uppercase font-bold">NOMBRE DE CUENTA</span>
                  <input 
                    type="text" required
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-white"
                    value={newUser.username}
                    onChange={e => setNewUser({...newUser, username: e.target.value})}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 uppercase">
                <label className="block">
                  <span className="text-xs text-slate-500 uppercase font-bold">CONTRASEÑA</span>
                  <input 
                    type="text" required
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-white"
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500 uppercase font-bold">TIPO DE USUARIO</span>
                  <select 
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-white uppercase"
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                  >
                    {ROLES.map(r => <option key={r} value={r} className="bg-slate-900 uppercase">{r.replace('_', ' ')}</option>)}
                  </select>
                </label>
              </div>

              {!['ADMIN', 'DIRECTOR', 'ANALISTA'].includes(newUser.role!) && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4 animate-in slide-in-from-top-2 uppercase">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 uppercase">
                    <label className="block">
                      <span className="text-xs text-slate-500 uppercase font-bold">REGION ASIGNADA</span>
                      <select 
                        className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-white uppercase"
                        value={newUser.assignedRegion}
                        onChange={e => setNewUser({...newUser, assignedRegion: e.target.value})}
                      >
                        {REGIONS.filter(r => r.startsWith('REGION')).map(r => <option key={r} value={r} className="bg-slate-900 uppercase">{r}</option>)}
                      </select>
                    </label>
                    <label className="flex items-center gap-3 mt-6 cursor-pointer group uppercase">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={newUser.isAgrupamiento}
                          onChange={e => setNewUser({...newUser, isAgrupamiento: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </div>
                      <span className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors uppercase">¿ES AGRUPAMIENTO? (MUNICIPIO COMPLETO)</span>
                    </label>
                  </div>
                </div>
              )}

              <button type="submit" className={`w-full ${editingUser ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] uppercase`}>
                {editingUser ? <><Save className="w-5 h-5" /> GUARDAR CAMBIOS</> : <><Plus className="w-5 h-5" /> CREAR USUARIO</>}
              </button>
            </form>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl uppercase">
            <h3 className="font-black text-lg border-b border-slate-800 pb-4 mb-4 uppercase">USUARIOS ACTIVOS</h3>
            <div className="space-y-3 uppercase">
              {users.map(u => (
                <div key={u.id} className={`p-4 bg-slate-950 rounded-xl border ${editingUser?.id === u.id ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-slate-800'} flex items-center justify-between group hover:border-slate-700 transition-all uppercase`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 uppercase">
                      <p className="font-bold text-sm text-white uppercase">{removeAccents(u.fullName)}</p>
                      <span className="text-[8px] font-black px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded border border-blue-500/20 uppercase">{u.role}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-1 uppercase">@{u.username} • {u.isAgrupamiento ? 'MUNICIPIO COMPLETO' : (removeAccents(u.assignedRegion || 'GLOBAL'))}</p>
                  </div>
                  <div className="flex items-center gap-1 uppercase">
                    <button 
                      onClick={() => startEditUser(u)} 
                      className={`p-2 transition-colors uppercase ${editingUser?.id === u.id ? 'text-emerald-500' : 'text-slate-500 hover:text-emerald-500'}`}
                      title="EDITAR USUARIO"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    {u.username !== 'admin' && (
                      <button 
                        onClick={() => deleteUser(u.id)} 
                        className="p-2 text-slate-500 hover:text-red-500 transition-colors uppercase"
                        title="ELIMINAR USUARIO"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'catalog' && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl animate-in fade-in uppercase">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4 uppercase">
            <ShieldAlert className="w-6 h-6 text-yellow-500" />
            <h3 className="font-black text-lg uppercase">TIPOS DE OPERATIVO</h3>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2 uppercase">
              <input 
                type="text" 
                placeholder="NOMBRE DEL OPERATIVO..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-white uppercase"
                value={newType}
                onChange={e => setNewType(removeAccents(e.target.value))}
                onKeyDown={e => e.key === 'Enter' && addType()}
              />
              <button onClick={addType} className="bg-blue-600 p-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg active:scale-95 uppercase">
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar uppercase">
              {opTypes.map((t, index) => (
                <div key={`${t}-${index}`} className="group p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all uppercase">
                  <span className="text-xs font-bold uppercase text-white">{removeAccents(t)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase">
                    <button onClick={() => moveItem(opTypes, setOpTypes, index, 'up')} disabled={index === 0} className="p-1.5 text-slate-500 hover:text-blue-500 disabled:opacity-10"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveItem(opTypes, setOpTypes, index, 'down')} disabled={index === opTypes.length - 1} className="p-1.5 text-slate-500 hover:text-blue-500 disabled:opacity-10"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => removeType(index)} className="p-1.5 text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'corporations' && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl animate-in fade-in uppercase">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4 uppercase">
            <Building2 className="w-6 h-6 text-emerald-500" />
            <h3 className="font-black text-lg uppercase">CATALOGO DE CORPORACIONES</h3>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2 uppercase">
              <input 
                type="text" 
                placeholder="NOMBRE DE LA CORPORACION (EJ. SEDENA)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-white uppercase"
                value={newCorp}
                onChange={e => setNewCorp(removeAccents(e.target.value))}
                onKeyDown={e => e.key === 'Enter' && addCorporation()}
              />
              <button onClick={addCorporation} className="bg-emerald-600 p-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg active:scale-95 uppercase">
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar uppercase">
              {corporationsCatalog.map((corp, index) => (
                <div key={`${corp}-${index}`} className="group p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all uppercase">
                  <span className="text-xs font-bold uppercase text-white">{removeAccents(corp)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase">
                    <button onClick={() => moveItem(corporationsCatalog, setCorporationsCatalog, index, 'up')} disabled={index === 0} className="p-1.5 text-slate-500 hover:text-blue-500 disabled:opacity-10"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveItem(corporationsCatalog, setCorporationsCatalog, index, 'down')} disabled={index === corporationsCatalog.length - 1} className="p-1.5 text-slate-500 hover:text-blue-500 disabled:opacity-10"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => removeCorporation(index)} className="p-1.5 text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {corporationsCatalog.length === 0 && (
                <p className="text-center p-8 text-slate-500 text-xs italic">NO HAY CORPORACIONES REGISTRADAS</p>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'colonies' && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-in fade-in space-y-6 uppercase">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4 uppercase">
            <MapPin className="w-6 h-6 text-blue-500" />
            <h3 className="font-black text-lg uppercase">GESTIÓN DE COLONIAS</h3>
          </div>
          
          <form onSubmit={addColony} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 uppercase">
            <label className="block">
              <span className="text-[10px] text-slate-500 font-black uppercase">REGION</span>
              <select 
                className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white uppercase"
                value={newColony.region}
                onChange={e => setNewColony({...newColony, region: e.target.value, quadrant: ''})}
              >
                {REGIONS.filter(r => r.startsWith('REGION')).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] text-slate-500 font-black uppercase">CUADRANTE</span>
              <select 
                className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white uppercase"
                value={newColony.quadrant}
                onChange={e => setNewColony({...newColony, quadrant: e.target.value})}
                required
              >
                <option value="">-- SELECCIONAR --</option>
                {(REGION_QUADRANTS[newColony.region] || []).map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] text-slate-500 font-black uppercase">NOMBRE COLONIA</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  required
                  className="mt-1 flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white uppercase outline-none"
                  value={newColony.colony}
                  onChange={e => setNewColony({...newColony, colony: e.target.value})}
                  placeholder="NOMBRE..."
                />
                <button type="submit" className="mt-1 bg-blue-600 p-3 rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </label>
          </form>

          <div className="space-y-4 uppercase">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">FILTRAR POR REGION</span>
              </div>
              <select 
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] font-black text-white uppercase"
                value={colonyFilterRegion}
                onChange={e => setColonyFilterRegion(e.target.value)}
              >
                <option value="TODOS">TODAS LAS REGIONES</option>
                {REGIONS.filter(r => r.startsWith('REGION')).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar uppercase">
              {filteredColonies.map((c, i) => (
                <div key={`${c.colony}-${c.region}-${i}`} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between group hover:border-slate-700 transition-all uppercase">
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black text-blue-500 uppercase">{c.region} • C-{c.quadrant}</p>
                    <p className="text-xs font-bold text-white truncate uppercase">{c.colony}</p>
                  </div>
                  <button onClick={() => removeColony(c.colony, c.region)} className="p-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all uppercase">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {filteredColonies.length === 0 && (
                <p className="col-span-full text-center p-12 text-slate-500 text-xs italic uppercase">NO HAY COLONIAS PARA MOSTRAR</p>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'export' && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl animate-in fade-in uppercase">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4 uppercase">
            <Database className="w-6 h-6 text-blue-500" />
            <h3 className="font-black text-lg uppercase">DESCARGAR INFORMES</h3>
          </div>

          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                RANGO DEL INFORME (TURNO 09:00 - 09:00)
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] text-slate-600 font-black uppercase">FECHA INICIO</span>
                  <input 
                    type="date" 
                    className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-600"
                    value={dateRange.start}
                    onChange={e => setDateRange({...dateRange, start: e.target.value})}
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] text-slate-600 font-black uppercase">FECHA FIN</span>
                  <input 
                    type="date" 
                    className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-600"
                    value={dateRange.end}
                    onChange={e => setDateRange({...dateRange, end: e.target.value})}
                  />
                </label>
             </div>
             <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic border-t border-slate-800/50 pt-2 uppercase">
                EL INFORME INCLUIRA TODOS LOS OPERATIVOS REGISTRADOS DESDE LAS 09:00 AM DE LA FECHA DE INICIO HASTA LAS 08:59 AM DEL DIA SIGUIENTE A LA FECHA DE FIN.
             </p>
          </div>

          <button onClick={downloadCSV} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all uppercase">
            <Download className="w-5 h-5" /> GENERAR ARCHIVO EXCEL (CSV)
          </button>
        </section>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border uppercase ${active ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
  >
    {React.cloneElement(icon as any, { className: "w-4 h-4" })}
    {label}
  </button>
);

export default Admin;
