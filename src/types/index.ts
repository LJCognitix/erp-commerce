export type ContactStatus = 'prospect' | 'client' | 'inactif' | 'partenaire';
export type ContactSource = 'LinkedIn' | 'Référence' | 'Site' | 'Autre';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  companyId?: string;
  tags: string[];
  notes: string;
  source: ContactSource;
  score: 1 | 2 | 3 | 4 | 5;
  lastContact: string;
  status: ContactStatus;
  createdAt: string;
}

export type CompanySize = 'TPE' | 'PME' | 'ETI' | 'GE';

export interface Company {
  id: string;
  name: string;
  siret: string;
  sector: string;
  size: CompanySize;
  website: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  estimatedRevenue: number;
  notes: string;
  createdAt: string;
}

export type PipelineStage = 'prospect' | 'contacté' | 'démo' | 'proposition' | 'négociation' | 'gagné' | 'perdu';

export interface Deal {
  id: string;
  title: string;
  contactId: string;
  companyId?: string;
  amount: number;
  probability: number;
  closingDate: string;
  stage: PipelineStage;
  owner: string;
  notes: string;
  createdAt: string;
}

export interface LineItem {
  id: string;
  designation: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  vat: number;
}

export type QuoteStatus = 'brouillon' | 'envoyé' | 'accepté' | 'refusé' | 'expiré';
export type InvoiceStatus = 'brouillon' | 'envoyée' | 'partielle' | 'payée' | 'retard' | 'annulée';

export interface Quote {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  issueDate: string;
  expiryDate: string;
  items: LineItem[];
  status: QuoteStatus;
  notes: string;
  terms: string;
  createdAt: string;
}

export type PaymentTerm = '30j' | '60j' | 'fin_mois' | 'comptant';

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  note?: string;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  paymentTerm: PaymentTerm;
  items: LineItem[];
  status: InvoiceStatus;
  payments: Payment[];
  notes: string;
  createdAt: string;
}

export type RelanceLevel = 1 | 2 | 3;
export type RelanceStatus = 'a_relancer' | 'relance' | 'en_cours' | 'litigieux' | 'recouvrement';

export interface RelanceAction {
  id: string;
  date: string;
  level: RelanceLevel;
  channel: 'email' | 'tel' | 'courrier';
  note: string;
}

export interface Relance {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  dueDate: string;
  daysLate: number;
  status: RelanceStatus;
  actions: RelanceAction[];
  nextRelanceDate?: string;
  notes: string;
}

export interface CompanySettings {
  name: string;
  siret: string;
  vatNumber: string;
  address: string;
  city: string;
  zip: string;
  email: string;
  phone: string;
  logo?: string;
  iban: string;
  defaultVat: number;
  quotePrefix: string;
  invoicePrefix: string;
  legalMentions: string;
}

export interface ActivityItem {
  id: string;
  type: 'contact' | 'deal' | 'quote' | 'invoice' | 'payment';
  title: string;
  description: string;
  date: string;
}
