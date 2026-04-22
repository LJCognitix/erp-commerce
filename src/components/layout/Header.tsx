import { Bell, Search, Plus } from 'lucide-react';
import { Button } from '../ui';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 h-16 glass border-b border-[var(--border)]">
      <div className="flex h-full items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              className="input pl-9"
              placeholder="Rechercher un contact, un devis, une facture..."
              aria-label="Recherche globale"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative btn-ghost rounded-lg p-2" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent-500" />
          </button>
          <Button onClick={() => navigate('/factures?new=1')}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvelle facture</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
