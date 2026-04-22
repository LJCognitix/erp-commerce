import { useEffect, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useTheme } from '../../store';

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, sidebarCollapsed } = useTheme();

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: sidebarCollapsed ? 72 : 260 }}>
        <Header />
        <main className="flex-1 p-6 md:p-8 bg-grid">
          <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
