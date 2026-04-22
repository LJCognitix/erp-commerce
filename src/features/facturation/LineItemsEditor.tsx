import { Plus, Trash2 } from 'lucide-react';
import { Input, Button } from '../../components/ui';
import { computeLineTotal, formatCurrency, uid } from '../../lib/utils';
import type { LineItem } from '../../types';

export function LineItemsEditor({ items, onChange }: { items: LineItem[]; onChange: (items: LineItem[]) => void }) {
  const update = (idx: number, patch: Partial<LineItem>) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const add = () => onChange([...items, { id: uid('li'), designation: '', quantity: 1, unit: 'unité', unitPrice: 0, discount: 0, vat: 20 }]);
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const copy = [...items];
    const [m] = copy.splice(from, 1);
    copy.splice(to, 0, m);
    onChange(copy);
  };

  return (
    <div>
      <div className="rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--surface-2)] text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              <th className="p-2 w-8"></th>
              <th className="p-2 text-left">Désignation</th>
              <th className="p-2 text-right w-20">Qté</th>
              <th className="p-2 text-right w-28">PU HT</th>
              <th className="p-2 text-right w-20">Remise %</th>
              <th className="p-2 text-right w-20">TVA %</th>
              <th className="p-2 text-right w-28">Total HT</th>
              <th className="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              const t = computeLineTotal(it);
              return (
                <tr key={it.id} className="border-t border-[var(--border)]">
                  <td className="p-1 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col">
                      <button type="button" onClick={() => move(idx, idx - 1)} className="text-[10px] hover:text-brand-300">▲</button>
                      <button type="button" onClick={() => move(idx, idx + 1)} className="text-[10px] hover:text-brand-300">▼</button>
                    </div>
                  </td>
                  <td className="p-1"><Input className="border-0 bg-transparent px-2" value={it.designation} onChange={(e) => update(idx, { designation: e.target.value })} placeholder="Description..." /></td>
                  <td className="p-1"><Input type="number" className="border-0 bg-transparent px-2 text-right" value={it.quantity} onChange={(e) => update(idx, { quantity: Number(e.target.value) })} /></td>
                  <td className="p-1"><Input type="number" className="border-0 bg-transparent px-2 text-right" value={it.unitPrice} onChange={(e) => update(idx, { unitPrice: Number(e.target.value) })} /></td>
                  <td className="p-1"><Input type="number" className="border-0 bg-transparent px-2 text-right" value={it.discount} onChange={(e) => update(idx, { discount: Number(e.target.value) })} /></td>
                  <td className="p-1"><Input type="number" className="border-0 bg-transparent px-2 text-right" value={it.vat} onChange={(e) => update(idx, { vat: Number(e.target.value) })} /></td>
                  <td className="p-2 text-right tabular-nums font-medium">{formatCurrency(t.ht)}</td>
                  <td className="p-1 text-center">
                    <button type="button" onClick={() => remove(idx)} className="text-danger hover:bg-danger/10 rounded p-1" aria-label="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-sm text-[var(--text-muted)]">Aucune ligne. Ajoutez-en une.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" onClick={add} className="mt-3" size="sm"><Plus className="h-4 w-4" />Ajouter une ligne</Button>
    </div>
  );
}
