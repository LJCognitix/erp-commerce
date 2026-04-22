import { useMemo, useState } from 'react';
import { Plus, Eye, Copy, Download, FileText, ArrowRight, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/layout/AppShell';
import { Card, Button, Modal, Input, Select, Textarea } from '../../components/ui';
import { SearchInput, StatusBadge, EmptyState } from '../../components/shared';
import { LineItemsEditor } from './LineItemsEditor';
import { DocumentPreview } from './DocumentPreview';
import { useBilling, useCrm } from '../../store';
import { QUOTE_STATUSES } from '../../lib/constants';
import { addDays, computeTotals, dueDateFromTerm, formatCurrency, formatDate, nextNumber, uid } from '../../lib/utils';
import type { Quote, QuoteStatus, LineItem, Invoice } from '../../types';
import { toast } from 'sonner';

export function QuotesPage() {
  const { quotes, invoices, addQuote, updateQuote, removeQuote, addInvoice } = useBilling();
  const { companies, contacts } = useCrm();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [editor, setEditor] = useState<{ quote: Quote | null } | null>(null);
  const [preview, setPreview] = useState<Quote | null>(null);

  const filtered = useMemo(() => quotes.filter((q) => {
    if (status !== 'all' && q.status !== status) return false;
    if (search && !`${q.number} ${q.clientName}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [quotes, search, status]);

  const totalPending = quotes.filter((q) => q.status === 'envoyé').reduce((s, q) => s + computeTotals(q.items).ttc, 0);

  const clients = [...companies.map((c) => ({ id: c.id, name: c.name })), ...contacts.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))];

  const convertToInvoice = (q: Quote) => {
    const n = invoices.length + 1;
    const issueDate = new Date().toISOString();
    const inv: Invoice = {
      id: uid('i'),
      number: nextNumber('FAC', n),
      clientId: q.clientId,
      clientName: q.clientName,
      issueDate,
      dueDate: dueDateFromTerm(issueDate, '30j'),
      paymentTerm: '30j',
      items: q.items,
      status: 'brouillon',
      payments: [],
      notes: q.notes,
      createdAt: issueDate,
    };
    addInvoice(inv);
    toast.success(`Facture ${inv.number} créée depuis ${q.number}`);
  };

  const duplicate = (q: Quote) => {
    const n = quotes.length + 1;
    addQuote({ ...q, id: uid('q'), number: nextNumber('DEV', n), status: 'brouillon', issueDate: new Date().toISOString(), expiryDate: addDays(new Date().toISOString(), 30), createdAt: new Date().toISOString() });
    toast.success('Devis dupliqué');
  };

  return (
    <>
      <PageHeader
        title="Devis"
        description={`${quotes.length} devis · ${formatCurrency(totalPending)} en attente`}
        actions={<Button onClick={() => setEditor({ quote: null })}><Plus className="h-4 w-4" />Nouveau devis</Button>}
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[220px]" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[200px]">
            <option value="all">Tous les statuts</option>
            {QUOTE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Aucun devis" description="Créez votre premier devis pour le transmettre à vos clients." action={<Button onClick={() => setEditor({ quote: null })}><Plus className="h-4 w-4" />Nouveau devis</Button>} />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Numéro</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Client</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Date</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Validité</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Montant TTC</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Statut</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q, idx) => (
                  <tr key={q.id} className={`border-b border-[var(--border)] last:border-0 table-row-hover ${idx % 2 === 1 ? 'bg-[var(--surface-2)]/30' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs">{q.number}</td>
                    <td className="px-4 py-3 font-medium">{q.clientName}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{formatDate(q.issueDate)}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{formatDate(q.expiryDate)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatCurrency(computeTotals(q.items).ttc)}</td>
                    <td className="px-4 py-3"><StatusBadge kind="quote" value={q.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setPreview(q)} className="btn-ghost rounded p-1.5" aria-label="Aperçu"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => setEditor({ quote: q })} className="btn-ghost rounded p-1.5" aria-label="Modifier"><FileText className="h-4 w-4" /></button>
                        <button onClick={() => duplicate(q)} className="btn-ghost rounded p-1.5" aria-label="Dupliquer"><Copy className="h-4 w-4" /></button>
                        {q.status === 'accepté' && <button onClick={() => convertToInvoice(q)} className="btn-ghost rounded p-1.5 text-accent-500" aria-label="Convertir en facture" title="Convertir en facture"><ArrowRight className="h-4 w-4" /></button>}
                        <button onClick={() => { removeQuote(q.id); toast.success('Devis supprimé'); }} className="btn-ghost rounded p-1.5 text-danger" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {editor && (
        <QuoteEditor
          quote={editor.quote}
          clients={clients}
          onClose={() => setEditor(null)}
          onSave={(data) => {
            if (editor.quote) { updateQuote(editor.quote.id, data); toast.success('Devis mis à jour'); }
            else {
              const n = quotes.length + 1;
              addQuote({ ...(data as Quote), id: uid('q'), number: nextNumber('DEV', n), createdAt: new Date().toISOString() });
              toast.success('Devis créé');
            }
            setEditor(null);
          }}
        />
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Aperçu du devis" size="xl">
        {preview && (
          <>
            <DocumentPreview kind="quote" number={preview.number} clientName={preview.clientName} issueDate={preview.issueDate} dueDate={preview.expiryDate} items={preview.items} notes={preview.notes} terms={preview.terms} />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => window.print()}><Download className="h-4 w-4" />Télécharger PDF</Button>
              <Button onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent(preview.number)}&body=${encodeURIComponent('Veuillez trouver notre devis en pièce jointe.')}`; }}>Envoyer par email</Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

function QuoteEditor({ quote, clients, onClose, onSave }: { quote: Quote | null; clients: { id: string; name: string }[]; onClose: () => void; onSave: (q: Partial<Quote>) => void }) {
  const [form, setForm] = useState<Partial<Quote>>(
    quote || {
      clientId: clients[0]?.id || '',
      clientName: clients[0]?.name || '',
      issueDate: new Date().toISOString(),
      expiryDate: addDays(new Date().toISOString(), 30),
      items: [{ id: uid('li'), designation: '', quantity: 1, unit: 'unité', unitPrice: 0, discount: 0, vat: 20 }],
      status: 'brouillon',
      notes: '',
      terms: '50% à la commande, 50% à la livraison',
    }
  );
  const totals = computeTotals(form.items || []);

  return (
    <Modal open onClose={onClose} title={quote ? `Modifier ${quote.number}` : 'Nouveau devis'} size="xl">
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className="label">Client *</label>
            <Select required value={form.clientId} onChange={(e) => {
              const c = clients.find((x) => x.id === e.target.value);
              setForm({ ...form, clientId: e.target.value, clientName: c?.name || '' });
            }}>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="label">Date émission</label>
            <Input type="date" value={form.issueDate?.slice(0, 10)} onChange={(e) => setForm({ ...form, issueDate: new Date(e.target.value).toISOString() })} />
          </div>
          <div>
            <label className="label">Validité</label>
            <Input type="date" value={form.expiryDate?.slice(0, 10)} onChange={(e) => setForm({ ...form, expiryDate: new Date(e.target.value).toISOString() })} />
          </div>
          <div>
            <label className="label">Statut</label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as QuoteStatus })}>
              {QUOTE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
        </div>

        <div>
          <label className="label">Lignes</label>
          <LineItemsEditor items={form.items || []} onChange={(items: LineItem[]) => setForm({ ...form, items })} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            <div>
              <label className="label">Conditions de paiement</label>
              <Input value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
            </div>
            <div>
              <label className="label">Notes / Mentions</label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">Total HT</span><span className="tabular-nums font-medium">{formatCurrency(totals.ht)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">TVA</span><span className="tabular-nums font-medium">{formatCurrency(totals.vat)}</span></div>
            <div className="flex justify-between pt-2 border-t border-[var(--border)] font-display text-lg font-bold"><span>Total TTC</span><span className="tabular-nums gradient-text">{formatCurrency(totals.ttc)}</span></div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit">{quote ? 'Enregistrer' : 'Créer le devis'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default QuotesPage;
