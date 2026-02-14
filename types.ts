
export type Role = 'ADMIN' | 'DIRECTOR' | 'REGIONAL' | 'SHIFT_LEADER' | 'QUADRANT_LEADER' | 'PATROLMAN' | 'JEFE_AGRUPAMIENTO' | 'ANALISTA';

export interface User {
  id: string;
  fullName: string;
  username: string;
  password?: string;
  role: Role;
  assignedRegion?: string;
  isAgrupamiento?: boolean;
}

export type Shift = 'Primero' | 'Segundo' | 'Diario';

export type Rank = 'Comisario' | 'Subdirector' | 'Tecnico Operativo' | 'Encargado Regonal' | 'Jefe de turno' | 'Jefe de Cuadrante' | 'Patrullero';

export type ResultType = 'DISUACION' | 'DETENIDOS AL JUEZ CIVICO' | 'PUESTA A LA FISCALIA';

export interface LocationData {
  latitude: number;
  longitude: number;
  colony: string;
  street: string;
  corner: string;
}

export interface Unit {
  id: string;
  type: string;
  unitNumber: string;
  inCharge: string;
  rank: Rank;
  personnelCount: number;
}

export interface Institution {
  id: string;
  name: string;
  personnelCount: number;
  unitCount: number;
}

export interface ReunionVecinalDetails {
  representativeName: string;
  phone: string;
  participantCount: number;
  petitions: string;
}

export interface ConclusionData {
  location: string;
  coloniesCovered: string[];
  publicTransportChecked: number;
  privateVehiclesChecked: number;
  motorcyclesChecked: number;
  peopleChecked: number;
  result: ResultType;
  detaineesCount?: number;
  detentionReason?: string;
  crimeType?: string;
  fiscaliaTarget?: string;
  reunionDetails?: ReunionVecinalDetails;
  concludedAt: string;
}

export interface Operative {
  id: string;
  type: string;
  specificType?: string;
  startDate: string;
  startTime: string;
  status: 'ACTIVO' | 'CONCLUIDO';
  region: string;
  quadrant: string;
  shift: Shift;
  location: LocationData;
  units: Unit[];
  institutions: Institution[];
  conclusion?: ConclusionData;
  createdBy: string; // User ID
}

export interface CatalogEntry {
  region: string;
  quadrant: string;
  colony: string;
}
