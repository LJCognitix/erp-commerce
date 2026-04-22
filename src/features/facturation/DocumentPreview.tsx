import { computeLineTotal, computeTotals, formatCurrency, formatDate } from '../../lib/utils';
import type { LineItem } from '../../types';
import { useSettings } from '../../store';
import { Sparkles } from 'lucide-react';

interface Props {
  kind: 'quote' | 'invoice';
  number: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  items: LineItem[];
  notes?: string;
  terms?: string;
  printable?: boolean;
}

export function DocumentPreview({ kind, number, clientName, issueDate, dueDate, items, notes, terms, printable }: Props) {
  const settings = useSettings((s) => s.settings);
  const totals = computeTotals(items);

  return (
    <div className={`rounded-lg ${printable ? 'bg-white text-gray-900' : 'bg-white text-gray-900 max-h-[75vh] overflow-auto'} p-8 shadow-inner`}>
      <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-900">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#6C3BFF] to-[#00E5BE]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg leading-none">{settings.name}</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500">Automatisation IA</div>
            </div>
          </div>
          <div className="text-xs text-gray-600 leading-snug">
            {settings.address}<br />{settings.zip} {settings.city}<br />
            SIRET {settings.siret}<br />TVA {settings.vatNumber}<br />
            {settings.email} · {settings.phone}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tracking-tight" style={{ color: '#6C3BFF' }}>{kind === 'quote' ? 'DEVIS' : 'FACTURE'}</div>
          <div className="text-sm font-mono mt-1">{number}</div>
          <div className="mt-4 text-xs text-gray-600">
            <div><strong>Date d'émission :</strong> {formatDate(issueDate)}</div>
            <div><strong>{kind === 'quote' ? 'Valide jusqu\'au' : 'Échéance'} :</strong> {formatDate(dueDate)}</div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Facturé à</div>
        <div className="font-semibold text-lg">{clientName}</div>
      </div>

      <table className="w-full text-sm mb-6">
        <thead>
          <tr className="border-b-2 border-gray-900 text-xs uppercase tracking-wider text-gray-700">
            <th className="py-2 text-left">Désignation</th>
            <th className="py-2 text-right w-16">Qté</th>
            <th className="py-2 text-right w-24">PU HT</th>
            <th className="py-2 text-right w-16">Rem.</th>
            <th className="py-2 text-right w-16">TVA</th>
            <th className="py-2 text-right w-28">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const t = computeLineTotal(it);
            return (
              <tr key={it.id} className="border-b border-gray-200">
                <td className="py-2">{it.designation || '—'}</td>
                <td className="py-2 text-right">{it.quantity}</td>
                <td className="py-2 text-right">{formatCurrency(it.unitPrice)}</td>
                <td className="py-2 text-right">{it.discount}%</td>
                <td className="py-2 text-right">{it.vat}%</td>
                <td className="py-2 text-right font-medium">{formatCurrency(t.ht)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-72 space-y-1 text-sm">
          <Row label="Total HT" value={formatCurrency(totals.ht)} />
          <Row label="TVA" value={formatCurrency(totals.vat)} />
          <div className="border-t-2 border-gray-900 pt-2 mt-2 flex justify-between font-bold text-base">
            <span>Total TTC</span><span style={{ color: '#6C3BFF' }}>{formatCurrency(totals.ttc)}</span>
          </div>
        </div>
      </div>

      {(terms || notes) && (
        <div className="mt-8 pt-6 border-t border-gray-200 space-y-3 text-xs text-gray-600">
          {terms && <div><strong className="text-gray-800">Conditions :</strong> {terms}</div>}
          {notes && <div><strong className="text-gray-800">Notes :</strong> {notes}</div>}
          <div className="text-[10px] text-gray-500 pt-2">
            IBAN : {settings.iban} — {settings.legalMentions}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-gray-600">{label}</span><span className="font-medium tabular-nums">{value}</span></div>;
}
