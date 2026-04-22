/**
 * @file SetupService.gs
 * Handles initial database creation and mock data seeding
 */

const SetupService = {
  initDatabase: () => {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const created = [];
    const existing = [];

    const schemas = {
      [CONFIG.SHEETS.CONTACTS]: ['id', 'created_at', 'updated_at', 'first_name', 'last_name', 'email', 'phone', 'position', 'company_id', 'tags', 'notes', 'source', 'score', 'status', 'last_contact_date', 'is_deleted'],
      [CONFIG.SHEETS.COMPANIES]: ['id', 'created_at', 'updated_at', 'name', 'siret', 'sector', 'size', 'website', 'address', 'city', 'zip', 'country', 'revenue_estimate', 'notes', 'is_deleted'],
      [CONFIG.SHEETS.PIPELINE]: ['id', 'created_at', 'updated_at', 'title', 'contact_id', 'company_id', 'stage', 'amount', 'probability', 'expected_close_date', 'assigned_to', 'notes', 'is_deleted'],
      [CONFIG.SHEETS.QUOTES]: ['id', 'created_at', 'updated_at', 'number', 'contact_id', 'company_id', 'status', 'validity_date', 'items_json', 'total_ht', 'total_tva', 'total_ttc', 'conditions', 'notes', 'discount_global', 'is_deleted'],
      [CONFIG.SHEETS.INVOICES]: ['id', 'created_at', 'updated_at', 'number', 'quote_id', 'contact_id', 'company_id', 'status', 'issue_date', 'due_date', 'payment_terms', 'items_json', 'total_ht', 'total_tva', 'total_ttc', 'amount_paid', 'payment_date', 'notes', 'is_deleted'],
      [CONFIG.SHEETS.RELANCES]: ['id', 'created_at', 'updated_at', 'invoice_id', 'level', 'status', 'sent_at', 'next_relance_date', 'notes', 'is_deleted'],
      [CONFIG.SHEETS.SETTINGS]: ['id', 'key', 'value', 'updated_at', 'created_at', 'is_deleted'], // added base fields to align with SheetHelper generic logic
      [CONFIG.SHEETS.LOGS]: ['timestamp', 'method', 'endpoint', 'status', 'payload_size', 'execution_ms', 'error']
    };

    for (const [sheetName, headers] of Object.entries(schemas)) {
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
        created.push(sheetName);
      } else {
        existing.push(sheetName);
      }
    }

    return { created, existing };
  },

  seedMockData: () => {
    // Only seed if empty to prevent duplicating data
    const contactsHelper = new SheetHelper(CONFIG.SHEETS.CONTACTS);
    if (contactsHelper.getAll({}, 1, 1).total > 0) {
      return { seeded: false, reason: "Database already contains data." };
    }

    const counts = { contacts: 0, companies: 0, pipeline: 0, quotes: 0, invoices: 0, relances: 0 };

    // Create Companies
    const c1 = CompaniesService.create({ name: 'Acme Corp', siret: '12345678901234', sector: 'IT', city: 'Paris', country: 'France' });
    const c2 = CompaniesService.create({ name: 'Globex', siret: '98765432109876', sector: 'Retail', city: 'Lyon', country: 'France' });
    counts.companies = 2;

    // Create Contacts
    const u1 = ContactsService.create({ first_name: 'Jean', last_name: 'Dupont', email: 'jean.dupont@acme.com', company_id: c1.id });
    const u2 = ContactsService.create({ first_name: 'Marie', last_name: 'Curie', email: 'marie@globex.com', company_id: c2.id });
    counts.contacts = 2;

    // Create Pipeline
    const p1 = PipelineService.create({ title: 'Projet Refonte', company_id: c1.id, amount: 15000, stage: 'negotiation' });
    counts.pipeline = 1;

    // Create Quote
    const q1 = QuotesService.create({
      company_id: c1.id,
      items_json: [
        { description: 'Consulting', qty: 10, unit_price: 500, tva_rate: 20 },
        { description: 'Licence', qty: 1, unit_price: 1500, tva_rate: 20 }
      ]
    });
    counts.quotes = 1;

    // Create Invoice (Overdue)
    let issueDate = new Date();
    issueDate.setDate(issueDate.getDate() - 40); // Issued 40 days ago
    
    const i1 = InvoicesService.create({
      company_id: c1.id,
      payment_terms: '30',
      issue_date: issueDate.toISOString(),
      items_json: [
        { description: 'Audit', qty: 1, unit_price: 3000, tva_rate: 20 }
      ]
    });
    counts.invoices = 1;

    // Relance
    const r1 = RelancesService.create({
      invoice_id: i1.id,
      level: 1,
      status: 'pending'
    });
    counts.relances = 1;

    return { seeded: true, counts };
  }
};
