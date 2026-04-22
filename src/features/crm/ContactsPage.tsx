import { useMemo, useState } from 'react';
import { Plus, Mail, Phone, Filter, LayoutGrid, List, Trash2, Download } from 'lucide-react';
import { PageHeader } from '../../components/layout/AppShell';
import { Button, Card, Select, Modal, SlidePanel, Input, Textarea } from '../../components/ui';
import { SearchInput, StarRating, StatusBadge, EmptyState } from '../../components/shared';
import { useCrm } from '../../store';
import { CONTACT_SOURCES, CONTACT_STATUSES } from '../../lib/constants';
import { formatDate, uid } from '../../lib/utils';
import type { Contact, ContactSource, ContactStatus } from '../../types';
import { toast } from 'sonner';

export function ContactsPage() {
  const { contacts, companies, addContact, updateContact, removeContact } = useCrm();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [selected, setSelected] = useState<Contact | null>(null);

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && c.source !== sourceFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = `${c.firstName} ${c.lastName} ${c.email} ${c.position} ${c.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [contacts, search, statusFilter, sourceFilter]);

  const companyName = (id?: string) => companies.find((c) => c.id === id)?.name || '—';

  const handleDelete = (id: string) => {
    removeContact(id);
    setSelected(null);
    toast.success('Contact supprimé');
  };

  const exportCsv = () => {
    const rows = [['Prénom', 'Nom', 'Email', 'Téléphone', 'Entreprise', 'Statut', 'Score']];
    filtered.forEach((c) => rows.push([c.firstName, c.lastName, c.email, c.phone, companyName(c.companyId), c.status, String(c.score)]));
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'contacts.csv';
    a.click();
    toast.success('Export CSV généré');
  };

  return (
    <>
      <PageHeader
        title="Contacts"
        description={`${contacts.length} contacts · ${contacts.filter((c) => c.status === 'client').length} clients`}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" />Exporter</Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" />Nouveau contact</Button>
          </>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher nom, email, poste, tag..." className="flex-1 min-w-[220px]" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[180px]">
            <option value="all">Tous les statuts</option>
            {CONTACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="max-w-[180px]">
            <option value="all">Toutes sources</option>
            {CONTACT_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            <button onClick={() => setView('list')} className={`px-3 py-2 ${view === 'list' ? 'bg-brand-500/20 text-brand-200' : 'text-[var(--text-muted)]'}`} aria-label="Vue liste"><List className="h-4 w-4" /></button>
            <button onClick={() => setView('grid')} className={`px-3 py-2 ${view === 'grid' ? 'bg-brand-500/20 text-brand-200' : 'text-[var(--text-muted)]'}`} aria-label="Vue grille"><LayoutGrid className="h-4 w-4" /></button>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Filter} title="Aucun contact trouvé" description="Essayez de modifier vos filtres ou ajoutez un nouveau contact." />
      ) : view === 'list' ? (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <Th>Contact</Th><Th>Entreprise</Th><Th>Statut</Th><Th>Source</Th><Th>Score</Th><Th>Dernier contact</Th><Th></Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => (
                  <tr key={c.id} onClick={() => setSelected(c)} className={`cursor-pointer table-row-hover border-b border-[var(--border)] last:border-0 ${idx % 2 === 1 ? 'bg-[var(--surface-2)]/30' : ''}`}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent text-xs font-semibold text-white">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium">{c.firstName} {c.lastName}</div>
                          <div className="text-xs text-[var(--text-muted)]">{c.position}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>{companyName(c.companyId)}</Td>
                    <Td><StatusBadge kind="contact" value={c.status} /></Td>
                    <Td><span className="text-xs text-[var(--text-muted)]">{c.source}</span></Td>
                    <Td><StarRating value={c.score} readOnly /></Td>
                    <Td><span className="text-xs text-[var(--text-muted)]">{formatDate(c.lastContact)}</span></Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} className="btn-ghost rounded p-1.5" aria-label="Envoyer un email"><Mail className="h-4 w-4" /></a>
                        <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="btn-ghost rounded p-1.5" aria-label="Appeler"><Phone className="h-4 w-4" /></a>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} interactive onClick={() => setSelected(c)} className="cursor-pointer">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent text-sm font-semibold text-white">
                  {c.firstName[0]}{c.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.firstName} {c.lastName}</div>
                  <div className="text-xs text-[var(--text-muted)] truncate">{c.position}</div>
                </div>
                <StatusBadge kind="contact" value={c.status} />
              </div>
              <div className="space-y-1 text-xs text-[var(--text-muted)]">
                <div className="truncate">{c.email}</div>
                <div>{companyName(c.companyId)}</div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <StarRating value={c.score} readOnly />
                <span className="text-[10px] text-[var(--text-muted)]">{c.source}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <SlidePanel open={!!selected} onClose={() => setSelected(null)} title="Fiche contact">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent text-lg font-semibold text-white">
                {selected.firstName[0]}{selected.lastName[0]}
              </div>
              <div>
                <div className="font-display text-xl font-semibold">{selected.firstName} {selected.lastName}</div>
                <div className="text-sm text-[var(--text-muted)]">{selected.position}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Email" value={selected.email} />
              <Detail label="Téléphone" value={selected.phone} />
              <Detail label="Entreprise" value={companyName(selected.companyId)} />
              <Detail label="Source" value={selected.source} />
              <Detail label="Statut"><StatusBadge kind="contact" value={selected.status} /></Detail>
              <Detail label="Score"><StarRating value={selected.score} readOnly /></Detail>
              <Detail label="Dernier contact" value={formatDate(selected.lastContact)} />
              <Detail label="Créé le" value={formatDate(selected.createdAt)} />
            </div>
            {selected.tags.length > 0 && (
              <div>
                <div className="label">Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map((t) => <span key={t} className="pill bg-brand-500/15 text-brand-200 border-brand-500/30">{t}</span>)}
                </div>
              </div>
            )}
            {selected.notes && (
              <div>
                <div className="label">Notes</div>
                <div className="text-sm whitespace-pre-wrap rounded-lg bg-[var(--surface-2)] p-3 border border-[var(--border)]">{selected.notes}</div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border)]">
              <a href={`mailto:${selected.email}`} className="btn-outline"><Mail className="h-4 w-4" />Email</a>
              <a href={`tel:${selected.phone}`} className="btn-outline"><Phone className="h-4 w-4" />Appeler</a>
              <Button variant="outline" onClick={() => { setEditing(selected); setFormOpen(true); setSelected(null); }}>Modifier</Button>
              <Button variant="danger" onClick={() => handleDelete(selected.id)}><Trash2 className="h-4 w-4" />Supprimer</Button>
            </div>
          </div>
        )}
      </SlidePanel>

      <ContactFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(data) => {
          if (editing) {
            updateContact(editing.id, data);
            toast.success('Contact mis à jour');
          } else {
            addContact({ ...data, id: uid('c'), createdAt: new Date().toISOString() } as Contact);
            toast.success('Contact créé');
          }
          setFormOpen(false);
        }}
        initial={editing}
      />
    </>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-4 py-3">{children}</th>;
}
function Td({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
function Detail({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <div className="label">{label}</div>
      {children ?? <div className="text-sm font-medium">{value}</div>}
    </div>
  );
}

function ContactFormModal({ open, onClose, onSubmit, initial }: { open: boolean; onClose: () => void; onSubmit: (d: Partial<Contact>) => void; initial: Contact | null }) {
  const companies = useCrm((s) => s.companies);
  const [form, setForm] = useState<Partial<Contact>>(() => initial || {
    firstName: '', lastName: '', email: '', phone: '', position: '', companyId: '', tags: [], notes: '',
    source: 'LinkedIn', score: 3, status: 'prospect', lastContact: new Date().toISOString(),
  });

  useState(() => { if (initial) setForm(initial); });

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Modifier le contact' : 'Nouveau contact'} size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Prénom *</label>
            <Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div>
            <label className="label">Nom *</label>
            <Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div>
            <label className="label">Email *</label>
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Poste</label>
            <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          </div>
          <div>
            <label className="label">Entreprise</label>
            <Select value={form.companyId || ''} onChange={(e) => setForm({ ...form, companyId: e.target.value || undefined })}>
              <option value="">—</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="label">Statut</label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ContactStatus })}>
              {CONTACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
          <div>
            <label className="label">Source</label>
            <Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as ContactSource })}>
              {CONTACT_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <label className="label">Tags (séparés par virgules)</label>
            <Input value={(form.tags || []).join(', ')} onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
          </div>
          <div>
            <label className="label">Score prospect</label>
            <StarRating value={form.score || 3} onChange={(n) => setForm({ ...form, score: n as 1 | 2 | 3 | 4 | 5 })} />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit">{initial ? 'Enregistrer' : 'Créer'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default ContactsPage;
