import { Search, Inbox, Star, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui';
import type { ReactNode, InputHTMLAttributes } from 'react';

export function SearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
      <input className="input pl-9" placeholder="Rechercher..." {...props} />
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: { icon?: typeof Inbox; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-2xl bg-[var(--surface-2)] p-4 border border-[var(--border)]">
        <Icon className="h-8 w-8 text-[var(--text-muted)]" />
      </div>
      <h3 className="font-display text-lg font-semibold mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--text-muted)] max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('rounded-md bg-gradient-to-r from-[var(--surface-2)] via-[var(--border)] to-[var(--surface-2)] bg-[length:200%_100%] animate-shimmer', className)} />;
}

export function LoadingSpinner() {
  return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>;
}

export function StarRating({ value, onChange, readOnly }: { value: number; onChange?: (n: number) => void; readOnly?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={cn('transition-colors', !readOnly && 'hover:scale-110')}
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
        >
          <Star className={cn('h-4 w-4', n <= value ? 'fill-warning text-warning' : 'text-[var(--text-muted)]')} />
        </button>
      ))}
    </div>
  );
}

type StatusKind = 'contact' | 'quote' | 'invoice' | 'relance' | 'pipeline';

export function StatusBadge({ kind, value }: { kind: StatusKind; value: string }) {
  const dict: Record<string, { label: string; color: Parameters<typeof Badge>[0]['color'] }> = {
    prospect: { label: 'Prospect', color: 'warning' },
    client: { label: 'Client', color: 'success' },
    partenaire: { label: 'Partenaire', color: 'brand' },
    inactif: { label: 'Inactif', color: 'muted' },
    brouillon: { label: 'Brouillon', color: 'muted' },
    envoyé: { label: 'Envoyé', color: 'brand' },
    envoyée: { label: 'Envoyée', color: 'brand' },
    accepté: { label: 'Accepté', color: 'success' },
    refusé: { label: 'Refusé', color: 'danger' },
    expiré: { label: 'Expiré', color: 'warning' },
    payée: { label: 'Payée', color: 'success' },
    partielle: { label: 'Partielle', color: 'warning' },
    retard: { label: 'En retard', color: 'danger' },
    annulée: { label: 'Annulée', color: 'muted' },
    a_relancer: { label: 'À relancer', color: 'warning' },
    relance: { label: 'Relancé', color: 'brand' },
    en_cours: { label: 'En cours', color: 'accent' },
    litigieux: { label: 'Litigieux', color: 'danger' },
    recouvrement: { label: 'Recouvrement', color: 'danger' },
    contacté: { label: 'Contacté', color: 'brand' },
    démo: { label: 'Démo', color: 'brand' },
    proposition: { label: 'Proposition', color: 'warning' },
    négociation: { label: 'Négociation', color: 'warning' },
    gagné: { label: 'Gagné', color: 'success' },
    perdu: { label: 'Perdu', color: 'danger' },
  };
  const entry = dict[value] || { label: value, color: 'muted' as const };
  void kind;
  return <Badge color={entry.color}>{entry.label}</Badge>;
}
