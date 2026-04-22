import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Contact, Company, Deal, Quote, Invoice, Relance, CompanySettings, PipelineStage } from '../types';
import { mockContacts, mockCompanies, mockDeals, mockQuotes, mockInvoices, mockRelances, mockSettings } from '../lib/mockData';

// TODO: Replace all mock data with API calls via lib/api.ts when backend is live

interface ThemeState {
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'lj-theme' }
  )
);

interface CrmState {
  contacts: Contact[];
  companies: Company[];
  deals: Deal[];
  addContact: (c: Contact) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  removeContact: (id: string) => void;
  addCompany: (c: Company) => void;
  updateCompany: (id: string, patch: Partial<Company>) => void;
  removeCompany: (id: string) => void;
  addDeal: (d: Deal) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  moveDeal: (id: string, stage: PipelineStage) => void;
  removeDeal: (id: string) => void;
}

export const useCrm = create<CrmState>()(
  persist(
    (set) => ({
      contacts: mockContacts,
      companies: mockCompanies,
      deals: mockDeals,
      addContact: (c) => set((s) => ({ contacts: [c, ...s.contacts] })),
      updateContact: (id, patch) => set((s) => ({ contacts: s.contacts.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeContact: (id) => set((s) => ({ contacts: s.contacts.filter((x) => x.id !== id) })),
      addCompany: (c) => set((s) => ({ companies: [c, ...s.companies] })),
      updateCompany: (id, patch) => set((s) => ({ companies: s.companies.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeCompany: (id) => set((s) => ({ companies: s.companies.filter((x) => x.id !== id) })),
      addDeal: (d) => set((s) => ({ deals: [d, ...s.deals] })),
      updateDeal: (id, patch) => set((s) => ({ deals: s.deals.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      moveDeal: (id, stage) => set((s) => ({ deals: s.deals.map((x) => (x.id === id ? { ...x, stage } : x)) })),
      removeDeal: (id) => set((s) => ({ deals: s.deals.filter((x) => x.id !== id) })),
    }),
    { name: 'lj-crm' }
  )
);

interface BillingState {
  quotes: Quote[];
  invoices: Invoice[];
  addQuote: (q: Quote) => void;
  updateQuote: (id: string, patch: Partial<Quote>) => void;
  removeQuote: (id: string) => void;
  addInvoice: (i: Invoice) => void;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  removeInvoice: (id: string) => void;
}

export const useBilling = create<BillingState>()(
  persist(
    (set) => ({
      quotes: mockQuotes,
      invoices: mockInvoices,
      addQuote: (q) => set((s) => ({ quotes: [q, ...s.quotes] })),
      updateQuote: (id, patch) => set((s) => ({ quotes: s.quotes.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeQuote: (id) => set((s) => ({ quotes: s.quotes.filter((x) => x.id !== id) })),
      addInvoice: (i) => set((s) => ({ invoices: [i, ...s.invoices] })),
      updateInvoice: (id, patch) => set((s) => ({ invoices: s.invoices.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((x) => x.id !== id) })),
    }),
    { name: 'lj-billing' }
  )
);

interface RelanceState {
  relances: Relance[];
  updateRelance: (id: string, patch: Partial<Relance>) => void;
  addAction: (id: string, action: Relance['actions'][number]) => void;
}

export const useRelances = create<RelanceState>()(
  persist(
    (set) => ({
      relances: mockRelances,
      updateRelance: (id, patch) => set((s) => ({ relances: s.relances.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      addAction: (id, action) => set((s) => ({ relances: s.relances.map((x) => (x.id === id ? { ...x, actions: [...x.actions, action] } : x)) })),
    }),
    { name: 'lj-relances' }
  )
);

interface SettingsState {
  settings: CompanySettings;
  updateSettings: (patch: Partial<CompanySettings>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      settings: mockSettings,
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    { name: 'lj-settings' }
  )
);
