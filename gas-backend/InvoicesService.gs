/**
 * @file InvoicesService.gs
 * Handles business logic and CRUD for Invoices
 */

const InvoicesService = {
  helper: () => new SheetHelper(CONFIG.SHEETS.INVOICES),

  getAll: (filters = {}, page = 1, limit = CONFIG.DEFAULT_PAGE_SIZE) => {
    let internalFilters = { ...filters };
    let returnOverdue = false;
    
    if (internalFilters.overdue === 'true' || internalFilters.overdue === true) {
      returnOverdue = true;
      delete internalFilters.overdue; // Remove so it doesn't try an exact match
    }
    
    const result = InvoicesService.helper().getAll(internalFilters, page, limit);
    
    if (returnOverdue) {
      // In a real DB, you'd query due_date < today AND status != paid. Here we filter post-fetch.
      // To get accurate pagination, it's better to fetch all and then filter.
      // We will do a custom filter here if overdue is requested.
      const allRes = InvoicesService.helper().getAll(internalFilters, 1, 10000);
      let overdueList = allRes.data.filter(inv => inv.status !== 'paid' && isOverdue(inv.due_date));
      overdueList.forEach(inv => inv.days_overdue = getDaysOverdue(inv.due_date));
      overdueList.sort((a, b) => b.days_overdue - a.days_overdue); // DESC
      
      const startIndex = (page - 1) * limit;
      return {
        data: overdueList.slice(startIndex, startIndex + parseInt(limit, 10)),
        total: overdueList.length
      };
    }
    
    return result;
  },

  getById: (id) => {
    const inv = InvoicesService.helper().getById(id);
    if (!inv) throw new Error('Invoice not found');
    return inv;
  },

  getNextNumber: () => {
    return { number: generateInvoiceNumber() };
  },

  getOverdue: () => {
    return InvoicesService.getAll({ overdue: true }, 1, 1000);
  },

  create: (data) => {
    if (!data.contact_id && !data.company_id) {
      throw new Error('contact_id or company_id is required');
    }
    if (!data.payment_terms) {
      throw new Error('payment_terms is required');
    }
    
    let items = typeof data.items_json === 'string' ? parseJSON(data.items_json) : (data.items_json || []);
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('items_json must be a non-empty array');
    }

    const newInvoice = { ...data };
    newInvoice.number = generateInvoiceNumber();
    newInvoice.status = 'sent';
    newInvoice.issue_date = data.issue_date || now();
    newInvoice.due_date = calculateDueDate(newInvoice.issue_date, newInvoice.payment_terms);
    newInvoice.items_json = JSON.stringify(items);
    newInvoice.amount_paid = 0;
    
    const totals = calculateInvoiceTotals(items);
    newInvoice.total_ht = totals.total_ht;
    newInvoice.total_tva = totals.total_tva;
    newInvoice.total_ttc = totals.total_ttc;

    return InvoicesService.helper().create(newInvoice);
  },

  update: (id, data) => {
    let updateData = { ...data };
    
    if (data.items_json) {
      let items = typeof data.items_json === 'string' ? parseJSON(data.items_json) : data.items_json;
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('items_json must be a non-empty array');
      }
      updateData.items_json = JSON.stringify(items);
      const totals = calculateInvoiceTotals(items);
      updateData.total_ht = totals.total_ht;
      updateData.total_tva = totals.total_tva;
      updateData.total_ttc = totals.total_ttc;
    }
    
    if (data.issue_date || data.payment_terms) {
      const inv = InvoicesService.getById(id);
      const iDate = updateData.issue_date || inv.issue_date;
      const pTerms = updateData.payment_terms || inv.payment_terms;
      updateData.due_date = calculateDueDate(iDate, pTerms);
    }
    
    return InvoicesService.helper().update(id, updateData);
  },

  updateStatus: (id, status) => {
    if (!status) throw new Error('status is required');
    return InvoicesService.helper().update(id, { status });
  },

  addPayment: (id, data) => {
    if (!data.amount) throw new Error('amount is required');
    
    const invoice = InvoicesService.getById(id);
    const newAmountPaid = (parseFloat(invoice.amount_paid) || 0) + parseFloat(data.amount);
    const paymentDate = data.date || now();
    
    let newStatus = 'partial';
    if (newAmountPaid >= invoice.total_ttc) {
      newStatus = 'paid';
    }
    
    return InvoicesService.helper().update(id, {
      amount_paid: newAmountPaid,
      payment_date: paymentDate,
      status: newStatus
    });
  },

  delete: (id) => {
    return InvoicesService.helper().softDelete(id);
  }
};
