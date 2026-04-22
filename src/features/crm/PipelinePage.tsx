import { useMemo, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { Plus, TrendingUp, Target, Calendar } from 'lucide-react';
import { PageHeader } from '../../components/layout/AppShell';
import { Card, Button, Modal, Input, Select, Textarea } from '../../components/ui';
import { useCrm } from '../../store';
import { PIPELINE_STAGES } from '../../lib/constants';
import { formatCurrency, formatDate, uid } from '../../lib/utils';
import type { Deal, PipelineStage } from '../../types';
import { toast } from 'sonner';

export function PipelinePage() {
  const { deals, contacts, companies, moveDeal, addDeal } = useCrm();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byStage = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    PIPELINE_STAGES.forEach((s) => (map[s.value] = []));
    deals.forEach((d) => { if (map[d.stage]) map[d.stage].push(d); });
    return map;
  }, [deals]);

  const metrics = useMemo(() => {
    const open = deals.filter((d) => d.stage !== 'gagné' && d.stage !== 'perdu');
    const total = open.reduce((s, d) => s + d.amount, 0);
    const weighted = open.reduce((s, d) => s + d.amount * (d.probability / 100), 0);
    const won = deals.filter((d) => d.stage === 'gagné').reduce((s, d) => s + d.amount, 0);
    return { total, weighted, won, count: open.length };
  }, [deals]);

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const id = String(e.active.id);
    const stage = e.over?.id as PipelineStage | undefined;
    if (stage && PIPELINE_STAGES.some((s) => s.value === stage)) {
      const deal = deals.find((d) => d.id === id);
      if (deal && deal.stage !== stage) {
        moveDeal(id, stage);
        toast.success(`Déplacé vers ${PIPELINE_STAGES.find((s) => s.value === stage)?.label}`);
      }
    }
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  return (
    <>
      <PageHeader
        title="Pipeline commercial"
        description="Glissez-déposez pour faire avancer les deals"
        actions={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />Nouveau deal</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Metric icon={Target} label="Deals ouverts" value={String(metrics.count)} />
        <Metric icon={TrendingUp} label="Pipeline total" value={formatCurrency(metrics.total)} />
        <Metric icon={TrendingUp} label="Pondéré" value={formatCurrency(metrics.weighted)} />
        <Metric icon={Target} label="Gagné" value={formatCurrency(metrics.won)} accent />
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 md:-mx-0 md:px-0">
          {PIPELINE_STAGES.map((stage) => (
            <Column key={stage.value} stage={stage.value} label={stage.label} color={stage.color} deals={byStage[stage.value] || []} contacts={contacts} companies={companies} />
          ))}
        </div>
        <DragOverlay>
          {activeDeal && <DealCard deal={activeDeal} contactName={contacts.find((c) => c.id === activeDeal.contactId)?.firstName + ' ' + contacts.find((c) => c.id === activeDeal.contactId)?.lastName} isOverlay />}
        </DragOverlay>
      </DndContext>

      <DealFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={(d) => { addDeal({ ...d, id: uid('d'), createdAt: new Date().toISOString() } as Deal); setFormOpen(false); toast.success('Deal créé'); }} />
    </>
  );
}

function Metric({ icon: Icon, label, value, accent }: { icon: typeof Target; label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent ? 'bg-gradient-to-br from-accent-500 to-brand-500' : 'bg-[var(--surface-2)] border border-[var(--border)]'}`}>
          <Icon className={`h-4 w-4 ${accent ? 'text-white' : 'text-brand-300'}`} />
        </div>
        <div>
          <div className="text-xs text-[var(--text-muted)]">{label}</div>
          <div className="font-display text-lg font-bold tabular-nums">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function Column({ stage, label, color, deals, contacts, companies }: { stage: PipelineStage; label: string; color: string; deals: Deal[]; contacts: { id: string; firstName: string; lastName: string }[]; companies: { id: string; name: string }[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = deals.reduce((s, d) => s + d.amount, 0);

  return (
    <div ref={setNodeRef} className={`flex min-w-[280px] flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-colors ${isOver ? 'ring-2 ring-brand-500/60' : ''}`}>
      <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          <h3 className="text-sm font-semibold">{label}</h3>
          <span className="text-xs text-[var(--text-muted)]">({deals.length})</span>
        </div>
        <span className="text-xs tabular-nums text-[var(--text-muted)]">{formatCurrency(total)}</span>
      </div>
      <div className="flex-1 space-y-2 p-2 min-h-[200px]">
        {deals.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--text-muted)]">Aucun deal</div>
        ) : (
          deals.map((d) => {
            const contact = contacts.find((c) => c.id === d.contactId);
            const company = companies.find((c) => c.id === d.companyId);
            return <DealCard key={d.id} deal={d} contactName={contact ? `${contact.firstName} ${contact.lastName}` : undefined} companyName={company?.name} />;
          })
        )}
      </div>
    </div>
  );
}

function DealCard({ deal, contactName, companyName, isOverlay }: { deal: Deal; contactName?: string; companyName?: string; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id });
  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      className={`group rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 cursor-grab active:cursor-grabbing transition-all hover:border-brand-500/50 hover:shadow-glow ${isDragging ? 'opacity-30' : ''} ${isOverlay ? 'shadow-2xl ring-2 ring-brand-500/50' : ''}`}
    >
      <div className="text-sm font-medium">{deal.title}</div>
      {(contactName || companyName) && (
        <div className="mt-1 text-xs text-[var(--text-muted)] truncate">
          {contactName}{companyName && ` · ${companyName}`}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className="font-display text-sm font-bold tabular-nums">{formatCurrency(deal.amount)}</span>
        <span className="pill bg-brand-500/15 border-brand-500/30 text-brand-200">{deal.probability}%</span>
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
        <Calendar className="h-3 w-3" />{formatDate(deal.closingDate)}
      </div>
    </div>
  );
}

function DealFormModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (d: Partial<Deal>) => void }) {
  const { contacts, companies } = useCrm();
  const [form, setForm] = useState<Partial<Deal>>({
    title: '', contactId: contacts[0]?.id || '', companyId: '', amount: 0, probability: 50,
    closingDate: new Date(Date.now() + 30 * 86400000).toISOString(), stage: 'prospect', owner: 'LJ', notes: '',
  });

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Nouveau deal" size="lg">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
        <div>
          <label className="label">Titre *</label>
          <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Contact</label>
            <Select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })}>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </Select>
          </div>
          <div>
            <label className="label">Entreprise</label>
            <Select value={form.companyId || ''} onChange={(e) => setForm({ ...form, companyId: e.target.value || undefined })}>
              <option value="">—</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="label">Montant (€)</label>
            <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Probabilité (%)</label>
            <Input type="number" min={0} max={100} value={form.probability} onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Date closing</label>
            <Input type="date" value={form.closingDate?.slice(0, 10)} onChange={(e) => setForm({ ...form, closingDate: new Date(e.target.value).toISOString() })} />
          </div>
          <div>
            <label className="label">Étape</label>
            <Select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as PipelineStage })}>
              {PIPELINE_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit">Créer</Button>
        </div>
      </form>
    </Modal>
  );
}

export default PipelinePage;
