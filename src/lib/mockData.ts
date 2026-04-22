import type { Contact, Company, Deal, Quote, Invoice, Relance, CompanySettings, ActivityItem } from '../types';
import { addDays, computeTotals } from './utils';

const now = new Date();
const iso = (offset: number) => addDays(now.toISOString(), offset);

export const mockCompanies: Company[] = [
  { id: 'co_1', name: 'Atelier Lumière', siret: '81234567800012', sector: 'Retail', size: 'PME', website: 'https://atelier-lumiere.fr', address: '12 rue du Faubourg', city: 'Paris', zip: '75011', country: 'France', estimatedRevenue: 2400000, notes: 'Client historique', createdAt: iso(-400) },
  { id: 'co_2', name: 'Delacroix & Associés', siret: '52345678900023', sector: 'Juridique', size: 'TPE', website: 'https://delacroix-avocats.fr', address: '5 avenue Hoche', city: 'Paris', zip: '75008', country: 'France', estimatedRevenue: 850000, notes: 'Cabinet d\'avocats — automatisation documents', createdAt: iso(-320) },
  { id: 'co_3', name: 'NovaTech Solutions', siret: '79876543200034', sector: 'Tech', size: 'ETI', website: 'https://novatech.io', address: '34 rue de Turbigo', city: 'Lyon', zip: '69001', country: 'France', estimatedRevenue: 12500000, notes: 'Projet IA interne', createdAt: iso(-250) },
  { id: 'co_4', name: 'Maison Bertrand', siret: '43210987600045', sector: 'Gastronomie', size: 'PME', website: 'https://maisonbertrand.com', address: '8 place Bellecour', city: 'Lyon', zip: '69002', country: 'France', estimatedRevenue: 1800000, notes: 'Chaîne restaurants', createdAt: iso(-200) },
  { id: 'co_5', name: 'Horizon Immobilier', siret: '92345678100056', sector: 'Immobilier', size: 'PME', website: 'https://horizon-immo.fr', address: '22 cours Mirabeau', city: 'Aix-en-Provence', zip: '13100', country: 'France', estimatedRevenue: 3400000, notes: 'CRM + relances auto', createdAt: iso(-180) },
  { id: 'co_6', name: 'Studio Pixel Garden', siret: '81098765400067', sector: 'Design', size: 'TPE', website: 'https://pixelgarden.fr', address: '14 rue Saint-Denis', city: 'Lille', zip: '59000', country: 'France', estimatedRevenue: 420000, notes: 'Agence créative', createdAt: iso(-150) },
  { id: 'co_7', name: 'Groupe Verdier', siret: '56789012300078', sector: 'Industrie', size: 'ETI', website: 'https://groupe-verdier.fr', address: '45 boulevard Haussmann', city: 'Bordeaux', zip: '33000', country: 'France', estimatedRevenue: 8900000, notes: 'Automatisation process', createdAt: iso(-120) },
  { id: 'co_8', name: 'Cabinet Rousseau', siret: '34567890100089', sector: 'Comptabilité', size: 'PME', website: 'https://cabinet-rousseau.fr', address: '3 rue Nationale', city: 'Nantes', zip: '44000', country: 'France', estimatedRevenue: 1200000, notes: 'Prospect chaud', createdAt: iso(-90) },
];

export const mockContacts: Contact[] = [
  { id: 'c_1', firstName: 'Camille', lastName: 'Laurent', email: 'camille.laurent@atelier-lumiere.fr', phone: '+33 6 12 34 56 78', position: 'Directrice Générale', companyId: 'co_1', tags: ['VIP', 'décideur'], notes: 'Contact principal, très réactive', source: 'LinkedIn', score: 5, lastContact: iso(-4), status: 'client', createdAt: iso(-380) },
  { id: 'c_2', firstName: 'Jean-Marc', lastName: 'Delacroix', email: 'jm.delacroix@delacroix-avocats.fr', phone: '+33 1 45 67 89 12', position: 'Associé fondateur', companyId: 'co_2', tags: ['décideur'], notes: 'Recherche outil de gestion dossiers', source: 'Référence', score: 4, lastContact: iso(-12), status: 'client', createdAt: iso(-310) },
  { id: 'c_3', firstName: 'Sophie', lastName: 'Martinez', email: 's.martinez@novatech.io', phone: '+33 7 88 99 00 11', position: 'CTO', companyId: 'co_3', tags: ['technique'], notes: 'Passionnée d\'IA', source: 'Site', score: 5, lastContact: iso(-2), status: 'client', createdAt: iso(-240) },
  { id: 'c_4', firstName: 'Pierre', lastName: 'Bertrand', email: 'pierre@maisonbertrand.com', phone: '+33 6 98 76 54 32', position: 'Fondateur', companyId: 'co_4', tags: ['VIP'], notes: 'Décideur unique', source: 'LinkedIn', score: 4, lastContact: iso(-20), status: 'client', createdAt: iso(-190) },
  { id: 'c_5', firstName: 'Aline', lastName: 'Moreau', email: 'a.moreau@horizon-immo.fr', phone: '+33 6 54 32 10 98', position: 'Responsable Marketing', companyId: 'co_5', tags: ['marketing'], notes: 'Demande devis automatisation', source: 'Site', score: 3, lastContact: iso(-8), status: 'prospect', createdAt: iso(-170) },
  { id: 'c_6', firstName: 'Thomas', lastName: 'Rivière', email: 't.riviere@pixelgarden.fr', phone: '+33 6 11 22 33 44', position: 'Directeur créatif', companyId: 'co_6', tags: ['créatif'], notes: '', source: 'LinkedIn', score: 3, lastContact: iso(-30), status: 'prospect', createdAt: iso(-140) },
  { id: 'c_7', firstName: 'Isabelle', lastName: 'Verdier', email: 'i.verdier@groupe-verdier.fr', phone: '+33 5 56 78 90 11', position: 'DAF', companyId: 'co_7', tags: ['décideur', 'finance'], notes: 'Sensible au ROI', source: 'Référence', score: 5, lastContact: iso(-1), status: 'client', createdAt: iso(-110) },
  { id: 'c_8', firstName: 'Nicolas', lastName: 'Rousseau', email: 'n.rousseau@cabinet-rousseau.fr', phone: '+33 2 40 12 34 56', position: 'Expert-Comptable', companyId: 'co_8', tags: ['comptabilité'], notes: 'Rendez-vous la semaine prochaine', source: 'LinkedIn', score: 4, lastContact: iso(-5), status: 'prospect', createdAt: iso(-85) },
  { id: 'c_9', firstName: 'Léa', lastName: 'Fontaine', email: 'lea.fontaine@freelance.fr', phone: '+33 6 22 33 44 55', position: 'Consultante indépendante', tags: ['partenaire'], notes: 'Apporteuse d\'affaires', source: 'Référence', score: 4, lastContact: iso(-15), status: 'partenaire', createdAt: iso(-60) },
  { id: 'c_10', firstName: 'Marc', lastName: 'Dubois', email: 'marc.dubois@email.com', phone: '+33 6 77 88 99 00', position: 'Entrepreneur', tags: [], notes: 'Contact froid', source: 'Autre', score: 2, lastContact: iso(-90), status: 'inactif', createdAt: iso(-200) },
  { id: 'c_11', firstName: 'Claire', lastName: 'Petit', email: 'c.petit@atelier-lumiere.fr', phone: '+33 1 23 45 67 89', position: 'Responsable Opérations', companyId: 'co_1', tags: ['ops'], notes: '', source: 'LinkedIn', score: 3, lastContact: iso(-18), status: 'client', createdAt: iso(-200) },
  { id: 'c_12', firstName: 'Antoine', lastName: 'Girard', email: 'antoine@startup.io', phone: '+33 6 45 67 89 01', position: 'Founder', tags: ['startup'], notes: 'Early-stage, budget limité', source: 'Site', score: 2, lastContact: iso(-40), status: 'prospect', createdAt: iso(-70) },
  { id: 'c_13', firstName: 'Hélène', lastName: 'Caron', email: 'h.caron@novatech.io', phone: '+33 7 12 34 56 78', position: 'Head of Data', companyId: 'co_3', tags: ['technique'], notes: '', source: 'LinkedIn', score: 4, lastContact: iso(-6), status: 'client', createdAt: iso(-220) },
  { id: 'c_14', firstName: 'Olivier', lastName: 'Blanc', email: 'o.blanc@groupe-verdier.fr', phone: '+33 5 56 99 88 77', position: 'Directeur IT', companyId: 'co_7', tags: ['technique', 'décideur'], notes: '', source: 'Référence', score: 5, lastContact: iso(-3), status: 'client', createdAt: iso(-100) },
  { id: 'c_15', firstName: 'Julie', lastName: 'Garcia', email: 'julie.garcia@prospect.fr', phone: '+33 6 33 44 55 66', position: 'CEO', tags: [], notes: 'Reçue via webinar', source: 'Site', score: 3, lastContact: iso(-25), status: 'prospect', createdAt: iso(-50) },
];

export const mockDeals: Deal[] = [
  { id: 'd_1', title: 'Automatisation CRM', contactId: 'c_8', companyId: 'co_8', amount: 18000, probability: 70, closingDate: iso(20), stage: 'proposition', owner: 'LJ', notes: '', createdAt: iso(-30) },
  { id: 'd_2', title: 'Chatbot IA interne', contactId: 'c_3', companyId: 'co_3', amount: 45000, probability: 90, closingDate: iso(10), stage: 'négociation', owner: 'LJ', notes: '', createdAt: iso(-60) },
  { id: 'd_3', title: 'Relances auto', contactId: 'c_5', companyId: 'co_5', amount: 12000, probability: 50, closingDate: iso(25), stage: 'démo', owner: 'LJ', notes: '', createdAt: iso(-15) },
  { id: 'd_4', title: 'Refonte ERP', contactId: 'c_15', amount: 32000, probability: 30, closingDate: iso(45), stage: 'contacté', owner: 'LJ', notes: '', createdAt: iso(-20) },
  { id: 'd_5', title: 'Outil devis auto', contactId: 'c_6', companyId: 'co_6', amount: 8500, probability: 40, closingDate: iso(35), stage: 'prospect', owner: 'LJ', notes: '', createdAt: iso(-10) },
  { id: 'd_6', title: 'Dashboard exécutif', contactId: 'c_7', companyId: 'co_7', amount: 22000, probability: 100, closingDate: iso(-5), stage: 'gagné', owner: 'LJ', notes: 'Signé', createdAt: iso(-45) },
];

const items = (entries: [string, number, number, number?][]) =>
  entries.map(([designation, qty, price, vat = 20], idx) => ({
    id: `li_${idx}_${Math.random().toString(36).slice(2, 6)}`,
    designation,
    quantity: qty,
    unit: 'unité',
    unitPrice: price,
    discount: 0,
    vat,
  }));

export const mockQuotes: Quote[] = [
  { id: 'q_1', number: 'DEV-2025-0001', clientId: 'co_1', clientName: 'Atelier Lumière', issueDate: iso(-15), expiryDate: iso(15), items: items([['Audit process automatisation', 1, 2500], ['Intégration IA documents', 1, 6500]]), status: 'accepté', notes: '', terms: '50% à la commande, 50% à la livraison', createdAt: iso(-15) },
  { id: 'q_2', number: 'DEV-2025-0002', clientId: 'co_2', clientName: 'Delacroix & Associés', issueDate: iso(-10), expiryDate: iso(20), items: items([['Automatisation contrats', 1, 4200], ['Formation équipe', 2, 450]]), status: 'envoyé', notes: '', terms: '30 jours', createdAt: iso(-10) },
  { id: 'q_3', number: 'DEV-2025-0003', clientId: 'co_3', clientName: 'NovaTech Solutions', issueDate: iso(-25), expiryDate: iso(5), items: items([['Chatbot IA sur-mesure', 1, 28000], ['Maintenance 12 mois', 1, 4800]]), status: 'accepté', notes: 'Projet pilote', terms: '50/50', createdAt: iso(-25) },
  { id: 'q_4', number: 'DEV-2025-0004', clientId: 'co_4', clientName: 'Maison Bertrand', issueDate: iso(-40), expiryDate: iso(-10), items: items([['CRM restaurants', 1, 8500]]), status: 'expiré', notes: '', terms: '', createdAt: iso(-40) },
  { id: 'q_5', number: 'DEV-2025-0005', clientId: 'co_5', clientName: 'Horizon Immobilier', issueDate: iso(-5), expiryDate: iso(25), items: items([['Module relances', 1, 6800], ['Intégration Google Workspace', 1, 1200]]), status: 'envoyé', notes: '', terms: '30 jours', createdAt: iso(-5) },
  { id: 'q_6', number: 'DEV-2025-0006', clientId: 'co_6', clientName: 'Studio Pixel Garden', issueDate: iso(-3), expiryDate: iso(27), items: items([['Automatisation devis', 1, 3400]]), status: 'brouillon', notes: '', terms: '', createdAt: iso(-3) },
  { id: 'q_7', number: 'DEV-2025-0007', clientId: 'co_7', clientName: 'Groupe Verdier', issueDate: iso(-35), expiryDate: iso(-5), items: items([['Audit IA industrielle', 1, 12000]]), status: 'refusé', notes: 'Budget reporté', terms: '', createdAt: iso(-35) },
  { id: 'q_8', number: 'DEV-2025-0008', clientId: 'co_7', clientName: 'Groupe Verdier', issueDate: iso(-8), expiryDate: iso(22), items: items([['POC ML maintenance prédictive', 1, 18500]]), status: 'envoyé', notes: '', terms: 'Acompte 30%', createdAt: iso(-8) },
  { id: 'q_9', number: 'DEV-2025-0009', clientId: 'co_8', clientName: 'Cabinet Rousseau', issueDate: iso(-12), expiryDate: iso(18), items: items([['Automatisation comptabilité', 1, 9200], ['Formation', 3, 380]]), status: 'envoyé', notes: '', terms: '30j fin de mois', createdAt: iso(-12) },
  { id: 'q_10', number: 'DEV-2025-0010', clientId: 'co_1', clientName: 'Atelier Lumière', issueDate: iso(-2), expiryDate: iso(28), items: items([['Extension automatisation', 1, 5400]]), status: 'brouillon', notes: '', terms: '', createdAt: iso(-2) },
];

export const mockInvoices: Invoice[] = [
  { id: 'i_1', number: 'FAC-2025-0001', clientId: 'co_1', clientName: 'Atelier Lumière', issueDate: iso(-60), dueDate: iso(-30), paymentTerm: '30j', items: items([['Audit automatisation', 1, 2500], ['Intégration IA', 1, 6500]]), status: 'payée', payments: [{ id: 'p_1', date: iso(-35), amount: 10800, method: 'Virement' }], notes: '', createdAt: iso(-60) },
  { id: 'i_2', number: 'FAC-2025-0002', clientId: 'co_3', clientName: 'NovaTech Solutions', issueDate: iso(-45), dueDate: iso(-15), paymentTerm: '30j', items: items([['Chatbot IA — acompte', 1, 14000]]), status: 'payée', payments: [{ id: 'p_2', date: iso(-20), amount: 16800, method: 'Virement' }], notes: '', createdAt: iso(-45) },
  { id: 'i_3', number: 'FAC-2025-0003', clientId: 'co_2', clientName: 'Delacroix & Associés', issueDate: iso(-50), dueDate: iso(-20), paymentTerm: '30j', items: items([['Automatisation contrats', 1, 4200]]), status: 'retard', payments: [], notes: '', createdAt: iso(-50) },
  { id: 'i_4', number: 'FAC-2025-0004', clientId: 'co_4', clientName: 'Maison Bertrand', issueDate: iso(-75), dueDate: iso(-45), paymentTerm: '30j', items: items([['CRM restaurants — phase 1', 1, 4250]]), status: 'retard', payments: [{ id: 'p_3', date: iso(-30), amount: 2040, method: 'Chèque' }], notes: '', createdAt: iso(-75) },
  { id: 'i_5', number: 'FAC-2025-0005', clientId: 'co_7', clientName: 'Groupe Verdier', issueDate: iso(-20), dueDate: iso(10), paymentTerm: '30j', items: items([['POC ML — acompte', 1, 5550]]), status: 'envoyée', payments: [], notes: '', createdAt: iso(-20) },
  { id: 'i_6', number: 'FAC-2025-0006', clientId: 'co_5', clientName: 'Horizon Immobilier', issueDate: iso(-90), dueDate: iso(-60), paymentTerm: '30j', items: items([['Étude préalable', 1, 1800]]), status: 'retard', payments: [], notes: '', createdAt: iso(-90) },
  { id: 'i_7', number: 'FAC-2025-0007', clientId: 'co_1', clientName: 'Atelier Lumière', issueDate: iso(-30), dueDate: iso(0), paymentTerm: '30j', items: items([['Maintenance mensuelle', 1, 1200]]), status: 'envoyée', payments: [], notes: '', createdAt: iso(-30) },
  { id: 'i_8', number: 'FAC-2025-0008', clientId: 'co_3', clientName: 'NovaTech Solutions', issueDate: iso(-15), dueDate: iso(15), paymentTerm: '30j', items: items([['Chatbot — phase 2', 1, 14000]]), status: 'envoyée', payments: [], notes: '', createdAt: iso(-15) },
  { id: 'i_9', number: 'FAC-2025-0009', clientId: 'co_8', clientName: 'Cabinet Rousseau', issueDate: iso(-25), dueDate: iso(5), paymentTerm: '30j', items: items([['Setup automatisation', 1, 3200]]), status: 'partielle', payments: [{ id: 'p_4', date: iso(-10), amount: 1920, method: 'Virement' }], notes: '', createdAt: iso(-25) },
  { id: 'i_10', number: 'FAC-2025-0010', clientId: 'co_2', clientName: 'Delacroix & Associés', issueDate: iso(-10), dueDate: iso(20), paymentTerm: '30j', items: items([['Formation équipe', 2, 450]]), status: 'envoyée', payments: [], notes: '', createdAt: iso(-10) },
  { id: 'i_11', number: 'FAC-2025-0011', clientId: 'co_6', clientName: 'Studio Pixel Garden', issueDate: iso(-100), dueDate: iso(-70), paymentTerm: '30j', items: items([['Consulting', 1, 2400]]), status: 'retard', payments: [], notes: 'Litige en cours', createdAt: iso(-100) },
  { id: 'i_12', number: 'FAC-2025-0012', clientId: 'co_7', clientName: 'Groupe Verdier', issueDate: iso(-5), dueDate: iso(25), paymentTerm: '30j', items: items([['Maintenance IA', 1, 2200]]), status: 'envoyée', payments: [], notes: '', createdAt: iso(-5) },
  { id: 'i_13', number: 'FAC-2025-0013', clientId: 'co_3', clientName: 'NovaTech Solutions', issueDate: iso(-2), dueDate: iso(28), paymentTerm: '30j', items: items([['Support technique Q1', 1, 1800]]), status: 'envoyée', payments: [], notes: '', createdAt: iso(-2) },
  { id: 'i_14', number: 'FAC-2025-0014', clientId: 'co_1', clientName: 'Atelier Lumière', issueDate: iso(-1), dueDate: iso(29), paymentTerm: '30j', items: items([['Extension module', 1, 5400]]), status: 'brouillon', payments: [], notes: '', createdAt: iso(-1) },
  { id: 'i_15', number: 'FAC-2025-0015', clientId: 'co_5', clientName: 'Horizon Immobilier', issueDate: iso(-55), dueDate: iso(-25), paymentTerm: '30j', items: items([['Licence annuelle', 1, 3600]]), status: 'retard', payments: [], notes: '', createdAt: iso(-55) },
];

export const mockRelances: Relance[] = mockInvoices
  .filter((inv) => inv.status === 'retard')
  .map((inv) => {
    const total = computeTotals(inv.items).ttc;
    const daysLate = Math.max(0, Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000));
    return {
      id: `r_${inv.id}`,
      invoiceId: inv.id,
      invoiceNumber: inv.number,
      clientName: inv.clientName,
      amount: total - inv.payments.reduce((s, p) => s + p.amount, 0),
      dueDate: inv.dueDate,
      daysLate,
      status: daysLate > 60 ? 'recouvrement' : daysLate > 30 ? 'en_cours' : 'a_relancer',
      actions: daysLate > 20 ? [{ id: 'ra_1', date: iso(-daysLate + 15), level: 1 as const, channel: 'email' as const, note: 'Relance cordiale envoyée' }] : [],
      nextRelanceDate: iso(3),
      notes: inv.notes || '',
    };
  });

export const mockActivity: ActivityItem[] = [
  { id: 'a_1', type: 'payment', title: 'Paiement reçu', description: 'Atelier Lumière — 10 800 €', date: iso(-1) },
  { id: 'a_2', type: 'quote', title: 'Devis accepté', description: 'NovaTech — DEV-2025-0003', date: iso(-2) },
  { id: 'a_3', type: 'invoice', title: 'Facture envoyée', description: 'Groupe Verdier — FAC-2025-0005', date: iso(-2) },
  { id: 'a_4', type: 'contact', title: 'Nouveau prospect', description: 'Nicolas Rousseau — Cabinet Rousseau', date: iso(-5) },
  { id: 'a_5', type: 'deal', title: 'Deal gagné', description: 'Dashboard exécutif — 22 000 €', date: iso(-5) },
  { id: 'a_6', type: 'invoice', title: 'Facture en retard', description: 'Maison Bertrand — FAC-2025-0004', date: iso(-45) },
];

export const mockSettings: CompanySettings = {
  name: 'LJ Cognitix',
  siret: '98765432100015',
  vatNumber: 'FR12987654321',
  address: '10 rue de l\'Innovation',
  city: 'Paris',
  zip: '75009',
  email: 'contact@ljcognitix.com',
  phone: '+33 1 23 45 67 89',
  iban: 'FR76 1234 5678 9012 3456 7890 123',
  defaultVat: 20,
  quotePrefix: 'DEV',
  invoicePrefix: 'FAC',
  legalMentions: 'Auto-liquidation TVA applicable le cas échéant. Pénalités de retard au taux légal + indemnité forfaitaire de 40€.',
};
