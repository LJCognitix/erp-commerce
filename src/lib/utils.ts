import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDateShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function daysBetween(from: string, to: string = new Date().toISOString()): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function computeLineTotal(item: { quantity: number; unitPrice: number; discount: number; vat: number }) {
  const gross = item.quantity * item.unitPrice;
  const afterDiscount = gross * (1 - item.discount / 100);
  const vatAmount = afterDiscount * (item.vat / 100);
  return { ht: afterDiscount, vat: vatAmount, ttc: afterDiscount + vatAmount };
}

export function computeTotals(items: { quantity: number; unitPrice: number; discount: number; vat: number }[]) {
  return items.reduce(
    (acc, it) => {
      const t = computeLineTotal(it);
      acc.ht += t.ht;
      acc.vat += t.vat;
      acc.ttc += t.ttc;
      return acc;
    },
    { ht: 0, vat: 0, ttc: 0 }
  );
}

export function invoicePaid(invoice: { items: { quantity: number; unitPrice: number; discount: number; vat: number }[]; payments: { amount: number }[] }) {
  const total = computeTotals(invoice.items).ttc;
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  return { total, paid, remaining: Math.max(0, total - paid) };
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nextNumber(prefix: string, counter: number): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(counter).padStart(4, '0')}`;
}

export function dueDateFromTerm(issue: string, term: 'comptant' | '30j' | '60j' | 'fin_mois'): string {
  const d = new Date(issue);
  if (term === 'comptant') return d.toISOString();
  if (term === '30j') return addDays(issue, 30);
  if (term === '60j') return addDays(issue, 60);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toISOString();
}
