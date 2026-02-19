
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  Shield, 
  LayoutDashboard, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  Calendar,
  Database,
  MessageSquare
} from 'lucide-react';
import { Operative, User } from '../types';
import { isSameDayShift, removeAccents } from '../utils';

interface HomeProps {
  operatives: Operative[];
  showAll?: boolean;
  user: User;
}

const Home: React.FC<HomeProps> = ({ operatives, showAll = false, user }) => {
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const filtered = useMemo(() => {
    let list = operatives;

    if (['REGIONAL', 'JEFE_DE_TURNO', 'JEFE_AGRUPAMIENTO'].includes(user.role)) {
      if (!user.isAgrupamiento && user.assignedRegion) {
        list = list.filter(op => op.region === user.assignedRegion);
      }
    } else if (user.role === 'JEFE_DE_CUADRANTE' || user.role === 'PATRULLERO') {
      list = list.filter(op => op.createdBy === user.id);
    }

    if (!showAll) {
      list = list.filter(op => isSameDayShift(op.startDate, op.startTime));
    }

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

  const downloadCSV = () => {
    if (!dateRange.start || !dateRange.end) {
      alert("POR FAVOR SELECCIONE EL RANGO DE FECHAS");
      return;
    }

    const list = operatives.filter(op => {
      const opDate = op.startDate; 
      return opDate >= dateRange.start && opDate <= dateRange.end;
    });

    if (list.length === 0) {
      alert("NO SE ENCONTRARON REGISTROS EN ESTE PERIODO: " + dateRange.start + " AL " + dateRange.end);
      return;
    }

    // Encabezados actualizados con las columnas solicitadas de forma independiente
    const headers = [
      "ID", "TIPO", "TEMATICA_REUNION", "ESTATUS", "FECHA", "INICIO", "CIERRE", 
      "REGION", "CUADRANTE", "COLONIA", "CALLE", "COORDENADAS", 
      "RESULTADO", "DETENIDOS", "MOTIVO_O_DELITO",
      "COLONIAS_CUBIERTAS",
      "T_PUBLICO", "PARTICULARES", "MOTOCICLETAS", "PERSONAS",
      "REPRESENTANTE_VECINAL", "TELEFONO_VECINAL", "PARTICIPANTES_VECINAL", "SOLICITUDES_VECINAL",
      "DETALLE_UNIDADES_DSYPCI", "DETALLE_APOYO_EXTERNO"
    ];

    const escapeCSV = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;

    const rows = list.map(op => {
      // Formatear Unidades
      const unitsDetail = op.units.map(u => 
        `[UNIDAD: ${u.unitNumber} - MANDO: ${u.inCharge} (${u.rank}) - ELEMS: ${u.personnelCount}]`
      ).join(' | ');

      // Formatear Corporaciones
      const corpsDetail = op.corporations.map(c => 
        `[CORP: ${c.name} - UNID: ${c.unitNumber || 'N/A'} - MANDO: ${c.inCharge || 'N/A'} - UNIDS: ${c.unitCount} - ELEMS: ${c.personnelCount}]`
      ).join(' | ');

      const reunion = op.conclusion?.reunionDetails;
      const colonies = op.conclusion?.coloniesCovered.join("; ") || op.location.colony;

      return [
        escapeCSV(op.id), 
        escapeCSV(op.type), 
        escapeCSV(op.meetingTopic || 'N/A'),
        escapeCSV(op.status),
        escapeCSV(op.startDate),
        escapeCSV(op.startTime), 
        escapeCSV(op.conclusion?.concludedAt || '--'),
        escapeCSV(op.region), 
        escapeCSV(op.quadrant), 
        escapeCSV(op.location.colony),
        escapeCSV(op.location.street), 
        escapeCSV(`${op.location.latitude},${op.location.longitude}`),
        escapeCSV(op.conclusion?.result || 'N/A'), 
        escapeCSV(op.conclusion?.detaineesCount || 0),
        escapeCSV(op.conclusion?.detentionReason || op.conclusion?.crimeType || '--'),
        // Colonias
        escapeCSV(colonies),
        // Conteo de Vehículos y Personas (Columnas separadas)
        escapeCSV(op.conclusion?.publicTransportChecked || 0),
        escapeCSV(op.conclusion?.privateVehiclesChecked || 0),
        escapeCSV(op.conclusion?.motorcyclesChecked || 0),
        escapeCSV(op.conclusion?.peopleChecked || 0),
        // Datos Vecinales
        escapeCSV(reunion?.representativeName || '--'),
        escapeCSV(reunion?.phone || '--'),
        escapeCSV(reunion?.participantCount || 0),
        escapeCSV(reunion?.petitions || '--'),
        // Detalles de Fuerza
        escapeCSV(unitsDetail),
        escapeCSV(corpsDetail)
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `OPERATIVOS_COMPLETO_${dateRange.start}_AL_${dateRange.end}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showExport = showAll && ['ADMIN', 'ANALISTA', 'DIRECTOR'].includes(user.role);

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
        </div>

        {showExport && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">EXPORTAR REPORTE DETALLADO</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 ml-1">FECHA INICIAL</span>
                <input type="date" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 ml-1">FECHA FINAL</span>
                <input type="date" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
              </div>
            </div>
            <button onClick={downloadCSV} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-95">
              <Download className="w-5 h-5" /> GENERAR REPORTE COMPLETO (.CSV)
            </button>
          </section>
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
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase tracking-widest">
            {filtered.length > 0 ? <AlertCircle className="w-4 h-4 text-blue-500" /> : <CheckCircle2 className="w-4 h-4 text-slate-700" />}
            {showAll ? 'TODOS LOS REGISTROS' : 'EN DESARROLLO'}
          </h3>
          <span className="text-[10px] font-black text-slate-600">{filtered.length} REGISTROS</span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(op => <OperativeCard key={op.id} op={op} />)}
          {filtered.length === 0 && (
            <div className="p-10 text-center border-2 border-dashed border-slate-900 rounded-3xl">
              <p className="text-slate-600 font-bold italic text-sm uppercase">SIN REGISTROS ENCONTRADOS</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// Fixed missing MessageSquare import usage
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
    <div className="mb-4">
      <h4 className="text-lg font-black text-slate-100 group-hover:text-blue-400 transition-colors leading-tight uppercase">{removeAccents(op.type)}</h4>
      {op.meetingTopic && (
        <p className="text-[9px] font-black text-blue-500/80 mt-1 flex items-center gap-1">
          <MessageSquare className="w-3 h-3" /> {op.meetingTopic}
        </p>
      )}
    </div>
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
