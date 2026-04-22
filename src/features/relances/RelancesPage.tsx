import { useMemo, useState } from 'react';
import { Send, Mail, Copy as CopyIcon, CheckCircle2, BellRing, Clock } from 'lucide-react';
import { PageHeader } from '../../components/layout/AppShell';
import { Card, Button, Modal, Select, Textarea, Badge, Input } from '../../components/ui';
import { SearchInput, StatusBadge, EmptyState } from '../../components/shared';
import { useBilling, useRelances } from '../../store';
import { RELANCE_STATUSES, RELANCE_TEMPLATES } from '../../lib/constants';
import { daysBetween, formatCurrency, formatDate, invoicePaid, uid } from '../../lib/utils';
import type { Relance, RelanceLevel, RelanceStatus } from '../../types';
import { toast } from 'sonner';

export function RelancesPage() {
  const { relances, updateRelance, addAction } = useRelances();
  const { invoices } = useBilling();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<Relance | null>(null);

  // sync daysLate & amount from live invoices
  const live = useMemo(() => relances.map((r) => {
    const inv = invoices.find((i) => i.id === r.invoiceId);
    if (!inv) return r;
    const p = invoicePaid(inv);
    return { ...r, amount: p.remaining, daysLate: daysBetween(inv.dueDate), invoiceNumber: inv.number, clientName: inv.clientName };
  }).filter((r) => r.amount > 0), [relances, invoices]);

  const filtered = useMemo(() => live.filter((r) => {
    if (status !== 'all' && r.status !== status) return false;
    if (search && !`${r.clientName} ${r.invoiceNumber}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.daysLate - a.daysLate), [live, search, status]);

  const totals = useMemo(() => ({
    amount: live.reduce((s, r) => s + r.amount, 0),
    critical: live.filter((r) => r.daysLate > 60).length,
  }), [live]);

  return (
    <>
      <PageHeader
        title="Relances"
        description={`${live.length} factures à relancer · ${formatCurrency(totals.amount)} en jeu`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat color="success" label="À relancer (< 15j)" value={String(live.filter((r) => r.daysLate < 15).length)} />
        <Stat color="warning" label="Formel (15-30j)" value={String(live.filter((r) => r.daysLate >= 15 && r.daysLate < 30).length)} />
        <Stat color="danger" label="Mise en demeure (> 30j)" value={String(live.filter((r) => r.daysLate >= 30 && r.daysLate <= 60).length)} />
        <Stat color="danger" label="Recouvrement (> 60j)" value={String(totals.critical)} />
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[220px]" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[200px]">
            <option value="all">Tous les statuts</option>
            {RELANCE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={BellRing} title="Aucune relance en cours" description="Toutes vos factures sont à jour." />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => <RelanceCard key={r.id} relance={r} onClick={() => setSelected(r)} />)}
        </div>
      )}

      {selected && <RelanceDetail relance={selected} onClose={() => setSelected(null)} onUpdate={(patch) => { updateRelance(selected.id, patch); setSelected({ ...selected, ...patch }); }} onAddAction={(a) => { addAction(selected.id, a); setSelected({ ...selected, actions: [...selected.actions, a] }); }} />}
    </>
  );
}

function Stat({ color, label, value }: { color: 'success' | 'warning' | 'danger'; label: string; value: string }) {
  const map = { success: 'bg-success/10 text-success', warning: 'bg-warning/10 text-warning', danger: 'bg-danger/10 text-danger' };
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${map[color]}`}><Clock className="h-5 w-5" /></div>
        <div>
          <div className="text-xs text-[var(--text-muted)]">{label}</div>
          <div className="font-display text-xl font-bold">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function RelanceCard({ relance, onClick }: { relance: Relance; onClick: () => void }) {
  const urgency: { color: 'success' | 'warning' | 'danger'; label: string } =
    relance.daysLate > 60 ? { color: 'danger', label: 'Critique' } :
    relance.daysLate > 30 ? { color: 'danger', label: 'Mise en demeure' } :
    relance.daysLate > 15 ? { color: 'warning', label: 'Formel' } :
    { color: 'success', label: 'Cordial' };

  return (
    <Card interactive onClick={onClick} className="cursor-pointer">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className={`h-12 w-1 rounded-full md:h-12 ${urgency.color === 'danger' ? 'bg-danger' : urgency.color === 'warning' ? 'bg-warning' : 'bg-success'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-display font-semibold">{relance.clientName}</div>
            <Badge color={urgency.color}>{urgency.label}</Badge>
            <StatusBadge kind="relance" value={relance.status} />
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            {relance.invoiceNumber} · Échue le {formatDate(relance.dueDate)} · <span className="font-semibold text-danger">+{relance.daysLate}j de retard</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-xl font-bold tabular-nums">{formatCurrency(relance.amount)}</div>
          <div className="text-xs text-[var(--text-muted)]">{relance.actions.length} relance(s) envoyée(s)</div>
        </div>
      </div>
    </Card>
  );
}

function RelanceDetail({ relance, onClose, onUpdate, onAddAction }: { relance: Relance; onClose: () => void; onUpdate: (p: Partial<Relance>) => void; onAddAction: (a: Relance['actions'][number]) => void }) {
  const level: RelanceLevel = relance.daysLate > 30 ? 3 : relance.daysLate > 15 ? 2 : 1;
  const tpl = RELANCE_TEMPLATES[level];

  const subst = (text: string) => text
    .replace(/\{client\}/g, relance.clientName)
    .replace(/\{montant\}/g, formatCurrency(relance.amount))
    .replace(/\{ref_facture\}/g, relance.invoiceNumber)
    .replace(/\{date_echeance\}/g, formatDate(relance.dueDate));

  const [body, setBody] = useState(subst(tpl.body));
  const subject = subst(tpl.subject);
  const [note, setNote] = useState('');

  const sendMail = () => {
    const link = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = link;
    onAddAction({ id: uid('ra'), date: new Date().toISOString(), level, channel: 'email', note: 'Email envoyé via client mail' });
    toast.success('Email de relance préparé');
  };

  const copy = async () => {
    await navigator.clipboard.writeText(body);
    toast.success('Copié dans le presse-papiers');
  };

  return (
    <Modal open onClose={onClose} title={`Relance — ${relance.invoiceNumber}`} size="xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <div className="rounded-lg bg-[var(--surface-2)] p-4 border border-[var(--border)] mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{relance.clientName}</span>
              <StatusBadge kind="relance" value={relance.status} />
            </div>
            <div className="text-sm text-[var(--text-muted)]">Facture {relance.invoiceNumber}</div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-xs text-[var(--text-muted)]">Montant dû</div>
                <div className="font-display text-2xl font-bold tabular-nums">{formatCurrency(relance.amount)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--text-muted)]">Retard</div>
                <div className="font-display text-2xl font-bold text-danger">+{relance.daysLate}j</div>
              </div>
            </div>
          </div>

          <div>
            <div className="label">Historique</div>
            {relance.actions.length === 0 ? (
              <div className="text-sm text-[var(--text-muted)] py-4 text-center rounded-lg border border-dashed border-[var(--border)]">Aucune relance envoyée</div>
            ) : (
              <ul className="relative border-l-2 border-brand-500/30 ml-2 space-y-4 pl-5">
                {relance.actions.map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[26px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 ring-4 ring-[var(--surface)]"><CheckCircle2 className="h-3 w-3 text-white" /></span>
                    <div className="text-sm font-medium">Relance N°{a.level} · {a.channel}</div>
                    <div className="text-xs text-[var(--text-muted)]">{formatDate(a.date)}</div>
                    {a.note && <div className="text-xs mt-1">{a.note}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="label">Statut</div>
            <Select value={relance.status} onChange={(e) => onUpdate({ status: e.target.value as RelanceStatus })}>
              {RELANCE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
            <div className="label mt-3">Prochaine relance</div>
            <Input type="date" value={relance.nextRelanceDate?.slice(0, 10) || ''} onChange={(e) => onUpdate({ nextRelanceDate: new Date(e.target.value).toISOString() })} />
            <div className="label mt-3">Notes internes</div>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Échange avec le client..." />
            <Button variant="outline" size="sm" onClick={() => { if (note) { onAddAction({ id: uid('ra'), date: new Date().toISOString(), level, channel: 'tel', note }); setNote(''); toast.success('Note enregistrée'); } }}>Ajouter une note</Button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="label mb-0">Template relance N°{level}</div>
            <Badge color={level === 3 ? 'danger' : level === 2 ? 'warning' : 'brand'}>{level === 3 ? 'Mise en demeure' : level === 2 ? 'Formelle' : 'Cordiale'}</Badge>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
            <div className="px-3 py-2 border-b border-[var(--border)] text-sm">
              <span className="text-[var(--text-muted)] text-xs">Objet : </span>{subject}
            </div>
            <Textarea rows={14} value={body} onChange={(e) => setBody(e.target.value)} className="border-0 rounded-none bg-transparent" />
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={sendMail}><Mail className="h-4 w-4" />Ouvrir email</Button>
            <Button variant="outline" onClick={copy}><CopyIcon className="h-4 w-4" />Copier</Button>
            <Button variant="outline" onClick={() => { onAddAction({ id: uid('ra'), date: new Date().toISOString(), level, channel: 'courrier', note: 'Courrier envoyé' }); }}>
              <Send className="h-4 w-4" />Marquer envoyé
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default RelancesPage;
