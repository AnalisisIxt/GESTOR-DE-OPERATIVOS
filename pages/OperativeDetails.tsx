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
  AlertCircle,
  FileText,
  Edit2,
  Save,
  X,
  Plus,
  Building2,
  Sparkles,
  Info,
  User as UserIcon,
  Phone,
  MessageSquare,
  Lock
} from 'lucide-react';
import { Operative, ConclusionData, ResultType, Role, CatalogEntry, Unit, Institution, Rank } from '../types';
import { REGIONS, REGION_QUADRANTS, ALL_QUADRANTS, RANKS, INSTITUTIONS } from '../constants';
import { formatTime, removeAccents } from '../utils';
import { getLocationInsights } from '../lib/gemini';

interface OperativeDetailsProps {
  operatives: Operative[];
  updateOperative: (id: string, updates: Partial<Operative>) => void;
  deleteOperative?: (id: string) => void;
  role: Role;
  userId: string;
  coloniaCatalog: CatalogEntry[];
}

const OperativeDetails: React.FC<OperativeDetailsProps> = ({ operatives, updateOperative, deleteOperative, role, userId, coloniaCatalog }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const operative = operatives.find(op => op.id === id);

  // Is this a neighborhood meeting?
  const isReunionVecinal = operative?.type.includes("REUNION VECINAL");
  
  // Restricted visibility check for neighborhood meeting results
  const canSeeReunionResults = ['ADMIN', 'DIRECTOR', 'ANALISTA'].includes(role);

  // Finishing state
  const [isConcluding, setIsConcluding] = useState(false);
  const [concLocation, setConcLocation] = useState("");
  const [coveredCols, setCoveredCols] = useState<string[]>([]);
  const [publicTransport, setPublicTransport] = useState(0);
  const [privateVehicles, setPrivateVehicles] = useState(0);
  const [motorcycles, setMotorcycles] = useState(0);
  const [people, setPeople] = useState(0);
  const [result, setResult] = useState<ResultType>("DISUACION");
  
  // Reunion specific state
  const [repName, setRepName] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [partCount, setPartCount] = useState(0);
  const [petitions, setPetitions] = useState("");

  // Set default values for finishing
  useEffect(() => {
    if (isConcluding && operative) {
      // Auto-fill location for all, specially required for Reunion Vecinal
      setConcLocation(`${operative.location.street}, ${operative.location.corner}, ${operative.location.colony}`);
    }
  }, [isConcluding, operative]);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Operative>>({});

  // Intelligence State
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);

  // Finishing inputs
  const [detaineesCount, setDetaineesCount] = useState(0);
  const [detentionReason, setDetentionReason] = useState("");
  const [crimeType, setCrimeType] = useState("");
  const [fiscaliaTarget, setFiscaliaTarget] = useState("");

  const regionColonies = useMemo(() => {
    if (!operative) return [];
    const reg = isEditing ? editForm.region : operative.region;
    return coloniaCatalog.filter(c => c.region === reg).map(c => c.colony).sort();
  }, [operative, coloniaCatalog, isEditing, editForm.region]);

  if (!operative) return <div className="p-10 text-center uppercase">OPERATIVO NO ENCONTRADO</div>;

  const canModify = operative.createdBy === userId || ['ADMIN', 'REGIONAL', 'SHIFT_LEADER', 'JEFE_AGRUPAMIENTO'].includes(role);
  const isAdmin = role === 'ADMIN';

  const startEdit = () => {
    setIsEditing(true);
    setEditForm({ ...operative });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (!editForm.id) return;
    updateOperative(editForm.id, { ...editForm });
    setIsEditing(false);
    setEditForm({});
  };

  const handleFinish = () => {
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
      detentionReason: result === 'DETENIDOS AL JUEZ CIVICO' ? removeAccents(detentionReason) : undefined,
      crimeType: result === 'PUESTA A LA FISCALIA' ? removeAccents(crimeType) : undefined,
      fiscaliaTarget: result === 'PUESTA A LA FISCALIA' ? removeAccents(fiscaliaTarget) : undefined,
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

  const handleFetchInsights = async () => {
    setLoadingInsights(true);
    const data = await getLocationInsights(operative.location.latitude, operative.location.longitude, operative.location.colony);
    if (data) setInsights(removeAccents(data.text));
    setLoadingInsights(false);
  };

  const handleDelete = () => {
    if (confirm('¿ELIMINAR REGISTRO DE OPERATIVO? ESTA ACCION NO SE PUEDE DESHACER.')) {
      deleteOperative?.(operative.id);
      navigate(-1);
    }
  };

  const toggleColony = (col: string) => {
    setCoveredCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const addUnit = () => {
    const newUnit: Unit = { id: Math.random().toString(36).substr(2, 9), type: "PATRULLA", unitNumber: "", inCharge: "", rank: "Patrullero", personnelCount: 2 };
    setEditForm({ ...editForm, units: [...(editForm.units || []), newUnit] });
  };
  const removeUnit = (uid: string) => {
    setEditForm({ ...editForm, units: (editForm.units || []).filter(u => u.id !== uid) });
  };
  const updateUnit = (uid: string, field: keyof Unit, val: any) => {
    const finalVal = typeof val === 'string' ? removeAccents(val) : val;
    setEditForm({ ...editForm, units: (editForm.units || []).map(u => u.id === uid ? { ...u, [field]: finalVal } : u) });
  };

  return (
    <div className="pb-20 max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 uppercase">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-900 rounded-full transition-colors text-slate-400">
          <ChevronLeft className="w-8 h-8" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold">{operative.id}</h2>
          <span className={`text-[10px] px-2 py-0.5 rounded border ${operative.status === 'ACTIVO' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
            {operative.status}
          </span>
        </div>
        <div className="flex gap-1">
          {canModify && !isEditing && !isConcluding && (
            <button onClick={startEdit} className="p-2 hover:bg-emerald-500/10 rounded-full text-emerald-500 transition-colors">
              <Edit2 className="w-6 h-6" />
            </button>
          )}
          {isAdmin && (
            <button onClick={handleDelete} className="p-2 hover:bg-red-500/10 rounded-full text-red-500 transition-colors">
              <Trash2 className="w-6 h-6" />
            </button>
          )}
        </div>
      </header>

      {isEditing ? (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-black text-emerald-500 uppercase tracking-widest text-sm">EDITANDO REGISTRO</h3>
            <button onClick={cancelEdit} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[10px] text-slate-500 uppercase font-black">REGION</span>
                <select 
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase"
                  value={editForm.region}
                  onChange={e => setEditForm({...editForm, region: e.target.value, quadrant: '', location: { ...editForm.location!, colony: '' }})}
                >
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] text-slate-500 uppercase font-black">CUADRANTE</span>
                <select 
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase"
                  value={editForm.quadrant}
                  onChange={e => setEditForm({...editForm, quadrant: e.target.value})}
                >
                  <option value="">--</option>
                  {(REGION_QUADRANTS[editForm.region!] || []).map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </label>
            </div>
            
            <label className="block">
              <span className="text-[10px] text-slate-500 uppercase font-black">COLONIA</span>
              <select 
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase"
                value={editForm.location?.colony}
                onChange={e => setEditForm({...editForm, location: {...editForm.location!, colony: e.target.value}})}
              >
                <option value="">--</option>
                {regionColonies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[10px] text-slate-500 uppercase font-black">CALLE</span>
                <input 
                  type="text"
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase"
                  value={editForm.location?.street}
                  onChange={e => setEditForm({...editForm, location: {...editForm.location!, street: removeAccents(e.target.value)}})}
                />
              </label>
              <label className="block">
                <span className="text-[10px] text-slate-500 uppercase font-black">ESQUINA</span>
                <input 
                  type="text"
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase"
                  value={editForm.location?.corner}
                  onChange={e => setEditForm({...editForm, location: {...editForm.location!, corner: removeAccents(e.target.value)}})}
                />
              </label>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800">
               <div className="flex items-center justify-between">
                 <span className="text-[10px] text-slate-500 uppercase font-black">UNIDADES</span>
                 <button onClick={addUnit} className="text-blue-500 hover:text-blue-400 p-1"><Plus className="w-4 h-4" /></button>
               </div>
               {editForm.units?.map(u => (
                 <div key={u.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 uppercase">
                    <div className="flex justify-between">
                      <input className="bg-transparent font-bold text-sm text-blue-400 outline-none w-1/2 uppercase" value={u.unitNumber} onChange={e => updateUnit(u.id, 'unitNumber', e.target.value)} placeholder="UNIDAD" />
                      <button onClick={() => removeUnit(u.id)} className="text-red-500"><X className="w-3 h-3" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-900 text-[10px] p-1 rounded uppercase" value={u.rank} onChange={e => updateUnit(u.id, 'rank', e.target.value)}>
                        {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {/* Fixed broken onChange handler for the 'inCharge' field */}
                      <input className="bg-slate-900 text-[10px] p-1 rounded uppercase" value={u.inCharge} onChange={e => updateUnit(u.id, 'inCharge', e.target.value)} placeholder="RESPONSABLE" />
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <button onClick={handleSaveEdit} className="w-full bg-emerald-600 py-4 rounded-xl font-black text-white shadow-lg flex items-center justify-center gap-2 uppercase">
            <Save className="w-5 h-5" /> GUARDAR REGISTRO
          </button>
        </section>
      ) : (
        <>
          {/* Main Info Card */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl uppercase">
            <div className="bg-blue-600 p-6 text-white">
              <h3 className="text-2xl font-black uppercase leading-tight">{removeAccents(operative.type)}</h3>
              <p className="opacity-90 text-sm mt-1 font-bold">REGION {removeAccents(operative.region)} • CUADRANTE {operative.quadrant}</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-10 h-10 p-2 bg-slate-800 rounded-xl text-blue-500" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black">INICIO</p>
                    <p className="font-bold">{operative.startTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-10 h-10 p-2 bg-slate-800 rounded-xl text-blue-500" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black">COLONIA</p>
                    <p className="font-bold truncate max-w-[120px]">{removeAccents(operative.location.colony)}</p>
                  </div>
                </div>
              </div>

              {/* Location Insights Section */}
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">INTELIGENCIA DE ZONA</h4>
                  </div>
                  <button 
                    onClick={handleFetchInsights}
                    disabled={loadingInsights}
                    className="text-[9px] font-black bg-blue-600/10 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-600/20 transition-all disabled:opacity-50 uppercase"
                  >
                    {loadingInsights ? 'CONSULTANDO...' : insights ? 'RE-ACTUALIZAR' : 'VER ENTORNO'}
                  </button>
                </div>
                
                {insights && (
                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800 animate-in fade-in uppercase">
                    <p>{removeAccents(insights)}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-[9px] text-slate-500 font-bold italic uppercase tracking-tighter">
                      <Info className="w-3 h-3" />
                      INFORMACION GENERADA MEDIANTE MAPS GROUNDING
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-800">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-4">UNIDADES Y PERSONAL</h4>
                <div className="space-y-3">
                  {operative.units.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div>
                        <p className="font-bold text-sm text-blue-400 uppercase">{removeAccents(u.unitNumber)}</p>
                        <p className="text-[11px] text-slate-400 font-medium uppercase">{removeAccents(u.rank)}: {removeAccents(u.inCharge)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black">{u.personnelCount}</p>
                        <p className="text-[10px] text-slate-500 uppercase">ELEM.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {operative.status === 'CONCLUIDO' && operative.conclusion && (
                <div className="pt-6 border-t border-slate-800 space-y-4 animate-in fade-in uppercase">
                  <h4 className="text-xs font-black uppercase text-emerald-500 tracking-widest">RESUMEN DE RESULTADOS</h4>
                  
                  {isReunionVecinal ? (
                    canSeeReunionResults ? (
                      <div className="space-y-4 bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20">
                        <div className="flex items-start gap-3">
                           <UserIcon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                           <div>
                              <p className="text-[9px] font-black text-blue-500/60 uppercase">REPRESENTANTE</p>
                              <p className="text-sm font-bold">{operative.conclusion.reunionDetails?.representativeName}</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-3">
                           <Phone className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                           <div>
                              <p className="text-[9px] font-black text-blue-500/60 uppercase">TELEFONO</p>
                              <p className="text-sm font-bold">{operative.conclusion.reunionDetails?.phone}</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-3">
                           <Users className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                           <div>
                              <p className="text-[9px] font-black text-blue-500/60 uppercase">PARTICIPANTES</p>
                              <p className="text-sm font-bold">{operative.conclusion.reunionDetails?.participantCount}</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-3">
                           <MessageSquare className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                           <div>
                              <p className="text-[9px] font-black text-blue-500/60 uppercase">SOLICITUDES</p>
                              <p className="text-sm font-medium italic">{operative.conclusion.reunionDetails?.petitions}</p>
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-2 opacity-60">
                        <Lock className="w-8 h-8 text-slate-500" />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">DETALLES RESTRINGIDOS</p>
                        <p className="text-[10px] text-slate-600">SOLO PERSONAL AUTORIZADO PUEDE VER LOS RESULTADOS DE REUNIONES VECINALES</p>
                      </div>
                    )
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <StatBox icon={<Users2 />} label="PERSONAS" value={operative.conclusion.peopleChecked} color="text-emerald-500" />
                      <StatBox icon={<Car />} label="VEHICULOS" value={operative.conclusion.privateVehiclesChecked + operative.conclusion.publicTransportChecked + operative.conclusion.motorcyclesChecked} color="text-blue-500" />
                    </div>
                  )}

                  <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-tighter">ESTATUS DE FINALIZACION</p>
                    <h5 className="font-black text-emerald-400 mt-1 uppercase">{removeAccents(operative.conclusion.result)}</h5>
                    {operative.conclusion.detaineesCount ? (
                      <div className="mt-3 pt-3 border-t border-emerald-500/10">
                        <p className="text-sm font-bold uppercase">DETENIDOS: <span className="text-white">{operative.conclusion.detaineesCount}</span></p>
                        {operative.conclusion.detentionReason && <p className="text-xs text-slate-400 mt-1 italic uppercase">MOTIVO: {removeAccents(operative.conclusion.detentionReason)}</p>}
                        {operative.conclusion.crimeType && <p className="text-xs text-slate-400 mt-1 italic uppercase">DELITO: {removeAccents(operative.conclusion.crimeType)}</p>}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </section>

          {operative.status === 'ACTIVO' && canModify && !isConcluding && (
            <button 
              onClick={() => setIsConcluding(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 uppercase"
            >
              <CheckCircle2 className="w-6 h-6" />
              FINALIZAR Y REPORTAR RESULTADOS
            </button>
          )}

          {isConcluding && (
            <div className="space-y-8 animate-in slide-in-from-top-4 duration-300 uppercase">
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
                <h3 className="font-black text-emerald-500 text-lg uppercase">REPORTE DE CONCLUSIÓN</h3>
                <div className="space-y-5">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-400 uppercase">LUGAR DE TERMINO</span>
                    <input type="text" required className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase opacity-75" value={concLocation} onChange={e => setConcLocation(removeAccents(e.target.value))} />
                  </label>

                  {isReunionVecinal ? (
                    /* Reunion Vecinal Fields */
                    <div className="space-y-4 p-4 bg-slate-950 rounded-2xl border border-blue-500/20">
                      <h4 className="text-blue-500 font-black text-xs">DATOS DE LA REUNION VECINAL</h4>
                      <label className="block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">NOMBRE DEL REPRESENTANTE</span>
                        <input type="text" required className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white" value={repName} onChange={e => setRepName(removeAccents(e.target.value))} placeholder="NOMBRE COMPLETO" />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">NUMERO TELEFONICO</span>
                        <input type="tel" required className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white font-mono" value={repPhone} onChange={e => setRepPhone(e.target.value)} placeholder="10 DIGITOS" />
                      </label>
                      <div className="grid grid-cols-1">
                        <InputCounter label="CANTIDAD DE PARTICIPANTES" value={partCount} onChange={setPartCount} />
                      </div>
                      <label className="block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">SOLICITUDES / PETICIONES</span>
                        <textarea rows={3} required className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white" value={petitions} onChange={e => setPetitions(removeAccents(e.target.value))} placeholder="DETALLE LAS PETICIONES..." />
                      </label>
                    </div>
                  ) : (
                    /* Standard Operative Fields */
                    <>
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">COLONIAS CUBIERTAS</span>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-slate-950 rounded-xl border border-slate-800 custom-scrollbar uppercase">
                          {regionColonies.map(c => (
                            <button key={c} type="button" onClick={() => toggleColony(c)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase ${coveredCols.includes(c) ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{c}</button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <InputCounter label="TRANSP. PUBLICO" value={publicTransport} onChange={setPublicTransport} />
                        <InputCounter label="PARTICULARES" value={privateVehicles} onChange={setPrivateVehicles} />
                        <InputCounter label="MOTOCICLETAS" value={motorcycles} onChange={setMotorcycles} />
                        <InputCounter label="PERSONAS" value={people} onChange={setPeople} />
                      </div>
                    </>
                  )}

                  <label className="block">
                    <span className="text-xs font-bold text-slate-400 uppercase">RESULTADO</span>
                    <select className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase" value={result} onChange={e => setResult(e.target.value as ResultType)}>
                      <option value="DISUACION">DISUACION</option>
                      {!isReunionVecinal && <option value="DETENIDOS AL JUEZ CIVICO">DETENIDOS AL JUEZ CIVICO</option>}
                      {!isReunionVecinal && <option value="PUESTA A LA FISCALIA">PUESTA A LA FISCALIA</option>}
                    </select>
                  </label>

                  {!isReunionVecinal && result !== 'DISUACION' && (
                    <div className="p-4 bg-slate-950 border border-blue-500/30 rounded-xl space-y-4 uppercase">
                      <InputCounter label="DETENIDOS" value={detaineesCount} onChange={setDetaineesCount} />
                      {result === 'DETENIDOS AL JUEZ CIVICO' && <textarea className="w-full bg-slate-900 rounded p-2 text-sm text-white uppercase" placeholder="MOTIVO" value={detentionReason} onChange={e => setDetentionReason(removeAccents(e.target.value))} />}
                      {result === 'PUESTA A LA FISCALIA' && <div className="space-y-2 uppercase"><input className="w-full bg-slate-900 p-2 text-sm rounded text-white uppercase" placeholder="DELITO" value={crimeType} onChange={e => setCrimeType(removeAccents(e.target.value))} /><input className="w-full bg-slate-900 p-2 text-sm rounded text-white uppercase" placeholder="FISCALIA" value={fiscaliaTarget} onChange={e => setFiscaliaTarget(removeAccents(e.target.value))} /></div>}
                    </div>
                  )}
                </div>
                <div className="flex gap-4 uppercase">
                  <button onClick={() => setIsConcluding(false)} className="flex-1 py-4 bg-slate-800 rounded-xl font-bold uppercase">CANCELAR</button>
                  <button onClick={handleFinish} className="flex-1 py-4 bg-emerald-600 rounded-xl font-black uppercase">CONFIRMAR</button>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const StatBox: React.FC<{ icon: React.ReactNode, label: string, value: number, color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center gap-3 uppercase">
    <div className={`p-2 bg-slate-900 rounded-lg ${color}`}>
      {/* Cast icon to any to bypass type error for icon cloning */}
      {React.cloneElement(icon as any, { className: "w-4 h-4" })}
    </div>
    <div className="overflow-hidden">
      <p className="text-[9px] text-slate-600 uppercase font-black truncate">{label}</p>
      <p className="font-black text-white">{value}</p>
    </div>
  </div>
);

const InputCounter: React.FC<{ label: string, value: number, onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1 uppercase">
    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">{label}</span>
    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white transition-colors">-</button>
      <input type="number" className="flex-1 bg-transparent text-center text-sm font-bold focus:outline-none text-white" value={value} onChange={e => onChange(parseInt(e.target.value) || 0)} />
      <button type="button" onClick={() => onChange(value + 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white transition-colors">+</button>
    </div>
  </div>
);

export default OperativeDetails;