/**
 * @file RelancesService.gs
 * Handles business logic and CRUD for Relances (Reminders)
 */

const RelancesService = {
  helper: () => new SheetHelper(CONFIG.SHEETS.RELANCES),

  getAll: (filters = {}, page = 1, limit = CONFIG.DEFAULT_PAGE_SIZE) => {
    return RelancesService.helper().getAll(filters, page, limit);
  },

  getById: (id) => {
    const relance = RelancesService.helper().getById(id);
    if (!relance) throw new Error('Relance not found');
    return relance;
  },

  getByInvoice: (invoiceId) => {
    return RelancesService.helper().getAll({ invoice_id: invoiceId }, 1, 100);
  },

  create: (data) => {
    if (!data.invoice_id) throw new Error('invoice_id is required');
    if (!data.level) throw new Error('level is required');
    
    const relanceData = {
      ...data,
      status: data.status || 'pending',
      sent_at: data.status === 'sent' ? now() : ''
    };
    return RelancesService.helper().create(relanceData);
  },

  update: (id, data) => {
    return RelancesService.helper().update(id, data);
  },

  markSent: (id) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7); // Default next relance in 7 days
    
    return RelancesService.helper().update(id, {
      status: 'sent',
      sent_at: now(),
      next_relance_date: nextDate.toISOString()
    });
  },

  delete: (id) => {
    return RelancesService.helper().softDelete(id);
  },

  getRelanceLevel: (daysOverdue) => {
    if (daysOverdue < 15) return 1;
    if (daysOverdue <= 30) return 2;
    return 3;
  },

  getPending: () => {
    // 1. Get all overdue invoices
    const overdueInvoices = InvoicesService.getOverdue().data;
    if (overdueInvoices.length === 0) return { data: [], total: 0 };

    // 2. Get all relances to check recent ones
    const allRelances = RelancesService.helper().getAll({}, 1, 10000).data;
    
    const pending = [];
    const today = new Date();

    for (let inv of overdueInvoices) {
      // Find relances for this invoice
      const invRelances = allRelances.filter(r => r.invoice_id === inv.id);
      
      // Sort to get the latest
      invRelances.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const latest = invRelances.length > 0 ? invRelances[0] : null;

      let shouldRemind = false;

      if (!latest) {
        shouldRemind = true;
      } else {
        // If the latest was sent, check if next_relance_date is passed or if it was > 7 days ago
        if (latest.status === 'sent') {
          const sentDate = new Date(latest.sent_at);
          const diffDays = Math.floor((today - sentDate) / (1000 * 60 * 60 * 24));
          if (diffDays >= 7) {
            shouldRemind = true;
          }
        }
      }

      if (shouldRemind) {
        // Enrich data
        let contact = null;
        let company = null;
        if (inv.contact_id) contact = ContactsService.getById(inv.contact_id);
        if (inv.company_id) company = CompaniesService.getById(inv.company_id);

        pending.push({
          invoice: inv,
          contact: contact,
          company: company,
          recommended_level: RelancesService.getRelanceLevel(inv.days_overdue),
          days_overdue: inv.days_overdue
        });
      }
    }

    // Sort by urgency (days overdue desc)
    pending.sort((a, b) => b.days_overdue - a.days_overdue);

    return { data: pending, total: pending.length };
  },

  generateEmailTemplate: (invoiceId, relanceLevel) => {
    const inv = InvoicesService.getById(invoiceId);
    let companyName = '';
    let clientName = '';
    
    if (inv.company_id) {
      const c = CompaniesService.getById(inv.company_id);
      companyName = c.name;
    }
    if (inv.contact_id) {
      const c = ContactsService.getById(inv.contact_id);
      clientName = `${c.first_name} ${c.last_name}`;
    }

    // Default simple templates fallback if not in settings
    let subjectTemplate = `Relance Facture {invoice_number}`;
    let bodyTemplate = `Bonjour {client_name},\n\nSauf erreur ou omission de notre part, la facture {invoice_number} d'un montant de {amount_ttc}€ arrivée à échéance le {due_date} est toujours impayée.\n\nMerci de bien vouloir régulariser la situation.\n\nCordialement,\n{sender_name}`;

    try {
      // Attempt to load from settings
      const settingsHelper = new SheetHelper(CONFIG.SHEETS.SETTINGS);
      const settings = settingsHelper.getAll({}, 1, 100).data;
      
      const sSubj = settings.find(s => s.key === `relance_level_${relanceLevel}_subject`);
      const sBody = settings.find(s => s.key === `relance_level_${relanceLevel}_body`);
      
      if (sSubj) subjectTemplate = sSubj.value;
      if (sBody) bodyTemplate = sBody.value;
    } catch (e) {
      // ignore
    }

    const daysOverdue = getDaysOverdue(inv.due_date);
    const dueDateStr = new Date(inv.due_date).toLocaleDateString('fr-FR');
    
    // Replace vars
    const mapObj = {
      "{client_name}": clientName || companyName || 'Client',
      "{invoice_number}": inv.number,
      "{amount_ttc}": inv.total_ttc,
      "{due_date}": dueDateStr,
      "{days_overdue}": daysOverdue,
      "{company_name}": companyName,
      "{sender_name}": CONFIG.APP_NAME
    };

    const re = new RegExp(Object.keys(mapObj).join("|"), "gi");
    
    const subject = subjectTemplate.replace(re, function(matched){
      return mapObj[matched];
    });
    const body = bodyTemplate.replace(re, function(matched){
      return mapObj[matched];
    });

    return { subject, body };
  }
};
