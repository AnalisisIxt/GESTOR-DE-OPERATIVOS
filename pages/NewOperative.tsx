
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { 
  ChevronLeft, 
  MapPin, 
  Plus, 
  Trash2, 
  Save,
  Shield,
  Locate,
  X,
  RefreshCw,
  Car,
  Target,
  Building2,
  Phone,
  MessageSquare
} from 'lucide-react';
import { 
  Operative, 
  Unit, 
  Corporation, 
  User,
  CatalogEntry
} from '../types';
import { 
  REGIONS, 
  REGION_QUADRANTS,
  ALL_QUADRANTS
} from '../constants';
import { generateOperativeId, getGeolocation, formatTime, formatDate, removeAccents } from '../utils';

interface NewOperativeProps {
  operatives: Operative[];
  addOperative: (op: Operative) => Promise<void>;
  opTypes: string[];
  user: User;
  coloniaCatalog: CatalogEntry[];
  corporationsCatalog: string[];
  ranksCatalog: string[];
  meetingTopicsCatalog: string[];
}

const NewOperative: React.FC<NewOperativeProps> = ({ 
  operatives, addOperative, opTypes, user, coloniaCatalog, corporationsCatalog, ranksCatalog, meetingTopicsCatalog 
}) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // Form State
  const [type, setType] = useState(opTypes[0] || "");
  const [meetingTopic, setMeetingTopic] = useState("");
  const [region, setRegion] = useState(user.assignedRegion || REGIONS[0]);
  const [quadrant, setQuadrant] = useState("");
  const [colony, setColony] = useState("");
  const [street, setStreet] = useState("");
  const [corner, setCorner] = useState("");
  const [latitude, setLatitude] = useState(19.3142); 
  const [longitude, setLongitude] = useState(-98.8821);
  
  const [units, setUnits] = useState<Unit[]>([{
    id: Math.random().toString(36).substr(2, 9),
    type: "PATRULLA",
    unitNumber: "",
    inCharge: removeAccents(user.fullName),
    rank: ranksCatalog[0] || "Patrullero",
    personnelCount: 2,
    phoneNumber: user.phoneNumber || ''
  }]);

  const [corporations, setCorporations] = useState<Corporation[]>([]);

  const isReunion = useMemo(() => type.includes("REUNION VECINAL"), [type]);

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapInstance.current) {
      const initialCoords: L.LatLngExpression = [latitude, longitude];
      
      mapInstance.current = L.map(mapContainerRef.current, {
        center: initialCoords,
        zoom: 15,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);

      markerInstance.current = L.marker(initialCoords, { draggable: true }).addTo(mapInstance.current);

      mapInstance.current.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const fixedLat = parseFloat(lat.toFixed(6));
        const fixedLng = parseFloat(lng.toFixed(6));
        markerInstance.current?.setLatLng([fixedLat, fixedLng]);
        setLatitude(fixedLat);
        setLongitude(fixedLng);
      });

      markerInstance.current.on('dragend', () => {
        const pos = markerInstance.current?.getLatLng();
        if (pos) {
          const fixedLat = parseFloat(pos.lat.toFixed(6));
          const fixedLng = parseFloat(pos.lng.toFixed(6));
          setLatitude(fixedLat);
          setLongitude(fixedLng);
        }
      });

      setTimeout(() => mapInstance.current?.invalidateSize(), 300);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const isAgrupamiento = useMemo(() => !region.startsWith("REGION "), [region]);
  const availableQuadrants = useMemo(() => isAgrupamiento ? ALL_QUADRANTS : (REGION_QUADRANTS[region] || []), [region, isAgrupamiento]);
  
  const availableColonies = useMemo(() => {
    if (!quadrant) return [];
    return coloniaCatalog
      .filter(c => (isAgrupamiento ? true : c.region === region) && c.quadrant === quadrant)
      .map(c => c.colony)
      .sort();
  }, [region, quadrant, coloniaCatalog, isAgrupamiento]);

  const handleAutoDetect = async () => {
    setLoadingLocation(true);
    try {
      const pos = await getGeolocation();
      const newLat = parseFloat(pos.coords.latitude.toFixed(6));
      const newLng = parseFloat(pos.coords.longitude.toFixed(6));
      setLatitude(newLat); 
      setLongitude(newLng);
      if (mapInstance.current && markerInstance.current) {
        const newPos: L.LatLngExpression = [newLat, newLng];
        mapInstance.current.setView(newPos, 16);
        markerInstance.current.setLatLng(newPos);
      }
    } catch (err) { 
      alert("ERROR GPS: VERIFIQUE PERMISOS."); 
    } finally { 
      setLoadingLocation(false); 
    }
  };

  const addUnit = () => setUnits([...units, { id: Math.random().toString(36).substr(2, 9), type: "PATRULLA", unitNumber: "", inCharge: "", rank: ranksCatalog[0] || "Patrullero", personnelCount: 2, phoneNumber: '' }]);
  const updateUnit = (id: string, field: keyof Unit, value: any) => setUnits(units.map(u => u.id === id ? { ...u, [field]: value } : u));
  const removeUnit = (id: string) => units.length > 1 && setUnits(units.filter(u => u.id !== id));

  const addCorp = () => setCorporations([...corporations, { id: Math.random().toString(36).substr(2, 9), name: corporationsCatalog[0], personnelCount: 5, unitCount: 1, unitNumber: "", inCharge: "" }]);
  const updateCorp = (id: string, field: keyof Corporation, value: any) => setCorporations(corporations.map(c => c.id === id ? { ...c, [field]: value } : c));
  const removeCorp = (id: string) => setCorporations(corporations.filter(c => c.id !== id));

  const handleUnitPhoneChange = (id: string, value: string) => {
    const val = value.replace(/\D/g, '').slice(0, 10);
    updateUnit(id, 'phoneNumber', val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quadrant || !colony || !street) { alert("UBICACION INCOMPLETA."); return; }
    if (isReunion && !meetingTopic) { alert("POR FAVOR SELECCIONE LA TEMATICA DE LA REUNION."); return; }
    
    setIsSaving(true);
    const today = new Date();
    
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const prefix = `OP${yy}${mm}${dd}`;
    
    const todayOpsCount = operatives.filter(op => op.id.startsWith(prefix)).length;
    
    const fixedLat = parseFloat(latitude.toFixed(6));
    const fixedLng = parseFloat(longitude.toFixed(6));

    const newOp: Operative = {
      id: generateOperativeId(today, todayOpsCount + 1),
      type, 
      meetingTopic: isReunion ? meetingTopic : undefined,
      startDate: formatDate(today).split('/').reverse().join('-'), startTime: formatTime(today),
      status: 'ACTIVO', region, quadrant, shift: "Primero",
      location: { 
        latitude: fixedLat, 
        longitude: fixedLng, 
        colony: removeAccents(colony), 
        street: removeAccents(street), 
        corner: removeAccents(corner) 
      },
      units, corporations, createdBy: user.id
    };
    try { await addOperative(newOp); navigate('/'); } catch (err) { alert("ERROR AL GUARDAR."); } finally { setIsSaving(false); }
  };

  return (
    <div className="pb-10 max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-10 duration-500 uppercase">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-900 rounded-full transition-colors text-slate-400"><ChevronLeft className="w-8 h-8" /></button>
        <h2 className="text-xl font-bold tracking-widest uppercase">NUEVO OPERATIVO</h2>
        <div className="w-10" />
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4"><Shield className="w-5 h-5 text-blue-500" /><h3 className="font-black text-slate-400 text-xs uppercase">DATOS GENERALES</h3></div>
          <div className="space-y-4">
            <select value={type} onChange={(e) => { setType(e.target.value); setMeetingTopic(""); }} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase outline-none focus:ring-2 focus:ring-blue-600">
              {opTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            
            {isReunion && (
              <div className="space-y-1 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-1 px-1">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase">TEMÁTICA DE LA REUNIÓN</span>
                </div>
                <select 
                  value={meetingTopic} 
                  onChange={(e) => setMeetingTopic(e.target.value)} 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">-- SELECCIONAR TEMÁTICA --</option>
                  {meetingTopicsCatalog.map(topic => <option key={topic} value={topic}>{topic}</option>)}
                  <option value="OTRA">OTRA (ESPECIFICAR EN NOTAS)</option>
                </select>
              </div>
            )}
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4"><MapPin className="w-5 h-5 text-emerald-500" /><h3 className="font-black text-slate-400 text-xs uppercase">UBICACIÓN</h3></div>
          <div className="grid grid-cols-2 gap-4">
            <select value={region} onChange={(e) => { setRegion(e.target.value); setQuadrant(""); setColony(""); }} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase outline-none">
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={quadrant} onChange={(e) => { setQuadrant(e.target.value); setColony(""); }} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase outline-none" required>
              <option value="">CUADRANTE...</option>
              {availableQuadrants.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <select value={colony} onChange={(e) => setColony(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase outline-none" required>
            <option value="">SELECCIONAR COLONIA...</option>
            {availableColonies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" required placeholder="CALLE" className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase outline-none" value={street} onChange={e => setStreet(removeAccents(e.target.value))} />
            <input type="text" placeholder="ESQUINA" className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase outline-none" value={corner} onChange={e => setCorner(removeAccents(e.target.value))} />
          </div>
          <div className="relative group">
            <div ref={mapContainerRef} style={{ height: '300px' }} className="w-full rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 z-0"></div>
            <button type="button" onClick={handleAutoDetect} className="absolute top-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-2xl z-20">
              {loadingLocation ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Locate className="w-5 h-5" />}
            </button>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3"><Car className="w-5 h-5 text-blue-400" /><h3 className="font-black text-slate-400 text-xs uppercase tracking-widest">UNIDAD DSyPCI</h3></div>
            <button type="button" onClick={addUnit} className="text-blue-500 font-black p-2 hover:bg-blue-500/10 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
          </div>
          {units.map((u, idx) => (
            <div key={u.id} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-5 relative animate-in slide-in-from-left-2">
              <button type="button" onClick={() => removeUnit(u.id)} className="absolute top-4 right-4 text-red-500/50 hover:text-red-500"><X className="w-4 h-4" /></button>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-600 ml-1">NO. UNIDAD</span>
                  <input type="text" placeholder="EJ. 123" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white uppercase outline-none focus:ring-1 focus:ring-blue-600" value={u.unitNumber} onChange={e => updateUnit(u.id, 'unitNumber', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-600 ml-1">OFICIAL AL MANDO</span>
                  <input type="text" placeholder="NOMBRE COMPLETO" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white uppercase outline-none focus:ring-1 focus:ring-blue-600" value={u.inCharge} onChange={e => updateUnit(u.id, 'inCharge', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-600 ml-1">CARGO / RANGO</span>
                  <select value={u.rank} onChange={e => updateUnit(u.id, 'rank', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white uppercase outline-none">
                    {ranksCatalog.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-600 ml-1">TELEFONO DE CONTACTO</span>
                  <input type="tel" maxLength={10} placeholder="10 DÍGITOS" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:ring-1 focus:ring-blue-600" value={u.phoneNumber} onChange={e => handleUnitPhoneChange(u.id, e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-600 ml-1">CANT. ELEMENTOS</span>
                  <input type="number" placeholder="0" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:ring-1 focus:ring-blue-600" value={u.personnelCount} onChange={e => updateUnit(u.id, 'personnelCount', parseInt(e.target.value) || 0)} />
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3"><Building2 className="w-5 h-5 text-purple-400" /><h3 className="font-black text-slate-400 text-xs uppercase tracking-widest">APOYO EXTERNO</h3></div>
            <button type="button" onClick={addCorp} className="text-purple-400 font-black p-2 hover:bg-purple-500/10 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-5">
            {corporations.map(c => (
              <div key={c.id} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-5 relative animate-in slide-in-from-right-2">
                <button type="button" onClick={() => removeCorp(c.id)} className="absolute top-4 right-4 text-red-500/50 hover:text-red-500"><X className="w-4 h-4" /></button>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-600 ml-1">CORPORACIÓN</span>
                    <select value={c.name} onChange={e => updateCorp(c.id, 'name', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white uppercase outline-none">
                      {corporationsCatalog.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-600 ml-1">NO. UNIDAD (ECONÓMICO)</span>
                    <input type="text" placeholder="NO. UNIDAD" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white uppercase outline-none focus:ring-1 focus:ring-blue-600" value={c.unitNumber} onChange={e => updateCorp(c.id, 'unitNumber', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-600 ml-1">MANDO A CARGO</span>
                    <input type="text" placeholder="NOMBRE RESPONSABLE" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white uppercase outline-none focus:ring-1 focus:ring-blue-600" value={c.inCharge} onChange={e => updateCorp(c.id, 'inCharge', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-600 ml-1">UNIDADES</span>
                      <input type="number" placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:ring-1 focus:ring-blue-600" value={c.unitCount} onChange={e => updateCorp(c.id, 'unitCount', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-600 ml-1">ELEMENTOS</span>
                      <input type="number" placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:ring-1 focus:ring-blue-600" value={c.personnelCount} onChange={e => updateCorp(c.id, 'personnelCount', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 font-black py-5 rounded-3xl shadow-xl flex items-center justify-center gap-3 uppercase text-lg transition-all active:scale-95">
          {isSaving ? <RefreshCw className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> INICIAR OPERATIVO</>}
        </button>
      </form>
    </div>
  );
};

export default NewOperative;
