import { useEffect, useMemo, useState } from 'react';
import { Plus, Eye, Download, Receipt, CircleDollarSign, AlertTriangle, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout/AppShell';
import { Card, Button, Modal, Input, Select, Textarea, Badge } from '../../components/ui';
import { SearchInput, StatusBadge, EmptyState } from '../../components/shared';
import { LineItemsEditor } from './LineItemsEditor';
import { DocumentPreview } from './DocumentPreview';
import { useBilling, useCrm } from '../../store';
import { INVOICE_STATUSES, PAYMENT_TERMS } from '../../lib/constants';
import { computeTotals, daysBetween, dueDateFromTerm, formatCurrency, formatDate, invoicePaid, nextNumber, uid } from '../../lib/utils';
import type { Invoice, InvoiceStatus, LineItem, PaymentTerm, Payment } from '../../types';
import { toast } from 'sonner';

export function InvoicesPage() {
  const { invoices, addInvoice, updateInvoice, removeInvoice } = useBilling();
  const { companies, contacts } = useCrm();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [editor, setEditor] = useState<{ invoice: Invoice | null } | null>(null);
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [payFor, setPayFor] = useState<Invoice | null>(null);

  useEffect(() => {
    if (params.get('new') === '1') { setEditor({ invoice: null }); setParams({}); }
  }, [params, setParams]);

  const clients = [...companies.map((c) => ({ id: c.id, name: c.name })), ...contacts.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))];

  const enriched = useMemo(() => invoices.map((inv) => {
    const p = invoicePaid(inv);
    const late = inv.status !== 'payée' && inv.status !== 'annulée' && daysBetween(inv.dueDate) > 0;
    const status: InvoiceStatus = inv.status === 'payée' || inv.status === 'annulée' || inv.status === 'brouillon' ? inv.status : (p.remaining <= 0 ? 'payée' : late ? 'retard' : p.paid > 0 ? 'partielle' : inv.status);
    return { ...inv, _paid: p.paid, _remaining: p.remaining, _total: p.total, status };
  }), [invoices]);

  const filtered = useMemo(() => enriched.filter((i) => {
    if (status !== 'all' && i.status !== status) return false;
    if (search && !`${i.number} ${i.clientName}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [enriched, search, status]);

  const summary = useMemo(() => {
    let outstanding = 0, less30 = 0, less60 = 0, over60 = 0, paid = 0;
    enriched.forEach((i) => {
      paid += i._paid;
      if (i.status === 'payée' || i.status === 'annulée' || i.status === 'brouillon') return;
      outstanding += i._remaining;
      const late = daysBetween(i.dueDate);
      if (late > 60) over60 += i._remaining;
      else if (late > 30) less60 += i._remaining;
      else less30 += i._remaining;
    });
    return { outstanding, less30, less60, over60, paid };
  }, [enriched]);

  return (
    <>
      <PageHeader
        title="Factures"
        description={`${invoices.length} factures · ${formatCurrency(summary.outstanding)} impayés`}
        actions={<Button onClick={() => setEditor({ invoice: null })}><Plus className="h-4 w-4" />Nouvelle facture</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon={CircleDollarSign} label="Encaissé" value={formatCurrency(summary.paid)} color="success" />
        <SummaryCard icon={Receipt} label="Impayé &lt; 30j" value={formatCurrency(summary.less30)} color="brand" />
        <SummaryCard icon={AlertTriangle} label="30-60j" value={formatCurrency(summary.less60)} color="warning" />
        <SummaryCard icon={AlertTriangle} label="&gt; 60j" value={formatCurrency(summary.over60)} color="danger" />
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[220px]" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[200px]">
            <option value="all">Tous les statuts</option>
            {INVOICE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="Aucune facture" />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="text-left px-4 py-3">Numéro</th>
                  <th className="text-left px-4 py-3">Client</th>
                  <th className="text-left px-4 py-3">Émission</th>
                  <th className="text-left px-4 py-3">Échéance</th>
                  <th className="text-right px-4 py-3">TTC</th>
                  <th className="text-right px-4 py-3">Restant</th>
                  <th className="text-left px-4 py-3">Statut</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i, idx) => {
                  const late = daysBetween(i.dueDate);
                  return (
                    <tr key={i.id} className={`border-b border-[var(--border)] last:border-0 table-row-hover ${idx % 2 === 1 ? 'bg-[var(--surface-2)]/30' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs">{i.number}</td>
                      <td className="px-4 py-3 font-medium">{i.clientName}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{formatDate(i.issueDate)}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className={late > 0 && i.status !== 'payée' ? 'text-danger font-medium' : 'text-[var(--text-muted)]'}>
                          {formatDate(i.dueDate)}{late > 0 && i.status !== 'payée' && ` (+${late}j)`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(i._total)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{i._remaining > 0 ? formatCurrency(i._remaining) : <span className="text-success">Soldée</span>}</td>
                      <td className="px-4 py-3"><StatusBadge kind="invoice" value={i.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setPreview(i)} className="btn-ghost rounded p-1.5" aria-label="Aperçu"><Eye className="h-4 w-4" /></button>
                          <button onClick={() => setEditor({ invoice: i })} className="btn-ghost rounded p-1.5" aria-label="Modifier"><Receipt className="h-4 w-4" /></button>
                          {i._remaining > 0 && <button onClick={() => setPayFor(i)} className="btn-ghost rounded p-1.5 text-success" aria-label="Paiement" title="Enregistrer paiement"><CircleDollarSign className="h-4 w-4" /></button>}
                          <button onClick={() => { removeInvoice(i.id); toast.success('Facture supprimée'); }} className="btn-ghost rounded p-1.5 text-danger" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {editor && (
        <InvoiceEditor
          invoice={editor.invoice}
          clients={clients}
          onClose={() => setEditor(null)}
          onSave={(data) => {
            if (editor.invoice) { updateInvoice(editor.invoice.id, data); toast.success('Facture mise à jour'); }
            else {
              const n = invoices.length + 1;
              addInvoice({ ...(data as Invoice), id: uid('i'), number: nextNumber('FAC', n), createdAt: new Date().toISOString(), payments: [] });
              toast.success('Facture créée');
            }
            setEditor(null);
          }}
        />
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Aperçu de la facture" size="xl">
        {preview && (
          <>
            <DocumentPreview kind="invoice" number={preview.number} clientName={preview.clientName} issueDate={preview.issueDate} dueDate={preview.dueDate} items={preview.items} notes={preview.notes} />
            {preview.payments.length > 0 && (
              <div className="mt-4 rounded-lg border border-[var(--border)] p-3">
                <div className="label">Historique paiements</div>
                <ul className="text-sm space-y-1">
                  {preview.payments.map((p) => <li key={p.id} className="flex justify-between"><span>{formatDate(p.date)} — {p.method}</span><span className="tabular-nums font-medium">{formatCurrency(p.amount)}</span></li>)}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => window.print()}><Download className="h-4 w-4" />Télécharger PDF</Button>
              <Button onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent(preview.number)}`; }}>Envoyer par email</Button>
            </div>
          </>
        )}
      </Modal>

      {payFor && <PaymentModal invoice={payFor} onClose={() => setPayFor(null)} onSave={(payment) => { updateInvoice(payFor.id, { payments: [...payFor.payments, payment] }); toast.success('Paiement enregistré'); setPayFor(null); }} />}
    </>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: typeof Receipt; label: string; value: string; color: 'success' | 'brand' | 'warning' | 'danger' }) {
  const map = { success: 'text-success bg-success/10', brand: 'text-brand-300 bg-brand-500/10', warning: 'text-warning bg-warning/10', danger: 'text-danger bg-danger/10' };
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${map[color]}`}><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-xs text-[var(--text-muted)]" dangerouslySetInnerHTML={{ __html: label }} />
          <div className="font-display font-bold tabular-nums">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function InvoiceEditor({ invoice, clients, onClose, onSave }: { invoice: Invoice | null; clients: { id: string; name: string }[]; onClose: () => void; onSave: (d: Partial<Invoice>) => void }) {
  const [form, setForm] = useState<Partial<Invoice>>(
    invoice || {
      clientId: clients[0]?.id || '',
      clientName: clients[0]?.name || '',
      issueDate: new Date().toISOString(),
      paymentTerm: '30j' as PaymentTerm,
      dueDate: dueDateFromTerm(new Date().toISOString(), '30j'),
      items: [{ id: uid('li'), designation: '', quantity: 1, unit: 'unité', unitPrice: 0, discount: 0, vat: 20 }],
      status: 'brouillon',
      notes: '',
      payments: [],
    }
  );
  const totals = computeTotals(form.items || []);

  const updateTerm = (term: PaymentTerm) => {
    setForm({ ...form, paymentTerm: term, dueDate: dueDateFromTerm(form.issueDate || new Date().toISOString(), term) });
  };

  return (
    <Modal open onClose={onClose} title={invoice ? `Modifier ${invoice.number}` : 'Nouvelle facture'} size="xl">
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className="label">Client *</label>
            <Select required value={form.clientId} onChange={(e) => { const c = clients.find((x) => x.id === e.target.value); setForm({ ...form, clientId: e.target.value, clientName: c?.name || '' }); }}>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="label">Date émission</label>
            <Input type="date" value={form.issueDate?.slice(0, 10)} onChange={(e) => { const iso = new Date(e.target.value).toISOString(); setForm({ ...form, issueDate: iso, dueDate: dueDateFromTerm(iso, form.paymentTerm as PaymentTerm) }); }} />
          </div>
          <div>
            <label className="label">Conditions</label>
            <Select value={form.paymentTerm} onChange={(e) => updateTerm(e.target.value as PaymentTerm)}>
              {PAYMENT_TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </div>
          <div className="col-span-2">
            <label className="label">Échéance</label>
            <Input type="date" value={form.dueDate?.slice(0, 10)} onChange={(e) => setForm({ ...form, dueDate: new Date(e.target.value).toISOString() })} />
          </div>
          <div>
            <label className="label">Statut</label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as InvoiceStatus })}>
              {INVOICE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
        </div>

        <div>
          <label className="label">Lignes de facturation</label>
          <LineItemsEditor items={form.items || []} onChange={(items: LineItem[]) => setForm({ ...form, items })} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="mt-2 flex items-center gap-2"><Badge color="warning">Pénalités légales de retard automatiquement mentionnées</Badge></div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">Total HT</span><span className="tabular-nums font-medium">{formatCurrency(totals.ht)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">TVA</span><span className="tabular-nums font-medium">{formatCurrency(totals.vat)}</span></div>
            <div className="flex justify-between pt-2 border-t border-[var(--border)] font-display text-lg font-bold"><span>Total TTC</span><span className="tabular-nums gradient-text">{formatCurrency(totals.ttc)}</span></div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit">{invoice ? 'Enregistrer' : 'Créer la facture'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function PaymentModal({ invoice, onClose, onSave }: { invoice: Invoice; onClose: () => void; onSave: (p: Payment) => void }) {
  const remaining = invoicePaid(invoice).remaining;
  const [form, setForm] = useState<Payment>({ id: uid('p'), date: new Date().toISOString(), amount: remaining, method: 'Virement', note: '' });

  return (
    <Modal open onClose={onClose} title={`Paiement — ${invoice.number}`} size="md">
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <div className="rounded-lg bg-[var(--surface-2)] p-3 text-sm">
          <div>Restant dû : <strong className="tabular-nums">{formatCurrency(remaining)}</strong></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <Input type="date" value={form.date.slice(0, 10)} onChange={(e) => setForm({ ...form, date: new Date(e.target.value).toISOString() })} />
          </div>
          <div>
            <label className="label">Montant</label>
            <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Moyen</label>
            <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option>Virement</option><option>Chèque</option><option>CB</option><option>Espèces</option>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit">Enregistrer</Button>
        </div>
      </form>
    </Modal>
  );
}

export default InvoicesPage;
