import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppShell } from './components/layout/AppShell';
import DashboardPage from './features/dashboard/DashboardPage';
import ContactsPage from './features/crm/ContactsPage';
import CompaniesPage from './features/crm/CompaniesPage';
import PipelinePage from './features/crm/PipelinePage';
import QuotesPage from './features/facturation/QuotesPage';
import InvoicesPage from './features/facturation/InvoicesPage';
import RelancesPage from './features/relances/RelancesPage';
import SettingsPage from './features/settings/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/crm/contacts" element={<ContactsPage />} />
          <Route path="/crm/entreprises" element={<CompaniesPage />} />
          <Route path="/crm/pipeline" element={<PipelinePage />} />
          <Route path="/devis" element={<QuotesPage />} />
          <Route path="/factures" element={<InvoicesPage />} />
          <Route path="/relances" element={<RelancesPage />} />
          <Route path="/parametres" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
