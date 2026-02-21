
import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Database, 
  ShieldAlert, 
  Users as UsersIcon, 
  Edit2,
  Save,
  X,
  MapPin,
  Building2,
  AlertTriangle,
  Gavel,
  SortAsc,
  Filter,
  Download,
  Upload,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { Operative, User, Role, CatalogEntry } from '../types';
import { REGIONS } from '../constants';
import { removeAccents } from '../utils';

interface AdminProps {
  opTypes: string[];
  setOpTypes: (val: string[]) => void;
  corporationsCatalog: string[];
  setCorporationsCatalog: (val: string[]) => void;
  crimesCatalog: string[];
  setCrimesCatalog: (val: string[]) => void;
  faultsCatalog: string[];
  setFaultsCatalog: (val: string[]) => void;
  ranksCatalog: string[];
  setRanksCatalog: (val: string[]) => void;
  meetingTopicsCatalog: string[];
  setMeetingTopicsCatalog: (val: string[]) => void;
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
  crimesCatalog, setCrimesCatalog,
  faultsCatalog, setFaultsCatalog,
  ranksCatalog, setRanksCatalog,
  meetingTopicsCatalog, setMeetingTopicsCatalog,
  operatives, users, setUsers, 
  currentUserRole, coloniaCatalog, setColoniaCatalog 
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'users' | 'colonies' | 'corporations' | 'crimes' | 'faults' | 'ranks' | 'meetingTopics'>('users');
  const [newType, setNewType] = useState("");
  const [newCorp, setNewCorp] = useState("");
  const [newCrime, setNewCrime] = useState("");
  const [newFault, setNewFault] = useState("");
  const [newRank, setNewRank] = useState("");
  const [newMeetingTopic, setNewMeetingTopic] = useState("");

  const [newColony, setNewColony] = useState<CatalogEntry>({ region: REGIONS[0], quadrant: '', colony: '' });
  const [colonyFilterRegion, setColonyFilterRegion] = useState("TODOS");

  const [newUser, setNewUser] = useState<Partial<User>>({ fullName: '', username: '', password: '', role: 'PATRULLERO', assignedRegion: REGIONS[0], isAgrupamiento: false, phoneNumber: '', payrollNumber: '' });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredColonies = useMemo(() => {
    let list = [...coloniaCatalog];
    if (colonyFilterRegion !== "TODOS") list = list.filter(c => c.region === colonyFilterRegion);
    return list.sort((a, b) => a.colony.localeCompare(b.colony));
  }, [coloniaCatalog, colonyFilterRegion]);

  const addUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.fullName || !newUser.username || !newUser.password) return;
    const userToAdd: User = { 
      id: Math.random().toString(36).substring(2, 11), 
      fullName: removeAccents(newUser.fullName!), 
      username: newUser.username!, 
      password: newUser.password!, 
      role: newUser.role!, 
      assignedRegion: newUser.assignedRegion, 
      isAgrupamiento: newUser.isAgrupamiento,
      phoneNumber: newUser.phoneNumber,
      payrollNumber: newUser.payrollNumber
    };
    setUsers(prev => [...prev, userToAdd]);
    setNewUser({ fullName: '', username: '', password: '', role: 'PATRULLERO', assignedRegion: REGIONS[0], isAgrupamiento: false, phoneNumber: '', payrollNumber: '' });
  };

  const saveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    if (!editingUser.fullName || !editingUser.username) {
      alert("EL NOMBRE Y USUARIO SON OBLIGATORIOS.");
      return;
    }

    setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
    alert("USUARIO ACTUALIZADO CORRECTAMENTE.");
  };

  const deleteUser = (id: string) => { if (confirm('¿ELIMINAR ESTE USUARIO?')) setUsers(prev => prev.filter(u => u.id !== id)); };

  const addItem = (item: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) => {
    const val = removeAccents(item);
    if (val && !list.includes(val)) { 
      const newList = [...list, val];
      setList(newList); 
      setInput(""); 
    }
  };

  const addColony = () => {
    if (!newColony.colony || !newColony.quadrant) return;
    setColoniaCatalog([...coloniaCatalog, { ...newColony, colony: removeAccents(newColony.colony) }]);
    setNewColony({ ...newColony, colony: '' });
  };

  const removeItem = (val: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter(i => i !== val));
  };

  const removeColony = (col: string, region: string) => {
    if (confirm(`¿ELIMINAR COLONIA ${col}?`)) {
      setColoniaCatalog(coloniaCatalog.filter(c => !(c.colony === col && c.region === region)));
    }
  };

  const moveItem = (list: string[], setList: (v: string[]) => void, item: string, direction: 'up' | 'down') => {
    const index = list.indexOf(item);
    if (index === -1) return;
    const newList = [...list];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target >= 0 && target < newList.length) {
      [newList[index], newList[target]] = [newList[target], newList[index]];
      setList(newList);
    }
  };

  const sortAlphabetically = (list: string[], setList: (v: string[]) => void) => {
    setList([...list].sort());
  };

  const downloadUsersCSV = () => {
    const headers = ["ID", "NOMBRE COMPLETO", "USUARIO", "PASSWORD", "ROL", "REGION ASIGNADA", "AGRUPAMIENTO", "TELEFONO", "NOMINA"];
    const rows = users.map(u => [
      u.id, u.fullName, u.username, u.password || 'N/A', u.role, u.assignedRegion || 'N/A', u.isAgrupamiento ? 'SI' : 'NO', u.phoneNumber || 'N/A', u.payrollNumber || 'N/A'
    ].map(v => `"${String(v).replace(/"/g, '""')}"`));
    
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BASE_DATOS_USUARIOS_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      if (lines.length < 2) return;

      let added = 0;
      let updated = 0;

      const parseCSVLine = (line: string) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      setUsers(prevUsers => {
        const newUsersList = [...prevUsers];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line || line.length < 5) continue;
          
          const parts = parseCSVLine(line);
          if (parts.length < 5) continue;

          // Header: ID, NOMBRE COMPLETO, USUARIO, PASSWORD, ROL, REGION ASIGNADA, AGRUPAMIENTO, TELEFONO, NOMINA
          const [id, fullName, username, password, role, assignedRegion, isAgrupamiento, phoneNumber, payrollNumber] = parts;

          if (!username || !fullName || !role) continue;

          const roleVal = role.toUpperCase() as Role;
          const isAgrup = isAgrupamiento === 'SI';
          const passVal = password === 'N/A' ? '' : password;
          const regVal = assignedRegion === 'N/A' ? '' : assignedRegion;
          const phoneVal = phoneNumber === 'N/A' ? '' : phoneNumber;
          const payVal = payrollNumber === 'N/A' ? '' : payrollNumber;

          const existingUserIndex = newUsersList.findIndex(u => u.id === id || u.username === username);

          const userData: User = {
            id: id || Math.random().toString(36).substring(2, 11),
            fullName: removeAccents(fullName),
            username: username,
            password: passVal,
            role: roleVal,
            assignedRegion: regVal,
            isAgrupamiento: isAgrup,
            phoneNumber: phoneVal,
            payrollNumber: payVal
          };

          if (existingUserIndex !== -1) {
            const existing = newUsersList[existingUserIndex];
            const hasChanges = 
              existing.fullName !== userData.fullName ||
              existing.password !== userData.password ||
              existing.role !== userData.role ||
              existing.assignedRegion !== userData.assignedRegion ||
              existing.isAgrupamiento !== userData.isAgrupamiento ||
              existing.phoneNumber !== userData.phoneNumber ||
              existing.payrollNumber !== userData.payrollNumber;

            if (hasChanges) {
              newUsersList[existingUserIndex] = { ...existing, ...userData };
              updated++;
            }
          } else {
            newUsersList.push(userData);
            added++;
          }
        }
        
        if (added > 0 || updated > 0) {
          setTimeout(() => alert(`IMPORTACIÓN COMPLETADA:\n${added} USUARIOS NUEVOS\n${updated} USUARIOS ACTUALIZADOS`), 100);
        } else {
          setTimeout(() => alert("NO SE ENCONTRARON CAMBIOS NI USUARIOS NUEVOS."), 100);
        }

        return newUsersList;
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    if (editingUser) {
      setEditingUser({...editingUser, phoneNumber: val});
    } else {
      setNewUser({...newUser, phoneNumber: val});
    }
  };

  const getCurrentList = () => {
    if (activeTab === 'catalog') return opTypes;
    if (activeTab === 'corporations') return corporationsCatalog;
    if (activeTab === 'crimes') return crimesCatalog;
    if (activeTab === 'ranks') return ranksCatalog;
    if (activeTab === 'meetingTopics') return meetingTopicsCatalog;
    return faultsCatalog;
  };

  const getSetList = () => {
    if (activeTab === 'catalog') return setOpTypes;
    if (activeTab === 'corporations') return setCorporationsCatalog;
    if (activeTab === 'crimes') return setCrimesCatalog;
    if (activeTab === 'ranks') return setRanksCatalog;
    if (activeTab === 'meetingTopics') return setMeetingTopicsCatalog;
    return setFaultsCatalog;
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20 uppercase">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-black uppercase tracking-tight">ADMINISTRACION</h2>
        {activeTab === 'users' && currentUserRole === 'ADMIN' && (
          <div className="flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportCSV} 
              accept=".csv" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 md:flex-none bg-blue-600 p-3 rounded-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase shadow-lg"
            >
              <Upload className="w-4 h-4" /> IMPORTAR
            </button>
            <button 
              onClick={downloadUsersCSV} 
              className="flex-1 md:flex-none bg-emerald-600 p-3 rounded-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase shadow-lg"
            >
              <Download className="w-4 h-4" /> EXPORTAR
            </button>
          </div>
        )}
      </header>
      
      <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
        {currentUserRole === 'ADMIN' && <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon />} label="USUARIOS" />}
        <TabButton active={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')} icon={<ShieldAlert />} label="TIPOS" />
        <TabButton active={activeTab === 'corporations'} onClick={() => setActiveTab('corporations')} icon={<Building2 />} label="CORPS" />
        <TabButton active={activeTab === 'crimes'} onClick={() => setActiveTab('crimes')} icon={<Gavel />} label="DELITOS" />
        <TabButton active={activeTab === 'faults'} onClick={() => setActiveTab('faults')} icon={<AlertTriangle />} label="FALTAS" />
        <TabButton active={activeTab === 'ranks'} onClick={() => setActiveTab('ranks')} icon={<UserCheck />} label="RANGOS" />
        <TabButton active={activeTab === 'meetingTopics'} onClick={() => setActiveTab('meetingTopics')} icon={<MessageSquare />} label="REUNION" />
        <TabButton active={activeTab === 'colonies'} onClick={() => setActiveTab('colonies')} icon={<MapPin />} label="COLONIAS" />
      </div>

      {activeTab === 'users' && currentUserRole === 'ADMIN' && (
        <div className="space-y-6">
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-black border-b border-slate-800 pb-2 uppercase">
              {editingUser ? 'EDITAR USUARIO' : 'REGISTRO DE USUARIOS'}
            </h3>
            <form onSubmit={editingUser ? saveUserEdit : addUser} className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="NOMBRE COMPLETO" className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs" value={editingUser ? editingUser.fullName : newUser.fullName} onChange={e => editingUser ? setEditingUser({...editingUser, fullName: e.target.value}) : setNewUser({...newUser, fullName: e.target.value})} />
              <input type="text" placeholder="USUARIO" className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs" value={editingUser ? editingUser.username : newUser.username} onChange={e => editingUser ? setEditingUser({...editingUser, username: e.target.value}) : setNewUser({...newUser, username: e.target.value})} />
              <input type="text" placeholder="CONTRASEÑA" className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs" value={editingUser ? editingUser.password : newUser.password} onChange={e => editingUser ? setEditingUser({...editingUser, password: e.target.value}) : setNewUser({...newUser, password: e.target.value})} />
              <select className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs" value={editingUser ? editingUser.role : newUser.role} onChange={e => editingUser ? setEditingUser({...editingUser, role: e.target.value as Role}) : setNewUser({...newUser, role: e.target.value as Role})}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input type="tel" maxLength={10} placeholder="TELEFONO" className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs" value={editingUser ? editingUser.phoneNumber : newUser.phoneNumber} onChange={handlePhoneChange} />
              <input type="text" placeholder="NO. NOMINA" className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs" value={editingUser ? editingUser.payrollNumber : newUser.payrollNumber} onChange={e => editingUser ? setEditingUser({...editingUser, payrollNumber: e.target.value}) : setNewUser({...newUser, payrollNumber: e.target.value})} />
              
              <div className="col-span-2 flex items-center gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingUser ? editingUser.isAgrupamiento : newUser.isAgrupamiento} onChange={e => editingUser ? setEditingUser({...editingUser, isAgrupamiento: e.target.checked}) : setNewUser({...newUser, isAgrupamiento: e.target.checked})} />
                  <span className="text-[10px] font-black">ADSCURITO A AGRUPAMIENTO</span>
                </label>
                {!(editingUser ? editingUser.isAgrupamiento : newUser.isAgrupamiento) && (
                   <select className="flex-1 bg-slate-900 border border-slate-700 p-1.5 rounded text-[10px]" value={editingUser ? editingUser.assignedRegion : newUser.assignedRegion} onChange={e => editingUser ? setEditingUser({...editingUser, assignedRegion: e.target.value}) : setNewUser({...newUser, assignedRegion: e.target.value})}>
                     {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                )}
              </div>

              <div className="col-span-2 flex gap-2">
                {editingUser && (
                  <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-slate-800 font-black py-3 rounded-xl">CANCELAR</button>
                )}
                <button type="submit" className="flex-1 bg-blue-600 font-black py-3 rounded-xl">
                  {editingUser ? 'GUARDAR CAMBIOS' : 'CREAR USUARIO'}
                </button>
              </div>
            </form>
          </section>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h4 className="text-[10px] font-black text-slate-500 mb-3 px-1 uppercase">USUARIOS REGISTRADOS</h4>
            <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white uppercase">{u.fullName} (@{u.username})</span>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-[8px] bg-blue-500/10 text-blue-500 px-1 rounded uppercase font-black">{u.role}</span>
                      <span className="text-[8px] text-slate-600 uppercase font-bold">{u.payrollNumber ? `NOMINA: ${u.payrollNumber}` : 'SIN NOMINA'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingUser(u)} className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteUser(u.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {['catalog', 'corporations', 'crimes', 'faults', 'ranks', 'meetingTopics'].includes(activeTab) && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-black uppercase">GESTION DE CATALOGO</h3>
            <button onClick={() => sortAlphabetically(getCurrentList(), getSetList())} className="flex items-center gap-1.5 text-[9px] font-black bg-blue-600/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded hover:bg-blue-600/20 transition-all uppercase">
              <SortAsc className="w-3 h-3" /> ORDENAR A-Z
            </button>
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="NUEVO VALOR..." className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white" 
              value={activeTab === 'catalog' ? newType : activeTab === 'corporations' ? newCorp : activeTab === 'crimes' ? newCrime : activeTab === 'ranks' ? newRank : activeTab === 'meetingTopics' ? newMeetingTopic : newFault} 
              onChange={e => activeTab === 'catalog' ? setNewType(e.target.value) : activeTab === 'corporations' ? setNewCorp(e.target.value) : activeTab === 'crimes' ? setNewCrime(e.target.value) : activeTab === 'ranks' ? setNewRank(e.target.value) : activeTab === 'meetingTopics' ? setNewMeetingTopic(e.target.value) : setNewFault(e.target.value)} />
            <button onClick={() => activeTab === 'catalog' ? addItem(newType, opTypes, setOpTypes, setNewType) : activeTab === 'corporations' ? addItem(newCorp, corporationsCatalog, setCorporationsCatalog, setNewCorp) : activeTab === 'crimes' ? addItem(newCrime, crimesCatalog, setCrimesCatalog, setNewCrime) : activeTab === 'ranks' ? addItem(newRank, ranksCatalog, setRanksCatalog, setNewRank) : activeTab === 'meetingTopics' ? addItem(newMeetingTopic, meetingTopicsCatalog, setMeetingTopicsCatalog, setNewMeetingTopic) : addItem(newFault, faultsCatalog, setFaultsCatalog, setNewFault)} className="bg-blue-600 p-3 rounded-xl hover:bg-blue-500 transition-colors"><Plus /></button>
          </div>
          <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {getCurrentList().map((item, index) => (
              <div key={`${item}-${index}`} className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                <span className="text-[10px] font-black tracking-tight flex-1 text-white">{item}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveItem(getCurrentList(), getSetList(), item, 'up')} className="p-1.5 text-slate-600 hover:text-blue-500 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => moveItem(getCurrentList(), getSetList(), item, 'down')} className="p-1.5 text-slate-600 hover:text-blue-500 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                  <button onClick={() => removeItem(item, getCurrentList(), getSetList())} className="p-1.5 text-red-500/50 hover:text-red-500 transition-colors ml-2"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'colonies' && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="font-black border-b border-slate-800 pb-2 uppercase tracking-widest">CATÁLOGO DE COLONIAS</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-600 ml-1">REGION</span>
              <select className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white" value={newColony.region} onChange={e => setNewColony({...newColony, region: e.target.value})}>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-600 ml-1">CUADRANTE</span>
              <input type="text" placeholder="00" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white" value={newColony.quadrant} onChange={e => setNewColony({...newColony, quadrant: e.target.value})} />
            </div>
            <div className="col-span-2 space-y-1">
              <span className="text-[8px] font-black text-slate-600 ml-1">NOMBRE COLONIA</span>
              <input type="text" placeholder="ESCRIBA EL NOMBRE..." className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white" value={newColony.colony} onChange={e => setNewColony({...newColony, colony: e.target.value})} />
            </div>
            <button onClick={addColony} className="col-span-2 bg-blue-600 py-4 rounded-xl font-black shadow-lg hover:bg-blue-500 transition-all uppercase">AÑADIR A LA BASE DE DATOS</button>
          </div>
          
          <div className="border-t border-slate-800 pt-6 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-slate-500" />
              <select className="flex-1 bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs font-bold text-white" value={colonyFilterRegion} onChange={e => setColonyFilterRegion(e.target.value)}>
                <option value="TODOS">MOSTRAR TODAS LAS REGIONES</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {filteredColonies.map((c, i) => (
                <div key={`${c.colony}-${i}`} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white">{c.colony}</span>
                    <span className="text-[8px] text-slate-500 font-black tracking-widest">{c.region} • CUADRANTE {c.quadrant}</span>
                  </div>
                  <button onClick={() => removeColony(c.colony, c.region)} className="p-2 text-red-500/50 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {filteredColonies.length === 0 && (
                <p className="text-center text-slate-600 text-[10px] font-black py-10 italic uppercase">SIN RESULTADOS EN ESTA REGION</p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black border transition-all ${active ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}>
    {React.cloneElement(icon as any, { className: "w-3.5 h-3.5" })}
    {label}
  </button>
);

export default Admin;
