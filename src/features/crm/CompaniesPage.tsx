import { useMemo, useState } from 'react';
import { Plus, Building2, ExternalLink, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/layout/AppShell';
import { Button, Card, Modal, Input, Textarea, Select, Badge, SlidePanel } from '../../components/ui';
import { SearchInput, EmptyState } from '../../components/shared';
import { useCrm } from '../../store';
import { COMPANY_SIZES } from '../../lib/constants';
import { formatCurrency, formatDate, uid } from '../../lib/utils';
import type { Company, CompanySize } from '../../types';
import { toast } from 'sonner';

export function CompaniesPage() {
  const { companies, contacts, addCompany, updateCompany, removeCompany } = useCrm();
  const [search, setSearch] = useState('');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [selected, setSelected] = useState<Company | null>(null);

  const filtered = useMemo(
    () =>
      companies.filter((c) => {
        if (sizeFilter !== 'all' && c.size !== sizeFilter) return false;
        if (search) {
          const s = search.toLowerCase();
          if (!`${c.name} ${c.sector} ${c.city}`.toLowerCase().includes(s)) return false;
        }
        return true;
      }),
    [companies, search, sizeFilter]
  );

  const contactsOf = (id: string) => contacts.filter((c) => c.companyId === id);

  return (
    <>
      <PageHeader
        title="Entreprises"
        description={`${companies.length} entreprises dans votre base`}
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" />Nouvelle entreprise</Button>}
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[220px]" />
          <Select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} className="max-w-[200px]">
            <option value="all">Toutes tailles</option>
            {COMPANY_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="Aucune entreprise" description="Créez votre première entreprise pour organiser vos contacts." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} interactive onClick={() => setSelected(c)} className="cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                  <Building2 className="h-5 w-5 text-brand-300" />
                </div>
                <Badge color="brand">{c.size}</Badge>
              </div>
              <h3 className="font-display font-semibold truncate">{c.name}</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{c.sector} · {c.city}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[var(--text-muted)]">CA estimé</div>
                  <div className="font-semibold tabular-nums">{formatCurrency(c.estimatedRevenue)}</div>
                </div>
                <div>
                  <div className="text-[var(--text-muted)]">Contacts</div>
                  <div className="font-semibold">{contactsOf(c.id).length}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <SlidePanel open={!!selected} onClose={() => setSelected(null)} title="Fiche entreprise">
        {selected && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold">{selected.name}</h2>
              <p className="text-sm text-[var(--text-muted)]">{selected.sector}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="SIRET" value={selected.siret} />
              <Info label="Taille" value={selected.size} />
              <Info label="CA estimé" value={formatCurrency(selected.estimatedRevenue)} />
              <Info label="Créée le" value={formatDate(selected.createdAt)} />
              <Info label="Adresse" value={`${selected.address}, ${selected.zip} ${selected.city}`} />
              <div>
                <div className="label">Site web</div>
                <a href={selected.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-brand-300 hover:underline">
                  {selected.website.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            {selected.notes && (
              <div>
                <div className="label">Notes</div>
                <div className="rounded-lg bg-[var(--surface-2)] p-3 border border-[var(--border)] text-sm">{selected.notes}</div>
              </div>
            )}
            <div>
              <div className="label">Contacts associés ({contactsOf(selected.id).length})</div>
              <div className="space-y-2">
                {contactsOf(selected.id).map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg bg-[var(--surface-2)] p-2 border border-[var(--border)]">
                    <div>
                      <div className="text-sm font-medium">{c.firstName} {c.lastName}</div>
                      <div className="text-xs text-[var(--text-muted)]">{c.position}</div>
                    </div>
                    <a href={`mailto:${c.email}`} className="text-xs text-brand-300 hover:underline">Contacter</a>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
              <Button variant="outline" onClick={() => { setEditing(selected); setFormOpen(true); setSelected(null); }}>Modifier</Button>
              <Button variant="danger" onClick={() => { removeCompany(selected.id); setSelected(null); toast.success('Entreprise supprimée'); }}><Trash2 className="h-4 w-4" />Supprimer</Button>
            </div>
          </div>
        )}
      </SlidePanel>

      <CompanyForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        onSubmit={(data) => {
          if (editing) { updateCompany(editing.id, data); toast.success('Entreprise mise à jour'); }
          else { addCompany({ ...data, id: uid('co'), createdAt: new Date().toISOString() } as Company); toast.success('Entreprise créée'); }
          setFormOpen(false);
        }}
      />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="label">{label}</div><div className="text-sm font-medium">{value}</div></div>;
}

function CompanyForm({ open, onClose, onSubmit, initial }: { open: boolean; onClose: () => void; onSubmit: (d: Partial<Company>) => void; initial: Company | null }) {
  const [form, setForm] = useState<Partial<Company>>(
    initial || { name: '', siret: '', sector: '', size: 'PME', website: '', address: '', city: '', zip: '', country: 'France', estimatedRevenue: 0, notes: '' }
  );
  useState(() => { if (initial) setForm(initial); });

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Modifier' : 'Nouvelle entreprise'} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Raison sociale *</label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">SIRET</label>
            <Input value={form.siret} onChange={(e) => setForm({ ...form, siret: e.target.value })} />
          </div>
          <div>
            <label className="label">Secteur</label>
            <Input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
          </div>
          <div>
            <label className="label">Taille</label>
            <Select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value as CompanySize })}>
              {COMPANY_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
          <div>
            <label className="label">Site web</label>
            <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Adresse</label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">Code postal</label>
            <Input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
          </div>
          <div>
            <label className="label">Ville</label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className="label">CA estimé (€)</label>
            <Input type="number" value={form.estimatedRevenue} onChange={(e) => setForm({ ...form, estimatedRevenue: Number(e.target.value) })} />
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

export default CompaniesPage;
