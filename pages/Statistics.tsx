
import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  ResponsiveContainer as ResponsiveContainerChart
} from 'recharts';
import { Filter, Calendar, MapPin, Shield, TrendingUp, Target, AlertTriangle, ChevronRight, Share2, Info } from 'lucide-react';
import { Operative, Shift } from '../types';
import { REGIONS, COLONIA_CATALOG } from '../constants';
import { removeAccents } from '../utils';

interface StatisticsProps {
  operatives: Operative[];
  opTypes: string[];
}

const COLORS = ['#3b82f6', '#60a5fa', '#2dd4bf', '#fbbf24', '#f87171', '#a78bfa'];

const Statistics: React.FC<StatisticsProps> = ({ operatives, opTypes }) => {
  const [filterRegion, setFilterRegion] = useState("TODOS");
  const [filterShift, setFilterShift] = useState("TODOS");
  const [filterMonth, setFilterMonth] = useState("TODOS");

  const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

  const filteredData = useMemo(() => {
    return operatives.filter(op => {
      const matchRegion = filterRegion === "TODOS" || op.region === filterRegion;
      const matchShift = filterShift === "TODOS" || op.shift === filterShift;
      const opDate = new Date(op.startDate);
      const opMonth = isNaN(opDate.getTime()) ? -1 : opDate.getUTCMonth();
      const matchMonth = filterMonth === "TODOS" || (opMonth !== -1 && months[opMonth] === filterMonth);
      return matchRegion && matchShift && matchMonth;
    });
  }, [operatives, filterRegion, filterShift, filterMonth]);

  // Metric 1: Regions with at least one operative
  const activeRegionsCount = useMemo(() => {
    const activeSet = new Set(filteredData.map(op => op.region));
    return {
      active: activeSet.size,
      total: REGIONS.length
    };
  }, [filteredData]);

  // Metric 2: Operatives by Region
  const opsByRegion = useMemo(() => {
    const counts: Record<string, number> = {};
    // Only show the main 7 regions for cleaner bar chart, or top 6 as the image
    const mainRegions = REGIONS.filter(r => r.startsWith('REGION'));
    mainRegions.forEach(r => counts[r] = 0);
    
    filteredData.forEach(op => {
      if (counts[op.region] !== undefined) {
        counts[op.region]++;
      }
    });
    
    return Object.entries(counts).map(([name, value]) => ({ 
      name: name.replace('REGION ', 'R-0'), 
      value 
    }));
  }, [filteredData]);

  // Metric 3: Types Distribution
  const opsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(op => {
      const type = removeAccents(op.type).split(' ').pop() || 'OTROS';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // Metric 4: Critical Colonies (Top 3)
  const criticalColonies = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(op => {
      const col = removeAccents(op.location.colony);
      counts[col] = (counts[col] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // Metric 5: Coverage Gap
  const missingColoniesCount = useMemo(() => {
    const coveredSet = new Set(filteredData.map(op => removeAccents(op.location.colony)));
    const totalSet = new Set(COLONIA_CATALOG.map(c => removeAccents(c.colony)));
    return totalSet.size - Array.from(totalSet).filter(c => coveredSet.has(c)).length;
  }, [filteredData]);

  const totalOps = filteredData.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 uppercase max-w-lg mx-auto md:max-w-5xl">
      {/* Navbar Minimalista */}
      <header className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">ESTADISTICAS</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase">IXTAPALUCA • REPORTES OPERATIVOS</p>
        </div>
        <button className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-900/40">
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      {/* Selector de Filtros Estilo Referencia */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
        <button className="flex items-center gap-2 bg-blue-600 px-4 py-2.5 rounded-xl text-xs font-black text-white shrink-0">
          <Filter className="w-3 h-3" /> FILTROS
        </button>
        <select 
          className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 outline-none shrink-0"
          value={filterRegion}
          onChange={e => setFilterRegion(e.target.value)}
        >
          <option value="TODOS">REGION: TODAS</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select 
          className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 outline-none shrink-0"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
        >
          <option value="TODOS">MES: TODOS</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Tarjetas Principales */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
          <span className="text-[10px] font-black text-slate-500 tracking-widest block mb-2 uppercase">TOTAL OPERATIVOS</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalOps.toLocaleString()}</span>
            <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-emerald-500/20 uppercase">+12%</span>
          </div>
          <p className="text-[9px] text-slate-600 mt-2 font-bold uppercase">COMPARADO CON EL MES ANTERIOR</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
          <span className="text-[10px] font-black text-slate-500 tracking-widest block mb-2 uppercase">REGIONES ACTIVAS</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-blue-500">{activeRegionsCount.active}</span>
            <span className="text-xl font-black text-slate-700">/{activeRegionsCount.total}</span>
            <span className="ml-auto bg-blue-600/10 text-blue-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-blue-500/20 uppercase">META</span>
          </div>
          <p className="text-[9px] text-slate-600 mt-2 font-bold uppercase">COBERTURA MUNICIPAL ACTUAL</p>
        </div>
      </div>

      {/* Operativos por Región - Gráfica de Barras */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-black text-white uppercase">OPERATIVOS POR REGION</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase">DISTRIBUCION POR ZONA GEOGRAFICA</p>
          </div>
          <button className="text-slate-600"><ChevronRight className="w-5 h-5 rotate-90" /></button>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={opsByRegion} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#475569' }} 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', fontSize: '10px' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Tipos de Operativo - Donut Chart */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
        <h3 className="text-lg font-black text-white uppercase">TIPOS DE OPERATIVO</h3>
        <p className="text-slate-500 text-[10px] font-bold uppercase mb-8">PROPORCION POR PROTOCOLO APLICADO</p>
        <div className="flex items-center gap-4">
          <div className="relative w-1/2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={opsByType}
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {opsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">100%</span>
              <span className="text-[8px] font-black text-slate-500 uppercase">GLOBAL</span>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            {opsByType.map((type, i) => (
              <div key={type.name} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <div>
                  <p className="text-[11px] font-black text-white leading-none uppercase">{type.name}</p>
                  <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase">
                    {((type.value / (totalOps || 1)) * 100).toFixed(0)}% ({type.value})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Colonias Críticas y Mapa Densidad */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white uppercase">COLONIAS CRITICAS</h3>
          <button className="text-blue-500 text-[10px] font-black uppercase">VER TODAS</button>
        </div>
        
        <div className="space-y-4">
          {criticalColonies.length > 0 ? criticalColonies.map((col, i) => (
            <div key={col.name} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm uppercase ${
                i === 0 ? 'bg-red-500/10 text-red-500' : 
                i === 1 ? 'bg-orange-500/10 text-orange-500' : 
                'bg-yellow-500/10 text-yellow-500'
              }`}>
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-white uppercase leading-none">{col.name}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">ALTA DENSIDAD OPERATIVA</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-white uppercase">{col.value}</p>
                <div className="w-16 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-500' : 'bg-yellow-500'}`} 
                    style={{ width: `${(col.value / (criticalColonies[0].value || 1)) * 100}%` }} 
                  />
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center p-6 text-slate-500 font-bold uppercase text-xs italic">SIN DATOS SUFICIENTES</div>
          )}
        </div>

        {/* Info adicional de omisión */}
        <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl flex items-center gap-4 mt-4">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">ZONAS PENDIENTES</p>
            <p className="text-xs font-bold text-white uppercase">FALTAN <span className="text-blue-400">{missingColoniesCount} COLONIAS</span> POR CUBRIR ESTE MES</p>
          </div>
        </div>
      </section>

      {/* Mapa de Densidad Placeholder */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-6 shadow-2xl">
        <h3 className="text-lg font-black text-white uppercase mb-4">MAPA DE DENSIDAD</h3>
        <div className="relative h-48 bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=19.3142,-98.8821&zoom=13&size=600x400&maptype=roadmap&style=feature:all|element:all|saturation:-100|lightness:-20&style=feature:road|element:geometry|color:0x242f3e&style=feature:water|element:geometry|color:0x17263c')] bg-cover bg-center opacity-40 grayscale group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="flex items-center gap-2 bg-blue-600 px-6 py-3 rounded-2xl text-xs font-black text-white shadow-2xl shadow-blue-900/50 hover:bg-blue-500 transition-all uppercase">
              <MapPin className="w-4 h-4" /> EXPLORAR MAPA INTERACTIVO
            </button>
          </div>
        </div>
      </section>

      {/* Footer info minimalista */}
      <div className="flex items-center justify-center gap-2 text-slate-700 pb-10">
        <Info className="w-3 h-3" />
        <span className="text-[9px] font-black uppercase tracking-widest">ULTIMA ACTUALIZACION: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default Statistics;
