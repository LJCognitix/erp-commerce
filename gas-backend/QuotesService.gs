/**
 * @file QuotesService.gs
 * Handles business logic and CRUD for Quotes
 */

const QuotesService = {
  helper: () => new SheetHelper(CONFIG.SHEETS.QUOTES),

  getAll: (filters = {}, page = 1, limit = CONFIG.DEFAULT_PAGE_SIZE) => {
    return QuotesService.helper().getAll(filters, page, limit);
  },

  getById: (id) => {
    const quote = QuotesService.helper().getById(id);
    if (!quote) throw new Error('Quote not found');
    return quote;
  },

  getNextNumber: () => {
    return { number: generateQuoteNumber() };
  },

  create: (data) => {
    if (!data.contact_id && !data.company_id) {
      throw new Error('contact_id or company_id is required');
    }
    
    // items_json is expected to be an array or stringified array
    let items = typeof data.items_json === 'string' ? parseJSON(data.items_json) : (data.items_json || []);
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('items_json must be a non-empty array');
    }

    const newQuote = { ...data };
    newQuote.number = generateQuoteNumber();
    newQuote.status = 'draft';
    newQuote.items_json = JSON.stringify(items);
    
    // Calculate totals
    const totals = calculateInvoiceTotals(items);
    
    // Apply global discount if present
    const globalDiscount = parseFloat(newQuote.discount_global) || 0;
    if (globalDiscount > 0) {
      const discountAmount = totals.total_ht * (globalDiscount / 100);
      totals.total_ht -= discountAmount;
      // Recalculate TVA based on items' average rate or assume standard logic. 
      // For simplicity, we just recalculate based on the new total_ht proportionally, 
      // but usually the items calculation handles discounts per item. 
      // If it's a global discount over total_ht, TVA must also reflect this.
      const tvaRatio = totals.total_tva / (totals.total_ht + discountAmount);
      totals.total_tva = totals.total_ht * tvaRatio;
      totals.total_ttc = totals.total_ht + totals.total_tva;
    }

    newQuote.total_ht = totals.total_ht;
    newQuote.total_tva = totals.total_tva;
    newQuote.total_ttc = totals.total_ttc;

    return QuotesService.helper().create(newQuote);
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
      const globalDiscount = parseFloat(data.discount_global || 0);
      
      if (globalDiscount > 0) {
        const discountAmount = totals.total_ht * (globalDiscount / 100);
        totals.total_ht -= discountAmount;
        const tvaRatio = totals.total_tva / (totals.total_ht + discountAmount);
        totals.total_tva = totals.total_ht * tvaRatio;
        totals.total_ttc = totals.total_ht + totals.total_tva;
      }

      updateData.total_ht = totals.total_ht;
      updateData.total_tva = totals.total_tva;
      updateData.total_ttc = totals.total_ttc;
    }
    
    return QuotesService.helper().update(id, updateData);
  },

  updateStatus: (id, status) => {
    if (!status) throw new Error('status is required');
    return QuotesService.helper().update(id, { status });
  },

  convertToInvoice: (id) => {
    const quote = QuotesService.getById(id);
    
    const invoiceData = {
      quote_id: quote.id,
      contact_id: quote.contact_id,
      company_id: quote.company_id,
      items_json: quote.items_json, // keep original JSON string or array
      payment_terms: '30', // default
      notes: `Invoice converted from quote ${quote.number}`,
      discount_global: quote.discount_global
    };
    
    // InvoicesService.create handles number generation, dates, and recalculation
    const invHelper = new SheetHelper(CONFIG.SHEETS.INVOICES);
    
    // calculate dates
    const issueDate = now();
    const dueDate = calculateDueDate(issueDate, invoiceData.payment_terms);
    
    let items = typeof quote.items_json === 'string' ? parseJSON(quote.items_json) : quote.items_json;
    
    const newInvoice = {
      ...invoiceData,
      number: generateInvoiceNumber(),
      status: 'sent',
      issue_date: issueDate,
      due_date: dueDate,
      items_json: JSON.stringify(items),
      amount_paid: 0,
      total_ht: quote.total_ht,
      total_tva: quote.total_tva,
      total_ttc: quote.total_ttc
    };

    const createdInvoice = invHelper.create(newInvoice);
    
    // Update quote status
    QuotesService.updateStatus(id, 'converted');
    
    return createdInvoice;
  },

  duplicate: (id) => {
    const quote = QuotesService.getById(id);
    delete quote.id;
    delete quote.created_at;
    delete quote.updated_at;
    
    // generate new number
    quote.number = generateQuoteNumber();
    quote.status = 'draft';
    
    // dates reset
    quote.validity_date = '';
    
    return QuotesService.helper().create(quote);
  },

  delete: (id) => {
    return QuotesService.helper().softDelete(id);
  }
};
