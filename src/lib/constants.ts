export const APP_NAME = 'LJ Cognitix ERP';
export const APP_VERSION = '1.0.0';

export const CONTACT_STATUSES = [
  { value: 'prospect', label: 'Prospect', color: 'warning' },
  { value: 'client', label: 'Client', color: 'success' },
  { value: 'partenaire', label: 'Partenaire', color: 'brand' },
  { value: 'inactif', label: 'Inactif', color: 'muted' },
] as const;

export const CONTACT_SOURCES = ['LinkedIn', 'Référence', 'Site', 'Autre'] as const;

export const COMPANY_SIZES = [
  { value: 'TPE', label: 'TPE (< 10)' },
  { value: 'PME', label: 'PME (10-249)' },
  { value: 'ETI', label: 'ETI (250-4999)' },
  { value: 'GE', label: 'Grand Groupe (5000+)' },
] as const;

export const PIPELINE_STAGES = [
  { value: 'prospect', label: 'Prospect', color: '#8B8BA7' },
  { value: 'contacté', label: 'Contacté', color: '#3B82F6' },
  { value: 'démo', label: 'Démo', color: '#6C3BFF' },
  { value: 'proposition', label: 'Proposition', color: '#F59E0B' },
  { value: 'négociation', label: 'Négociation', color: '#EAB308' },
  { value: 'gagné', label: 'Gagné', color: '#10B981' },
  { value: 'perdu', label: 'Perdu', color: '#EF4444' },
] as const;

export const QUOTE_STATUSES = [
  { value: 'brouillon', label: 'Brouillon', color: 'muted' },
  { value: 'envoyé', label: 'Envoyé', color: 'brand' },
  { value: 'accepté', label: 'Accepté', color: 'success' },
  { value: 'refusé', label: 'Refusé', color: 'danger' },
  { value: 'expiré', label: 'Expiré', color: 'warning' },
] as const;

export const INVOICE_STATUSES = [
  { value: 'brouillon', label: 'Brouillon', color: 'muted' },
  { value: 'envoyée', label: 'Envoyée', color: 'brand' },
  { value: 'partielle', label: 'Partielle', color: 'warning' },
  { value: 'payée', label: 'Payée', color: 'success' },
  { value: 'retard', label: 'En retard', color: 'danger' },
  { value: 'annulée', label: 'Annulée', color: 'muted' },
] as const;

export const RELANCE_STATUSES = [
  { value: 'a_relancer', label: 'À relancer', color: 'warning' },
  { value: 'relance', label: 'Relancé', color: 'brand' },
  { value: 'en_cours', label: 'En cours', color: 'accent' },
  { value: 'litigieux', label: 'Litigieux', color: 'danger' },
  { value: 'recouvrement', label: 'Recouvrement', color: 'danger' },
] as const;

export const PAYMENT_TERMS = [
  { value: 'comptant', label: 'Comptant' },
  { value: '30j', label: '30 jours' },
  { value: '60j', label: '60 jours' },
  { value: 'fin_mois', label: 'Fin de mois' },
] as const;

export const RELANCE_TEMPLATES = {
  1: {
    subject: 'Rappel : facture {ref_facture}',
    body: `Bonjour {client},

Sauf erreur de notre part, la facture {ref_facture} d'un montant de {montant} est arrivée à échéance le {date_echeance} et demeure impayée à ce jour.

Nous vous remercions de bien vouloir procéder à son règlement dans les meilleurs délais.

Si ce courrier s'est croisé avec votre paiement, merci de ne pas en tenir compte.

Cordialement,
L'équipe LJ Cognitix`,
  },
  2: {
    subject: 'Relance — facture {ref_facture} impayée',
    body: `Bonjour {client},

Malgré notre précédent rappel, la facture {ref_facture} d'un montant de {montant}, échue depuis le {date_echeance}, demeure impayée.

Nous vous remercions de régulariser votre situation sous 8 jours.

Sans règlement de votre part, nous serions contraints d'engager les procédures prévues.

Cordialement,
L'équipe LJ Cognitix`,
  },
  3: {
    subject: 'MISE EN DEMEURE — facture {ref_facture}',
    body: `Madame, Monsieur,

Nous vous mettons en demeure de régler la facture {ref_facture} d'un montant de {montant}, échue depuis le {date_echeance}, dans un délai de 8 jours à réception.

À défaut, nous engagerons sans nouveau préavis une procédure de recouvrement contentieux, avec application des pénalités de retard et indemnité forfaitaire légale.

Cordialement,
LJ Cognitix`,
  },
};
