import { useState } from 'react';
import { Building2, Palette, FileText, Save } from 'lucide-react';
import { PageHeader } from '../../components/layout/AppShell';
import { Card, CardHeader, CardTitle, Button, Input, Textarea } from '../../components/ui';
import { useSettings, useTheme } from '../../store';
import { APP_VERSION } from '../../lib/constants';
import { toast } from 'sonner';

export function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const [form, setForm] = useState(settings);

  const save = () => {
    updateSettings(form);
    toast.success('Paramètres sauvegardés');
  };

  return (
    <>
      <PageHeader title="Paramètres" description="Configuration de votre entreprise et préférences" actions={<Button onClick={save}><Save className="h-4 w-4" />Enregistrer</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-300" />
              <CardTitle>Informations entreprise</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-3">
            <Field label="Raison sociale" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="SIRET" value={form.siret} onChange={(v) => setForm({ ...form, siret: v })} />
              <Field label="N° TVA" value={form.vatNumber} onChange={(v) => setForm({ ...form, vatNumber: v })} />
            </div>
            <Field label="Adresse" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Code postal" value={form.zip} onChange={(v) => setForm({ ...form, zip: v })} />
              <Field label="Ville" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            </div>
            <Field label="IBAN" value={form.iban} onChange={(v) => setForm({ ...form, iban: v })} />
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-300" />
                <CardTitle>Facturation</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Préfixe devis" value={form.quotePrefix} onChange={(v) => setForm({ ...form, quotePrefix: v })} />
                <Field label="Préfixe factures" value={form.invoicePrefix} onChange={(v) => setForm({ ...form, invoicePrefix: v })} />
              </div>
              <div>
                <label className="label">TVA par défaut (%)</label>
                <Input type="number" value={form.defaultVat} onChange={(e) => setForm({ ...form, defaultVat: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Mentions légales</label>
                <Textarea rows={3} value={form.legalMentions} onChange={(e) => setForm({ ...form, legalMentions: e.target.value })} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-brand-300" />
                <CardTitle>Apparence</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-[var(--surface-2)] p-3 border border-[var(--border)]">
                <div>
                  <div className="text-sm font-medium">Mode sombre</div>
                  <div className="text-xs text-[var(--text-muted)]">Interface optimisée pour les longues sessions</div>
                </div>
                <button onClick={toggleTheme} role="switch" aria-checked={theme === 'dark'} className={`relative h-6 w-11 rounded-full transition-colors ${theme === 'dark' ? 'bg-brand-500' : 'bg-[var(--border)]'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${theme === 'dark' ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="rounded-lg bg-[var(--surface-2)] p-3 border border-[var(--border)] text-xs text-[var(--text-muted)]">
                Version {APP_VERSION} · LJ Cognitix ERP · Backend : <code className="text-brand-300">mock local</code>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default SettingsPage;
