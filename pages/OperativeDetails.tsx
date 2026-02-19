
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Clock, 
  MapPin, 
  Shield, 
  Users, 
  Car, 
  Bike, 
  Users2,
  CheckCircle2,
  Trash2,
  Edit2,
  Save,
  X,
  Plus,
  Sparkles,
  Info,
  User as UserIcon,
  Phone,
  MessageSquare,
  Lock,
  Building2,
  Bus,
  ClipboardList,
  FileText
} from 'lucide-react';
import { Operative, ConclusionData, ResultType, Role, CatalogEntry, Unit, Corporation, Rank } from '../types';
import { formatTime, removeAccents } from '../utils';

interface OperativeDetailsProps {
  operatives: Operative[];
  updateOperative: (id: string, updates: Partial<Operative>) => void;
  deleteOperative?: (id: string) => void;
  role: Role;
  userId: string;
  coloniaCatalog: CatalogEntry[];
  crimesCatalog: string[];
  faultsCatalog: string[];
}

const OperativeDetails: React.FC<OperativeDetailsProps> = ({ 
  operatives, updateOperative, deleteOperative, role, userId, coloniaCatalog, crimesCatalog, faultsCatalog 
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const operative = operatives.find(op => op.id === id);

  const isReunionVecinal = operative?.type.includes("REUNION VECINAL");
  const isAdmin = role === 'ADMIN';

  const [isConcluding, setIsConcluding] = useState(false);
  const [concLocation, setConcLocation] = useState("");
  const [coveredCols, setCoveredCols] = useState<string[]>([]);
  const [publicTransport, setPublicTransport] = useState(0);
  const [privateVehicles, setPrivateVehicles] = useState(0);
  const [motorcycles, setMotorcycles] = useState(0);
  const [people, setPeople] = useState(0);
  const [result, setResult] = useState<ResultType>("DISUACION");
  
  // States for Reunion Vecinal
  const [repName, setRepName] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [partCount, setPartCount] = useState(0);
  const [petitions, setPetitions] = useState("");

  const [detaineesCount, setDetaineesCount] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState("");
  const [otherIncident, setOtherIncident] = useState("");

  useEffect(() => {
    if (isConcluding && operative) {
      setConcLocation(`${operative.location.street}, ${operative.location.corner}, ${operative.location.colony}`);
    }
  }, [isConcluding, operative]);

  const operativeRegionColonies = useMemo(() => {
    if (!operative) return [];
    const opRegion = removeAccents(operative.region);
    return coloniaCatalog
      .filter(c => removeAccents(c.region) === opRegion)
      .map(c => removeAccents(c.colony))
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  }, [operative, coloniaCatalog]);

  if (!operative) return <div className="p-10 text-center uppercase font-black">OPERATIVO NO ENCONTRADO</div>;

  const handleFinish = () => {
    if (isReunionVecinal && (!repName || !repPhone || partCount === 0)) {
      alert("POR FAVOR COMPLETE LOS DATOS DEL REPRESENTANTE Y EL NUMERO DE ASISTENTES.");
      return;
    }

    const finalIncident = selectedIncident === 'OTRO' ? removeAccents(otherIncident) : selectedIncident;
    const conclusion: ConclusionData = {
      location: removeAccents(concLocation),
      coloniesCovered: coveredCols.length > 0 ? coveredCols : [operative.location.colony],
      publicTransportChecked: isReunionVecinal ? 0 : publicTransport,
      privateVehiclesChecked: isReunionVecinal ? 0 : privateVehicles,
      motorcyclesChecked: isReunionVecinal ? 0 : motorcycles,
      peopleChecked: isReunionVecinal ? 0 : people,
      result,
      concludedAt: formatTime(new Date()),
      detaineesCount: (!isReunionVecinal && result !== 'DISUACION') ? detaineesCount : undefined,
      detentionReason: result === 'DETENIDOS AL JUEZ CIVICO' ? finalIncident : undefined,
      crimeType: result === 'PUESTA A LA FISCALIA' ? finalIncident : undefined,
      reunionDetails: isReunionVecinal ? {
        representativeName: removeAccents(repName),
        phone: removeAccents(repPhone),
        participantCount: partCount,
        petitions: removeAccents(petitions)
      } : undefined
    };

    updateOperative(operative.id, { status: 'CONCLUIDO', conclusion });
    setIsConcluding(false);
  };

  const toggleColony = (col: string) => {
    setCoveredCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setRepPhone(val);
  };

  return (
    <div className="pb-20 max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 uppercase">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-900 rounded-full text-slate-400"><ChevronLeft className="w-8 h-8" /></button>
        <div className="text-center"><h2 className="text-lg font-bold">{operative.id}</h2><span className={`text-[10px] px-2 py-0.5 rounded border ${operative.status === 'ACTIVO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700 text-slate-400'}`}>{operative.status}</span></div>
        <div className="flex gap-1">{isAdmin && <button onClick={() => { if(confirm('¿ELIMINAR?')) { deleteOperative?.(operative.id); navigate(-1); } }} className="p-2 text-red-500"><Trash2 className="w-6 h-6" /></button>}</div>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
             <Shield className="w-5 h-5" />
             <h3 className="text-xl font-black">{removeAccents(operative.type)}</h3>
          </div>
          {operative.meetingTopic && (
            <div className="bg-blue-600/10 border border-blue-500/20 p-3 rounded-xl flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <p className="text-[10px] font-black text-blue-500 uppercase">TEMÁTICA: {operative.meetingTopic}</p>
            </div>
          )}
          <p className="text-xs text-slate-500 font-bold tracking-widest">{operative.region} • CUADRANTE {operative.quadrant}</p>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
               <div className="flex items-center gap-2 text-slate-500 mb-1">
                 <Clock className="w-3.5 h-3.5" />
                 <span className="text-[9px] font-black uppercase">INICIO</span>
               </div>
               <p className="font-bold text-white">{operative.startTime}</p>
             </div>
             <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
               <div className="flex items-center gap-2 text-slate-500 mb-1">
                 <MapPin className="w-3.5 h-3.5" />
                 <span className="text-[9px] font-black uppercase">COLONIA</span>
               </div>
               <p className="font-bold text-white truncate">{removeAccents(operative.location.colony)}</p>
             </div>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
             <div className="flex items-center gap-2 text-slate-500 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase">DIRECCIÓN EXACTA</span>
             </div>
             <p className="font-bold text-white text-sm">CALLE {removeAccents(operative.location.street)} {operative.location.corner ? `ESQUINA ${removeAccents(operative.location.corner)}` : ''}</p>
             <p className="text-[10px] text-slate-600 font-mono mt-2">{operative.location.latitude}, {operative.location.longitude}</p>
          </div>
      </section>

      <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Car className="w-4 h-4 text-blue-500" />
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">FUERZA DE DESPLIEGUE DSyPCI</h4>
          </div>
          <div className="grid grid-cols-1 gap-3">
             {operative.units.map(u => (
               <div key={u.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-lg">
                  <div className="flex flex-col flex-1">
                     <span className="text-[8px] font-black text-slate-600 uppercase">UNIDAD / MANDO</span>
                     <p className="text-xs font-bold text-white uppercase">{u.unitNumber} • {u.inCharge}</p>
                     <p className="text-[9px] text-slate-500 uppercase font-black">{u.rank}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {u.phoneNumber && (
                      <a href={`tel:${u.phoneNumber}`} className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-900/40 hover:scale-105 active:scale-95 transition-all">
                        <Phone className="w-5 h-5" />
                      </a>
                    )}
                    <div className="bg-blue-600/10 border border-blue-500/20 px-3 py-1.5 rounded-xl text-center min-w-[50px]">
                       <span className="block text-[8px] font-black text-blue-500 uppercase">ELEMS</span>
                       <span className="text-sm font-black text-blue-500">{u.personnelCount}</span>
                    </div>
                  </div>
               </div>
             ))}
          </div>
      </section>

      {operative.corporations.length > 0 && (
        <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Building2 className="w-4 h-4 text-purple-500" />
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">APOYO EXTERNO INTERINSTITUCIONAL</h4>
            </div>
            <div className="grid grid-cols-1 gap-3">
               {operative.corporations.map(c => (
                 <div key={c.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-lg">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-slate-600 uppercase">CORPORACIÓN</span>
                       <p className="text-xs font-bold text-white uppercase">{c.name}</p>
                       <p className="text-[9px] text-slate-500 uppercase">UNIDAD: {c.unitNumber || 'N/A'}</p>
                       <p className="text-[9px] text-slate-500 uppercase">A CARGO: {c.inCharge || 'NO ESPECIFICADO'}</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-purple-600/10 border border-purple-500/20 px-3 py-1.5 rounded-xl text-center">
                         <span className="block text-[8px] font-black text-purple-500 uppercase">UNIDS</span>
                         <span className="text-sm font-black text-purple-500">{c.unitCount}</span>
                      </div>
                      <div className="bg-purple-600/10 border border-purple-500/20 px-3 py-1.5 rounded-xl text-center">
                         <span className="block text-[8px] font-black text-purple-500 uppercase">ELEMS</span>
                         <span className="text-sm font-black text-purple-500">{c.personnelCount}</span>
                      </div>
                    </div>
                 </div>
               ))}
            </div>
        </section>
      )}

      {isConcluding && (
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl animate-in fade-in uppercase">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-black text-emerald-500 text-lg uppercase tracking-widest">REPORTE DE CONCLUSIÓN</h3>
            <X className="w-6 h-6 text-slate-600 cursor-pointer" onClick={() => setIsConcluding(false)} />
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="text-[10px] font-black text-slate-500 ml-1">LUGAR DE TÉRMINO</span>
              <input type="text" className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none" value={concLocation} onChange={e => setConcLocation(removeAccents(e.target.value))} />
            </label>
            
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-500 uppercase ml-1">COLONIAS CUBIERTAS EN {operative.region}</span>
              <div className="flex flex-wrap gap-2 min-h-[50px] max-h-48 overflow-y-auto p-3 bg-slate-950 rounded-xl border border-slate-800">
                {operativeRegionColonies.map(c => (
                  <button key={c} type="button" onClick={() => toggleColony(c)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${coveredCols.includes(c) ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-400'}`}>{c}</button>
                ))}
              </div>
            </div>

            {isReunionVecinal ? (
              <div className="space-y-4 animate-in slide-in-from-top-2 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="w-4 h-4 text-blue-500" />
                  <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">DATOS DE REUNIÓN VECINAL</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-[10px] font-black text-slate-500 ml-1">NOMBRE DEL REPRESENTANTE</span>
                    <input type="text" className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" value={repName} onChange={e => setRepName(removeAccents(e.target.value))} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-black text-slate-500 ml-1">TELÉFONO</span>
                    <input type="tel" maxLength={10} className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" value={repPhone} onChange={handlePhoneChange} />
                  </label>
                </div>
                <InputCounter label="NUMERO DE ASISTENTES" value={partCount} onChange={setPartCount} />
                <label className="block">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase">PETICIONES O ACUERDOS</span>
                  </div>
                  <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none min-h-[100px]" value={petitions} onChange={e => setPetitions(removeAccents(e.target.value))} placeholder="ESCRIBA LAS SOLICITUDES DE LOS VECINOS..." />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <InputCounter label="T. PÚBLICO" value={publicTransport} onChange={setPublicTransport} />
                <InputCounter label="PARTICULARES" value={privateVehicles} onChange={setPrivateVehicles} />
                <InputCounter label="MOTOCICLETAS" value={motorcycles} onChange={setMotorcycles} />
                <InputCounter label="PERSONAS" value={people} onChange={setPeople} />
              </div>
            )}

            {!isReunionVecinal && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <label className="block">
                  <span className="text-[10px] font-black text-slate-500 ml-1">RESULTADO FINAL</span>
                  <select className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none" value={result} onChange={e => setResult(e.target.value as ResultType)}>
                    <option value="DISUACION">DISUACION (SIN NOVEDAD)</option>
                    <option value="DETENIDOS AL JUEZ CIVICO">DETENIDOS AL JUEZ CIVICO</option>
                    <option value="PUESTA A LA FISCALIA">PUESTA A LA FISCALIA</option>
                  </select>
                </label>
              </div>
            )}
          </div>
          <div className="flex gap-4 pt-4">
            <button onClick={() => setIsConcluding(false)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black transition-colors uppercase">CANCELAR</button>
            <button onClick={handleFinish} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-900/20 transition-all active:scale-95 uppercase">GUARDAR REPORTE</button>
          </div>
        </section>
      )}

      {operative.status === 'ACTIVO' && !isConcluding && (
        <button onClick={() => setIsConcluding(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 font-black py-5 rounded-3xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20 transition-all active:scale-95">
          <CheckCircle2 className="w-6 h-6" /> FINALIZAR OPERATIVO
        </button>
      )}
    </div>
  );
};

const InputCounter: React.FC<{ label: string, value: number, onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-black text-slate-500 tracking-tighter uppercase ml-1">{label}</span>
    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-white transition-colors">-</button>
      <input type="number" className="flex-1 bg-transparent text-center text-sm font-bold text-white outline-none" value={value} onChange={e => onChange(parseInt(e.target.value) || 0)} />
      <button type="button" onClick={() => onChange(value + 1)} className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-white transition-colors">+</button>
    </div>
  </div>
);

export default OperativeDetails;
