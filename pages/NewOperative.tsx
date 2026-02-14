
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
  User as UserIcon
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
  addOperative: (op: Operative) => void;
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

  // Initialize Map with Leaflet
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      const ixtapalucaCenter: [number, number] = [19.3142, -98.8821];
      
      const map = L.map(mapRef.current, {
        center: ixtapalucaCenter,
        zoom: 14,
        zoomControl: false
      });

      // Dark Theme Tiles (using CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // Custom Icon for Leaflet to avoid dependency issues with default icons
      const customIcon = L.divIcon({
        html: `<div class="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center animate-pulse"><div class="w-2 h-2 bg-white rounded-full"></div></div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker(ixtapalucaCenter, {
        draggable: true,
        icon: customIcon
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setLatitude(pos.lat);
        setLongitude(pos.lng);
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setLatitude(e.latlng.lat);
        setLongitude(e.latlng.lng);
      });

      mapInstance.current = map;
      markerInstance.current = marker;
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const availableQuadrants = useMemo(() => {
    return REGION_QUADRANTS[region] || ALL_QUADRANTS;
  }, [region]);

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
        const newPos: [number, number] = [newLat, newLng];
        mapInstance.current.setView(newPos, 16);
        markerInstance.current.setLatLng(newPos);
      }
    } catch (err) { 
      alert("NO SE PUDO OBTENER LA UBICACION."); 
    } finally { 
      setLoadingLocation(false); 
    }
  };

  const addUnit = () => {
    setUnits([...units, { id: Math.random().toString(36).substr(2, 9), type: "PATRULLA", unitNumber: "", inCharge: "", rank: "Patrullero", personnelCount: 2 }]);
  };

  const updateUnit = (id: string, field: keyof Unit, value: any) => {
    setUnits(units.map(u => u.id === id ? { ...u, [field]: typeof value === 'string' ? removeAccents(value) : value } : u));
  };

  const removeUnit = (id: string) => { if (units.length > 1) setUnits(units.filter(u => u.id !== id)); };

  const addCorporation = () => {
    if (corporationsCatalog.length === 0) {
      alert("PRIMERO DEBE REGISTRAR CORPORACIONES EN EL PANEL DE ADMINISTRACIÓN");
      return;
    }
    setCorporations([...corporations, {
      id: Math.random().toString(36).substr(2, 9),
      name: corporationsCatalog[0],
      inCharge: "",
      personnelCount: 1,
      unitCount: 1,
      unitNumber: ""
    }]);
  };

  const updateCorporation = (id: string, field: keyof Corporation, value: any) => {
    setCorporations(corporations.map(corp => corp.id === id ? { ...corp, [field]: typeof value === 'string' ? removeAccents(value) : value } : corp));
  };

  const removeCorporation = (id: string) => { setCorporations(corporations.filter(corp => corp.id !== id)); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date();
    const prefix = `OP${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const todayOpsCount = operatives.filter(op => op.id.startsWith(prefix)).length;
    
    const newOp: Operative = {
      id: generateOperativeId(today, todayOpsCount + 1),
      type: type === "OTRO OPERATIVO" ? removeAccents(specificType) : type,
      startDate: formatDate(today).split('/').reverse().join('-'), 
      startTime: formatTime(today),
      status: 'ACTIVO',
      region, quadrant,
      shift: removeAccents(shift) as Shift,
      location: { latitude, longitude, colony: removeAccents(colony), street: removeAccents(street), corner: removeAccents(corner) },
      units, corporations,
      createdBy: user.id
    };

    addOperative(newOp);
    navigate('/');
  };

  const canChooseRegion = user.role === 'ADMIN' || user.role === 'JEFE_AGRUPAMIENTO' || user.isAgrupamiento;

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
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <Shield className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">TIPO DE OPERATIVO</h3>
          </div>
          <div className="space-y-4">
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase outline-none">
              {opTypes.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="OTRO OPERATIVO">OTRO OPERATIVO</option>
            </select>
            {type === "OTRO OPERATIVO" && (
              <input type="text" required placeholder="ESCRIBA EL NOMBRE DEL OPERATIVO..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase outline-none" value={specificType} onChange={(e) => setSpecificType(removeAccents(e.target.value))} />
            )}
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">ZONA Y UBICACION</h3>
            </div>
            <button type="button" onClick={handleAutoDetect} className="text-blue-500 text-[10px] font-black hover:bg-blue-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors uppercase border border-blue-500/20">
              <Locate className={`w-3 h-3 ${loadingLocation ? 'animate-spin' : ''}`} /> MI UBICACION
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs text-slate-500 font-bold">1. REGION</span>
                <select className={`mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase ${!canChooseRegion ? 'opacity-50 pointer-events-none' : ''}`} value={region} onChange={(e) => { setRegion(e.target.value); setQuadrant(""); setColony(""); }} disabled={!canChooseRegion}>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 font-bold">2. CUADRANTE</span>
                <select className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase" value={quadrant} onChange={(e) => { setQuadrant(e.target.value); setColony(""); }} required>
                  <option value="">-- SELECCIONAR --</option>
                  {availableQuadrants.map(q => <option key={q} value={q}>C-{q}</option>)}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-xs text-slate-500 font-bold">3. COLONIA</span>
              <select className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase" value={colony} onChange={(e) => setColony(e.target.value)} required>
                <option value="">-- SELECCIONAR --</option>
                {availableColonies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <label className="block">
                <span className="text-xs text-slate-500 font-bold">CALLE</span>
                <input type="text" required className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase outline-none" placeholder="CALLE O AVENIDA" value={street} onChange={e => setStreet(removeAccents(e.target.value))} />
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 font-bold">ESQUINA</span>
                <input type="text" required className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white uppercase outline-none" placeholder="CRUCE CON..." value={corner} onChange={e => setCorner(removeAccents(e.target.value))} />
              </label>
            </div>
            {/* Map Container */}
            <div className="relative">
              <div ref={mapRef} className="w-full h-64 rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden z-10" />
              <div className="absolute bottom-2 right-2 z-20 bg-slate-900/80 px-2 py-1 rounded text-[8px] font-mono text-slate-500">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <UserPlus className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">PERSONAL RESPONSABLE</h3>
          </div>
          <div className="space-y-6">
            {units.map((unit, index) => (
              <div key={unit.id} className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-600 tracking-tighter uppercase">UNIDAD MUNICIPAL #{index + 1}</span>
                  {units.length > 1 && <button type="button" onClick={() => removeUnit(unit.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs text-slate-500 font-bold">CARGO</span>
                    <select className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white uppercase outline-none" value={unit.rank} onChange={e => updateUnit(unit.id, 'rank', e.target.value)}>
                      {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-500 font-bold">NOMBRE COMPLETO</span>
                    <input type="text" required className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white uppercase outline-none" value={unit.inCharge} onChange={e => updateUnit(unit.id, 'inCharge', e.target.value)} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs text-slate-500 font-bold">NO. UNIDAD</span>
                    <input type="text" required className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white uppercase outline-none" placeholder="IX-000" value={unit.unitNumber} onChange={e => updateUnit(unit.id, 'unitNumber', e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-500 font-bold">ELEMENTOS</span>
                    <input type="number" className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none" value={unit.personnelCount} onChange={e => updateUnit(unit.id, 'personnelCount', parseInt(e.target.value) || 0)} />
                  </label>
                </div>
              </div>
            ))}

            {corporations.length > 0 && (
              <div className="space-y-4 pt-2">
                <h4 className="text-[10px] font-black text-blue-500 tracking-widest uppercase">OTRAS CORPORACIONES</h4>
                {corporations.map((corp, index) => (
                  <div key={corp.id} className="p-4 bg-blue-950/20 border border-blue-900/40 rounded-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-blue-900/20 pb-2">
                       <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-400" />
                          <select 
                            className="bg-transparent text-sm font-black text-blue-400 uppercase outline-none cursor-pointer"
                            value={corp.name}
                            onChange={e => updateCorporation(corp.id, 'name', e.target.value)}
                          >
                            {corporationsCatalog.map(ic => <option key={ic} value={ic} className="bg-slate-950">{ic}</option>)}
                          </select>
                       </div>
                       <button type="button" onClick={() => removeCorporation(corp.id)} className="text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                    
                    <label className="block">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">QUIEN VIENE A CARGO</span>
                      <div className="relative mt-1">
                        <UserIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                        <input 
                          type="text" 
                          required 
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-8 pr-2 text-xs text-white uppercase outline-none" 
                          placeholder="NOMBRE DEL RESPONSABLE"
                          value={corp.inCharge} 
                          onChange={e => updateCorporation(corp.id, 'inCharge', e.target.value)} 
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">NO. UNIDAD</span>
                      <input 
                        type="text" 
                        required 
                        className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white uppercase outline-none" 
                        placeholder="EJ. SEDENA-01"
                        value={corp.unitNumber} 
                        onChange={e => updateCorporation(corp.id, 'unitNumber', e.target.value)} 
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">CANT. UNIDADES</span>
                        <input type="number" className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none" value={corp.unitCount} onChange={e => updateCorporation(corp.id, 'unitCount', parseInt(e.target.value) || 0)} />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">ELEMENTOS</span>
                        <input type="number" className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none" value={corp.personnelCount} onChange={e => updateCorporation(corp.id, 'personnelCount', parseInt(e.target.value) || 0)} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <button type="button" onClick={addUnit} className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all uppercase">
                <Plus className="w-4 h-4" /> AGREGAR UNIDAD
              </button>
              <button type="button" onClick={addCorporation} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-900/20 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-900/30 transition-all uppercase">
                <Building2 className="w-4 h-4" /> CORPORACION
              </button>
            </div>
          </div>
        </section>

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase">
          <Save className="w-6 h-6" /> INICIAR OPERATIVO
        </button>
      </form>
    </div>
  );
};

export default NewOperative;
