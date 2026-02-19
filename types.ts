
export type Role = 'ADMIN' | 'DIRECTOR' | 'REGIONAL' | 'JEFE_DE_TURNO' | 'JEFE_DE_CUADRANTE' | 'PATRULLERO' | 'JEFE_AGRUPAMIENTO' | 'ANALISTA';

export interface User {
  id: string;
  fullName: string;
  username: string;
  password?: string;
  role: Role;
  assignedRegion?: string;
  isAgrupamiento?: boolean;
  phoneNumber?: string;
  payrollNumber?: string;
}

export type Shift = 'Primero' | 'Segundo' | 'Diario';

export type Rank = string;

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
  phoneNumber?: string;
}

export interface Corporation {
  id: string;
  name: string;
  personnelCount: number;
  unitCount: number;
  unitNumber: string;
  inCharge: string;
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
  meetingTopic?: string;
  startDate: string;
  startTime: string;
  status: 'ACTIVO' | 'CONCLUIDO';
  region: string;
  quadrant: string;
  shift: Shift;
  location: LocationData;
  units: Unit[];
  corporations: Corporation[];
  conclusion?: ConclusionData;
  createdBy: string; // User ID
}

export interface CatalogEntry {
  region: string;
  quadrant: string;
  colony: string;
}
