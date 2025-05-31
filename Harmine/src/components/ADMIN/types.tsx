export const COURIER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

export const COVERAGE_ZONES = {
  PARIS_CENTRE: 'Paris Centre',
  PARIS_NORD: 'Paris Nord',
  PARIS_SUD: 'Paris Sud',
  PARIS_EST: 'Paris Est',
  PARIS_OUEST: 'Paris Ouest',
  BANLIEUE_PROCHE: 'Banlieue Proche'
};

export type ChatMessage = {
  id: number;
  text: string;
  timestamp: Date;
  senderId: number;
};

export interface Courier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  experience: string;
  vehicle: string;
  coverageZone: string;
  motivation: string;
  status: COURIER_STATUS;
  photo: string | File;
  deliveriesCount?: number; // Ajouté, optionnel pour les coursiers non transférés
}