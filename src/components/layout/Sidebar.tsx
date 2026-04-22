import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Kanban, FileText, Receipt, BellRing, Settings, Sparkles, ChevronsLeft, ChevronsRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../store';
import { APP_VERSION } from '../../lib/constants';
import { cn } from '../../lib/utils';

type Item = { to: string; label: string; icon: typeof LayoutDashboard };

const MAIN: Item[] = [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }];
const CRM: Item[] = [
  { to: '/crm/contacts', label: 'Contacts', icon: Users },
  { to: '/crm/entreprises', label: 'Entreprises', icon: Building2 },
  { to: '/crm/pipeline', label: 'Pipeline', icon: Kanban },
];
const BILLING: Item[] = [
  { to: '/devis', label: 'Devis', icon: FileText },
  { to: '/factures', label: 'Factures', icon: Receipt },
  { to: '/relances', label: 'Relances', icon: BellRing },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, theme, toggleTheme } = useTheme();
  const w = sidebarCollapsed ? 72 : 260;

  return (
    <aside
      className="fixed left-0 top-0 z-40 h-screen border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-300 flex flex-col"
      style={{ width: w }}
    >
      <div className={cn('flex items-center gap-3 px-5 py-5 border-b border-[var(--border)]', sidebarCollapsed && 'justify-center px-2')}>
        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent shadow-glow">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <div className="font-display text-sm font-semibold leading-tight">LJ Cognitix</div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">ERP</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        <NavGroup items={MAIN} collapsed={sidebarCollapsed} />
        <NavGroup label="CRM" items={CRM} collapsed={sidebarCollapsed} />
        <NavGroup label="Facturation" items={BILLING} collapsed={sidebarCollapsed} />
      </nav>

      <div className="border-t border-[var(--border)] p-3 space-y-2">
        <NavLink to="/parametres" className={({ isActive }) => navCls(isActive, sidebarCollapsed)}>
          <Settings className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Paramètres</span>}
        </NavLink>
        <button onClick={toggleTheme} className={cn(navCls(false, sidebarCollapsed), 'w-full')} aria-label="Changer thème">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!sidebarCollapsed && <span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>}
        </button>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 rounded-lg bg-[var(--surface-2)] p-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent text-xs font-semibold text-white">LJ</div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-xs font-medium">LJ Cognitix</div>
              <div className="text-[10px] text-[var(--text-muted)]">v{APP_VERSION}</div>
            </div>
          </div>
        )}
        <button onClick={toggleSidebar} className="w-full flex items-center justify-center py-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Réduire">
          {sidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}

function NavGroup({ label, items, collapsed }: { label?: string; items: Item[]; collapsed: boolean }) {
  return (
    <div>
      {label && !collapsed && <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{label}</div>}
      <div className="space-y-1">
        {items.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.to === '/'} className={({ isActive }) => navCls(isActive, collapsed)} title={collapsed ? i.label : undefined}>
            <i.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{i.label}</span>}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

function navCls(active: boolean, collapsed: boolean) {
  return cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all focus-ring',
    active
      ? 'bg-brand-500/15 text-white shadow-[inset_0_0_0_1px_rgba(108,59,255,0.35)]'
      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]',
    collapsed && 'justify-center px-0'
  );
}
