
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  MapPin, 
  Plus, 
  Building2, 
  UserPlus, 
  Trash2, 
  Save,
  Crosshair,
  Map as MapIcon,
  Shield,
  Locate
} from 'lucide-react';
import { 
  Operative, 
  Unit, 
  Institution, 
  Rank, 
  Shift,
  User,
  CatalogEntry
} from '../types';
import { 
  RANKS, 
  REGIONS, 
  REGION_QUADRANTS, 
  ALL_QUADRANTS,
  INSTITUTIONS
} from '../constants';
import { generateOperativeId, getGeolocation, formatTime, formatDate, removeAccents } from '../utils';

interface NewOperativeProps {
  operatives: Operative[];
  addOperative: (op: Operative) => void;
  opTypes: string[];
  user: User;
  coloniaCatalog: CatalogEntry[];
}

const NewOperative: React.FC<NewOperativeProps> = ({ operatives, addOperative, opTypes, user, coloniaCatalog }) => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
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

  const [institutions, setInstitutions] = useState<Institution[]>([]);

  // Initialize Map
  useEffect(() => {
    if (mapRef.current && (window as any).google) {
      const ixtapalucaCenter = { lat: 19.3142, lng: -98.8821 };
      const googleMap = new (window as any).google.maps.Map(mapRef.current, {
        center: ixtapalucaCenter,
        zoom: 14,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
          { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
          { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
          { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
        ]
      });

      const initialMarker = new (window as any).google.maps.Marker({
        position: ixtapalucaCenter,
        map: googleMap,
        draggable: true,
        animation: (window as any).google.maps.Animation.DROP
      });

      initialMarker.addListener('dragend', () => {
        const pos = initialMarker.getPosition();
        setLatitude(pos.lat());
        setLongitude(pos.lng());
      });

      googleMap.addListener('click', (e: any) => {
        initialMarker.setPosition(e.latLng);
        setLatitude(e.latLng.lat());
        setLongitude(e.latLng.lng());
      });

      setMap(googleMap);
      setMarker(initialMarker);
    }
  }, []);

  const availableQuadrants = useMemo(() => {
    if (REGION_QUADRANTS[region]) {
      return REGION_QUADRANTS[region];
    }
    return ALL_QUADRANTS;
  }, [region]);

  const availableColonies = useMemo(() => {
    if (quadrant) {
      return coloniaCatalog.filter(c => c.quadrant === quadrant).map(c => c.colony);
    }
    return Array.from(new Set(coloniaCatalog.map(c => c.colony))).sort();
  }, [quadrant, coloniaCatalog]);

  const handleRegionChange = (val: string) => {
    setRegion(val);
    setQuadrant("");
    setColony("");
  };

  const handleQuadrantChange = (val: string) => {
    setQuadrant(val);
    setColony("");
  };

  const handleAutoDetect = async () => {
    setLoadingLocation(true);
    try {
      const pos = await getGeolocation();
      const newLat = pos.coords.latitude;
      const newLng = pos.coords.longitude;
      setLatitude(newLat);
      setLongitude(newLng);
      
      if (map && marker) {
        const newPos = { lat: newLat, lng: newLng };
        map.setCenter(newPos);
        marker.setPosition(newPos);
      }
    } catch (err) {
      alert("NO SE PUDO OBTENER LA UBICACION.");
    } finally {
      setLoadingLocation(false);
    }
  };

  const addUnit = () => {
    setUnits([...units, {
      id: Math.random().toString(36).substr(2, 9),
      type: "PATRULLA",
      unitNumber: "",
      inCharge: "",
      rank: "Patrullero",
      personnelCount: 2
    }]);
  };

  const updateUnit = (id: string, field: keyof Unit, value: any) => {
    let finalValue = value;
    if (typeof value === 'string' && field !== 'id') {
      finalValue = removeAccents(value);
    }
    setUnits(units.map(u => u.id === id ? { ...u, [field]: finalValue } : u));
  };

  const removeUnit = (id: string) => {
    if (units.length > 1) setUnits(units.filter(u => u.id !== id));
  };

  const addInstitution = () => {
    setInstitutions([...institutions, {
      id: Math.random().toString(36).substr(2, 9),
      name: INSTITUTIONS[0],
      personnelCount: 1,
      unitCount: 1
    }]);
  };

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
      region,
      quadrant,
      shift: removeAccents(shift) as Shift,
      location: {
        latitude,
        longitude,
        colony: removeAccents(colony),
        street: removeAccents(street),
        corner: removeAccents(corner)
      },
      units,
      institutions,
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
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm uppercase"
            >
              {opTypes.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="OTRO OPERATIVO">OTRO OPERATIVO</option>
            </select>

            {type === "OTRO OPERATIVO" && (
              <input 
                type="text"
                required
                placeholder="ESCRIBA EL NOMBRE DEL OPERATIVO..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 animate-in zoom-in-95 text-sm uppercase"
                value={specificType}
                onChange={(e) => setSpecificType(removeAccents(e.target.value))}
              />
            )}
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">ZONA Y UBICACION</h3>
            </div>
            <button 
              type="button"
              onClick={handleAutoDetect}
              className="text-blue-500 text-[10px] font-black hover:bg-blue-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors uppercase border border-blue-500/20"
            >
              <Locate className={`w-3 h-3 ${loadingLocation ? 'animate-spin' : ''}`} />
              MI UBICACION
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs text-slate-500 uppercase font-bold">1. REGION</span>
                <select 
                  className={`mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none uppercase ${!canChooseRegion ? 'opacity-50 pointer-events-none' : ''}`}
                  value={region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  disabled={!canChooseRegion}
                >
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-slate-500 uppercase font-bold">2. CUADRANTE</span>
                <select 
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none uppercase"
                  value={quadrant}
                  onChange={(e) => handleQuadrantChange(e.target.value)}
                  required
                >
                  <option value="">-- SELECCIONAR --</option>
                  {availableQuadrants.map(q => <option key={q} value={q}>C-{q}</option>)}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs text-slate-500 uppercase font-bold">3. COLONIA</span>
              <select 
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none uppercase"
                value={colony}
                onChange={(e) => setColony(e.target.value)}
                required
              >
                <option value="">-- SELECCIONAR --</option>
                {availableColonies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <label className="block">
                <span className="text-xs text-slate-500 uppercase font-bold">CALLE</span>
                <input 
                  type="text" required
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none uppercase"
                  placeholder="CALLE O AVENIDA"
                  value={street}
                  onChange={e => setStreet(removeAccents(e.target.value))}
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 uppercase font-bold">ESQUINA</span>
                <input 
                  type="text" required
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none uppercase"
                  placeholder="CRUCE CON..."
                  value={corner}
                  onChange={e => setCorner(removeAccents(e.target.value))}
                />
              </label>
            </div>

            {/* Google Map Section */}
            <div className="space-y-2 mt-4">
               <span className="text-xs text-slate-500 uppercase font-bold">MAPA DE UBICACION (ARRASTRA EL MARCADOR)</span>
               <div 
                 ref={mapRef} 
                 className="w-full h-64 rounded-2xl border border-slate-800 shadow-inner bg-slate-950 overflow-hidden"
               />
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-center">
                    <p className="text-[9px] text-slate-500 font-bold">LATITUD</p>
                    <p className="text-xs font-mono text-blue-400">{latitude.toFixed(6)}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-center">
                    <p className="text-[9px] text-slate-500 font-bold">LONGITUD</p>
                    <p className="text-xs font-mono text-blue-400">{longitude.toFixed(6)}</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs text-slate-500 uppercase font-bold">TURNO</span>
                <select 
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none uppercase"
                  value={shift}
                  onChange={(e) => setShift(e.target.value as Shift)}
                >
                  <option value="Primero">PRIMERO</option>
                  <option value="Segundo">SEGUNDO</option>
                  <option value="Diario">DIARIO</option>
                </select>
              </label>
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
                  <span className="text-[10px] font-black uppercase text-slate-600 tracking-tighter">RESPONSABLE #{index + 1}</span>
                  {units.length > 1 && (
                    <button type="button" onClick={() => removeUnit(unit.id)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs text-slate-500">CARGO</span>
                    <select 
                      className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white uppercase"
                      value={unit.rank}
                      onChange={e => updateUnit(unit.id, 'rank', e.target.value)}
                    >
                      {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-500">NOMBRE COMPLETO</span>
                    <input 
                      type="text" required
                      className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                      value={unit.inCharge}
                      onChange={e => updateUnit(unit.id, 'inCharge', e.target.value)}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs text-slate-500">NO. UNIDAD</span>
                    <input 
                      type="text" required
                      className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                      placeholder="IX-000"
                      value={unit.unitNumber}
                      onChange={e => updateUnit(unit.id, 'unitNumber', e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-500">ELEMENTOS</span>
                    <input 
                      type="number" 
                      className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                      value={unit.personnelCount}
                      onChange={e => updateUnit(unit.id, 'personnelCount', parseInt(e.target.value) || 0)}
                    />
                  </label>
                </div>
              </div>
            ))}

            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={addUnit}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors uppercase"
              >
                <Plus className="w-4 h-4" /> AGREGAR UNIDAD
              </button>
              <button 
                type="button" 
                onClick={addInstitution}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-900/20 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-900/30 transition-colors uppercase"
              >
                <Building2 className="w-4 h-4" /> INSTITUCION
              </button>
            </div>
          </div>
        </section>

        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2 sticky bottom-4 z-10 active:scale-95 uppercase"
        >
          <Save className="w-6 h-6" />
          INICIAR OPERATIVO
        </button>
      </form>
    </div>
  );
};

export default NewOperative;
