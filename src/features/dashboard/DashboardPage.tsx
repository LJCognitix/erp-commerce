import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Euro, FileText, AlertTriangle, Target, UserPlus, Receipt, CircleDollarSign, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, Area, AreaChart } from 'recharts';
import { PageHeader } from '../../components/layout/AppShell';
import { Card, CardHeader, CardTitle, Badge } from '../../components/ui';
import { useBilling, useCrm } from '../../store';
import { mockActivity } from '../../lib/mockData';
import { computeTotals, formatCurrency, formatDate, invoicePaid, daysBetween } from '../../lib/utils';
import { StatusBadge } from '../../components/shared';

export function DashboardPage() {
  const invoices = useBilling((s) => s.invoices);
  const quotes = useBilling((s) => s.quotes);
  const contacts = useCrm((s) => s.contacts);

  const stats = useMemo(() => {
    const now = new Date();
    const thisYear = now.getFullYear();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let caMonth = 0, caYear = 0, outstanding = 0, outstandingCount = 0;
    invoices.forEach((inv) => {
      const { paid, remaining } = invoicePaid(inv);
      const iy = new Date(inv.issueDate).getFullYear();
      if (iy === thisYear) caYear += paid;
      if (new Date(inv.issueDate) >= monthStart) caMonth += paid;
      if (inv.status !== 'payée' && inv.status !== 'annulée' && inv.status !== 'brouillon') {
        outstanding += remaining;
        outstandingCount++;
      }
    });

    const pendingQuotes = quotes.filter((q) => q.status === 'envoyé');
    const pendingAmount = pendingQuotes.reduce((s, q) => s + computeTotals(q.items).ttc, 0);

    const acceptedQuotes = quotes.filter((q) => q.status === 'accepté').length;
    const conversion = quotes.length > 0 ? Math.round((acceptedQuotes / quotes.length) * 100) : 0;

    return { caMonth, caYear, outstanding, outstandingCount, pendingAmount, pendingCount: pendingQuotes.length, conversion };
  }, [invoices, quotes]);

  const monthlyRevenue = useMemo(() => {
    const months: { label: string; revenue: number; forecast: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('fr-FR', { month: 'short' });
      const revenue = invoices.reduce((s, inv) => {
        const di = new Date(inv.issueDate);
        if (di.getFullYear() === d.getFullYear() && di.getMonth() === d.getMonth()) {
          return s + inv.payments.reduce((a, p) => a + p.amount, 0);
        }
        return s;
      }, 0);
      months.push({ label, revenue, forecast: revenue * 1.15 + 2000 });
    }
    return months;
  }, [invoices]);

  const statusDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach((inv) => { map[inv.status] = (map[inv.status] || 0) + 1; });
    const colors: Record<string, string> = {
      payée: '#10B981', envoyée: '#6C3BFF', retard: '#EF4444', partielle: '#F59E0B', brouillon: '#8B8BA7', annulée: '#6B6B85',
    };
    return Object.entries(map).map(([name, value]) => ({ name, value, color: colors[name] || '#6C3BFF' }));
  }, [invoices]);

  const topClients = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach((inv) => {
      const paid = inv.payments.reduce((a, p) => a + p.amount, 0);
      map.set(inv.clientName, (map.get(inv.clientName) || 0) + paid);
    });
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [invoices]);

  const urgentInvoices = useMemo(
    () =>
      invoices
        .filter((i) => i.status === 'retard' && daysBetween(i.dueDate) > 30)
        .sort((a, b) => daysBetween(b.dueDate) - daysBetween(a.dueDate))
        .slice(0, 5),
    [invoices]
  );

  return (
    <>
      <PageHeader
        title="Bonjour, LJ."
        description={`Voici la synthèse de votre activité · ${contacts.length} contacts actifs`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={Euro}
          label="CA du mois"
          value={formatCurrency(stats.caMonth)}
          trend={12.4}
          hint={`Annuel : ${formatCurrency(stats.caYear)}`}
          accent="brand"
        />
        <KpiCard
          icon={FileText}
          label="Devis en attente"
          value={formatCurrency(stats.pendingAmount)}
          hint={`${stats.pendingCount} devis envoyés`}
          accent="accent"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Impayés"
          value={formatCurrency(stats.outstanding)}
          hint={`${stats.outstandingCount} factures`}
          accent="danger"
          trend={-4.2}
        />
        <KpiCard
          icon={Target}
          label="Conversion devis"
          value={`${stats.conversion}%`}
          hint="Devis → Facture"
          accent="success"
          trend={8.1}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Chiffre d'affaires — 12 mois</CardTitle>
              <p className="text-xs text-[var(--text-muted)] mt-1">Encaissements réels vs prévisions</p>
            </div>
            <div className="flex gap-3 text-xs">
              <LegendDot color="#6C3BFF" label="CA réel" />
              <LegendDot color="#00E5BE" label="Prévision" />
            </div>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#6C3BFF" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#6C3BFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fcGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#00E5BE" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00E5BE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="forecast" stroke="#00E5BE" strokeWidth={2} fill="url(#fcGrad)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="revenue" stroke="#6C3BFF" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statuts des factures</CardTitle>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {statusDistribution.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} stroke="var(--surface)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>CA mensuel (encaissements)</CardTitle>
          </CardHeader>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(108,59,255,0.06)' }} />
                <Bar dataKey="revenue" fill="#6C3BFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top clients</CardTitle>
            <Badge color="brand">CA cumulé</Badge>
          </CardHeader>
          <ul className="space-y-3">
            {topClients.map((c, idx) => (
              <li key={c.name} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 text-brand-200 text-xs font-semibold">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{c.name}</div>
                  <div className="mt-1 h-1 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-accent" style={{ width: `${Math.min(100, (c.amount / (topClients[0]?.amount || 1)) * 100)}%` }} />
                  </div>
                </div>
                <span className="text-xs font-semibold tabular-nums">{formatCurrency(c.amount)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Factures urgentes</CardTitle>
            <Badge color="danger">{urgentInvoices.length} à relancer</Badge>
          </CardHeader>
          {urgentInvoices.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-6 text-center">Aucune facture en retard critique</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {urgentInvoices.map((inv) => {
                const late = daysBetween(inv.dueDate);
                const { remaining } = invoicePaid(inv);
                return (
                  <li key={inv.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{inv.clientName}</div>
                      <div className="text-xs text-[var(--text-muted)]">{inv.number} · {late}j de retard</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-danger tabular-nums">{formatCurrency(remaining)}</div>
                      <StatusBadge kind="invoice" value={inv.status} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <ul className="space-y-4">
            {mockActivity.map((a) => {
              const IconMap = { contact: UserPlus, deal: Target, quote: FileText, invoice: Receipt, payment: CircleDollarSign } as const;
              const Icon = IconMap[a.type] || Users;
              return (
                <li key={a.id} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                    <Icon className="h-4 w-4 text-brand-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-[var(--text-muted)] truncate">{a.description}</div>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] shrink-0">{formatDate(a.date)}</div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}

function KpiCard({ icon: Icon, label, value, hint, trend, accent }: { icon: typeof Euro; label: string; value: string; hint?: string; trend?: number; accent: 'brand' | 'accent' | 'success' | 'danger' }) {
  const accentMap = {
    brand: 'from-brand-500 to-brand-400',
    accent: 'from-accent-500 to-accent-600',
    success: 'from-success to-accent-500',
    danger: 'from-danger to-warning',
  };
  return (
    <Card interactive>
      <div className="flex items-start justify-between mb-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${accentMap[accent]} shadow-glow`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
      <div className="font-display text-2xl font-bold mt-1 tabular-nums">{value}</div>
      {hint && <div className="text-xs text-[var(--text-muted)] mt-1">{hint}</div>}
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-lg text-xs">
      {label && <div className="font-semibold mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--text-muted)]">{p.name}:</span>
          <span className="font-semibold tabular-nums">{typeof p.value === 'number' ? formatCurrency(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default DashboardPage;
