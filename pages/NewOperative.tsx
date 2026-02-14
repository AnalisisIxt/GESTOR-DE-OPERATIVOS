
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { 
  ChevronLeft, 
  MapPin, 
  Plus, 
  Building2, 
  UserPlus, 
  Trash2, 
  Save,
  Shield,
  Locate,
  X,
  User as UserIcon,
  RefreshCw
} from 'lucide-react';
import { 
  Operative, 
  Unit, 
  Corporation, 
  Rank, 
  Shift,
  User,
  CatalogEntry
} from '../types';
import { 
  RANKS, 
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
}

const NewOperative: React.FC<NewOperativeProps> = ({ operatives, addOperative, opTypes, user, coloniaCatalog, corporationsCatalog }) => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [type, setType] = useState(opTypes[0]);
  const [specificType, setSpecificType] = useState("");
  const [region, setRegion] = useState(user.assignedRegion || REGIONS[0]);
  const [quadrant, setQuadrant] = useState("");
  const [shift, setShift] = useState<Shift>("Primero");
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
    rank: "Patrullero",
    personnelCount: 2
  }]);

  const [corporations, setCorporations] = useState<Corporation[]>([]);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      const ixtapalucaCenter: [number, number] = [19.3142, -98.8821];
      const map = L.map(mapRef.current, { center: ixtapalucaCenter, zoom: 14, zoomControl: false });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(map);
      const customIcon = L.divIcon({
        html: `<div class="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center animate-pulse"><div class="w-2 h-2 bg-white rounded-full"></div></div>`,
        iconSize: [24, 24], iconAnchor: [12, 12]
      });
      const marker = L.marker(ixtapalucaCenter, { draggable: true, icon: customIcon }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setLatitude(pos.lat);
        setLongitude(pos.lng);
      });
      mapInstance.current = map;
      markerInstance.current = marker;
    }
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, []);

  const availableQuadrants = useMemo(() => REGION_QUADRANTS[region] || ALL_QUADRANTS, [region]);
  const availableColonies = useMemo(() => {
    if (quadrant) return coloniaCatalog.filter(c => c.quadrant === quadrant).map(c => c.colony);
    return Array.from(new Set(coloniaCatalog.map(c => c.colony))).sort();
  }, [quadrant, coloniaCatalog]);

  const handleAutoDetect = async () => {
    setLoadingLocation(true);
    try {
      const pos = await getGeolocation();
      const newLat = pos.coords.latitude;
      const newLng = pos.coords.longitude;
      setLatitude(newLat); 
      setLongitude(newLng);
      if (mapInstance.current && markerInstance.current) {
        mapInstance.current.setView([newLat, newLng], 16);
        markerInstance.current.setLatLng([newLat, newLng]);
      }
    } catch (err) { alert("NO SE PUDO OBTENER LA UBICACION."); } finally { setLoadingLocation(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const today = new Date();
    const prefix = `OP${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const todayOpsCount = operatives.filter(op => op.id.startsWith(prefix)).length;
    
    const newOp: Operative = {
      id: generateOperativeId(today, todayOpsCount + 1),
      type: type === "OTRO OPERATIVO" ? removeAccents(specificType) : type,
      startDate: formatDate(today).split('/').reverse().join('-'), 
      startTime: formatTime(today),
      status: 'ACTIVO',
      region, quadrant, shift: removeAccents(shift) as Shift,
      location: { latitude, longitude, colony: removeAccents(colony), street: removeAccents(street), corner: removeAccents(corner) },
      units, corporations, createdBy: user.id
    };

    try {
      await addOperative(newOp);
      navigate('/');
    } catch (err) {
      alert("ERROR AL GUARDAR EN EL SERVIDOR.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pb-10 max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-10 duration-500 uppercase">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-900 rounded-full transition-colors text-slate-400">
          <ChevronLeft className="w-8 h-8" />
        </button>
        <h2 className="text-xl font-bold">REGISTRO OPERATIVO</h2>
        <div className="w-10" />
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ... Secciones de formulario idénticas ... */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
           <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
             <Shield className="w-5 h-5 text-blue-500" />
             <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">TIPO DE OPERATIVO</h3>
           </div>
           <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase outline-none">
              {opTypes.map(t => <option key={t} value={t}>{t}</option>)}
           </select>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
           <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
             <MapPin className="w-5 h-5 text-blue-500" />
             <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">UBICACIÓN</h3>
           </div>
           <div className="grid grid-cols-2 gap-4">
             <input type="text" required placeholder="CALLE" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" value={street} onChange={e => setStreet(removeAccents(e.target.value))} />
             <input type="text" required placeholder="ESQUINA" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" value={corner} onChange={e => setCorner(removeAccents(e.target.value))} />
           </div>
           <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase" value={colony} onChange={(e) => setColony(e.target.value)} required>
             <option value="">-- SELECCIONAR COLONIA --</option>
             {availableColonies.map(c => <option key={c} value={c}>{c}</option>)}
           </select>
           <div ref={mapRef} className="w-full h-48 rounded-xl border border-slate-800" />
        </section>

        <button 
          type="submit" 
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase"
        >
          {isSaving ? (
            <><RefreshCw className="w-6 h-6 animate-spin" /> ENVIANDO DATOS...</>
          ) : (
            <><Save className="w-6 h-6" /> INICIAR OPERATIVO</>
          )}
        </button>
      </form>
    </div>
  );
};

export default NewOperative;
