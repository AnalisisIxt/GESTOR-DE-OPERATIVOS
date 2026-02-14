
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MapPin, Clock, Shield, LayoutDashboard, CheckCircle2, AlertCircle } from 'lucide-react';
import { Operative, User } from '../types';
import { isSameDayShift, removeAccents } from '../utils';

interface HomeProps {
  operatives: Operative[];
  showAll?: boolean;
  user: User;
}

const Home: React.FC<HomeProps> = ({ operatives, showAll = false, user }) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = operatives;

    // 1. Role-based visibility
    if (['REGIONAL', 'SHIFT_LEADER', 'JEFE_AGRUPAMIENTO'].includes(user.role)) {
      if (!user.isAgrupamiento && user.assignedRegion) {
        list = list.filter(op => op.region === user.assignedRegion);
      }
    } else if (user.role === 'QUADRANT_LEADER' || user.role === 'PATROLMAN') {
      list = list.filter(op => op.createdBy === user.id);
    }

    // 2. Date-based (Show only today's turn if not showAll)
    if (!showAll) {
      list = list.filter(op => isSameDayShift(op.startDate, op.startTime));
    }

    // 3. Search filter
    if (search) {
      const normalizedSearch = removeAccents(search);
      list = list.filter(op => 
        removeAccents(op.id).includes(normalizedSearch) || 
        removeAccents(op.region).includes(normalizedSearch) ||
        removeAccents(op.type).includes(normalizedSearch) ||
        removeAccents(op.location.colony).includes(normalizedSearch)
      );
    }
    return list;
  }, [operatives, showAll, search, user]);

  const active = filtered.filter(op => op.status === 'ACTIVO');
  const concluded = filtered.filter(op => op.status === 'CONCLUIDO');

  const estatusPorRegion = useMemo<Record<string, { active: number, types: string[] }>>(() => {
    const data: Record<string, { active: number, types: string[] }> = {};
    active.forEach(op => {
      const reg = removeAccents(op.region);
      if (!data[reg]) data[reg] = { active: 0, types: [] };
      data[reg].active++;
      const opType = removeAccents(op.type);
      if (!data[reg].types.includes(opType)) data[reg].types.push(opType);
    });
    return data;
  }, [active]);

  const showDashboardStats = ['ADMIN', 'DIRECTOR', 'REGIONAL', 'JEFE_AGRUPAMIENTO', 'ANALISTA'].includes(user.role) && !showAll;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 uppercase">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black tracking-tight text-white">
              {showAll ? 'HISTORIAL DE OPERATIVOS' : 'DASHBOARD OPERATIVO'}
            </h2>
            <p className="text-slate-500 text-sm font-medium uppercase">
              {user.assignedRegion ? `${removeAccents(user.assignedRegion)} • ` : ''}{removeAccents(user.fullName)}
            </p>
          </div>
          {!showAll && (
            <div className="flex items-center gap-2 text-emerald-400 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              TURNO ACTIVO
            </div>
          )}
        </div>

        {showDashboardStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">ACTIVOS</span>
              <span className="text-3xl font-black text-emerald-500">{active.length}</span>
            </div>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">REGIONES</span>
              <span className="text-3xl font-black text-blue-500">{Object.keys(estatusPorRegion).length}</span>
            </div>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">HOY</span>
              <span className="text-3xl font-black text-white">{filtered.length}</span>
            </div>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
               <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">TERMINADOS</span>
               <span className="text-3xl font-black text-slate-400">{concluded.length}</span>
            </div>
          </div>
        )}

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="BUSCAR POR ID, REGION O COLONIA..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm shadow-xl uppercase"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {!['DIRECTOR', 'ANALISTA'].includes(user.role) && (
          <Link to="/new" className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/30 active:scale-[0.98]">
            <Plus className="w-6 h-6" />
            NUEVO REGISTRO
          </Link>
        )}
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase tracking-widest">
            {active.length > 0 ? <AlertCircle className="w-4 h-4 text-emerald-500" /> : <CheckCircle2 className="w-4 h-4 text-slate-700" />}
            EN DESARROLLO
          </h3>
          <span className="text-[10px] font-black text-slate-600">{active.length}</span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {active.map(op => <OperativeCard key={op.id} op={op} />)}
          {active.length === 0 && (
            <div className="p-10 text-center border-2 border-dashed border-slate-900 rounded-3xl">
              <p className="text-slate-600 font-bold italic text-sm uppercase">SIN OPERATIVOS ACTIVOS</p>
            </div>
          )}
        </div>
      </section>

      {concluded.length > 0 && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase tracking-widest px-2">
            CONCLUIDOS RECIENTEMENTE
          </h3>
          <div className="grid grid-cols-1 gap-4 opacity-75">
            {concluded.map(op => <OperativeCard key={op.id} op={op} />)}
          </div>
        </section>
      )}
    </div>
  );
};

const OperativeCard: React.FC<{ op: Operative }> = ({ op }) => (
  <Link to={`/operative/${op.id}`} className="block bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group active:scale-[0.98] shadow-lg uppercase">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <span className="text-blue-500 font-mono text-xs font-black tracking-tighter uppercase">{op.id}</span>
        <span className="text-[8px] font-black bg-slate-950 px-2 py-0.5 border border-slate-800 rounded uppercase text-slate-500">{removeAccents(op.shift)}</span>
      </div>
      <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${op.status === 'ACTIVO' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
        {op.status}
      </span>
    </div>
    
    <h4 className="text-lg font-black mb-4 text-slate-100 group-hover:text-blue-400 transition-colors leading-tight uppercase">{removeAccents(op.type)}</h4>
    
    <div className="grid grid-cols-2 gap-4 text-slate-400 text-xs">
      <div className="flex items-center gap-2 bg-slate-950/50 p-2 rounded-xl">
        <MapPin className="w-3.5 h-3.5 text-blue-500" />
        <div className="flex flex-col overflow-hidden">
          <span className="text-[8px] uppercase font-black text-slate-600">REGION / COLONIA</span>
          <span className="font-bold truncate">{removeAccents(op.region)} • {removeAccents(op.location.colony)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-slate-950/50 p-2 rounded-xl">
        <Clock className="w-3.5 h-3.5 text-blue-500" />
        <div className="flex flex-col">
          <span className="text-[8px] uppercase font-black text-slate-600">HORARIO</span>
          <span className="font-bold">{op.startTime} - {op.conclusion?.concludedAt || 'ACTIVO'}</span>
        </div>
      </div>
    </div>
  </Link>
);

export default Home;
