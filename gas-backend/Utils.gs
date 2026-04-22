/**
 * Generates a unique UUID
 * @returns {string} UUID
 */
function generateId() {
  return Utilities.getUuid();
}

/**
 * Returns current date and time as ISO string
 * @returns {string} ISO Date
 */
function now() {
  return new Date().toISOString();
}

/**
 * Generates a new Quote Number (DEV-YYYY-XXXX)
 * @returns {string} Quote number
 */
function generateQuoteNumber() {
  try {
    const helper = new SheetHelper(CONFIG.SHEETS.QUOTES);
    const { data } = helper.getAll();
    const currentYear = new Date().getFullYear();
    
    // Filter quotes for current year
    const quotesThisYear = data.filter(q => q.number && q.number.includes(`DEV-${currentYear}-`));
    
    let nextCounter = 1;
    if (quotesThisYear.length > 0) {
      // Find max counter
      const counters = quotesThisYear.map(q => {
        const parts = q.number.split('-');
        return parseInt(parts[2], 10) || 0;
      });
      nextCounter = Math.max(...counters) + 1;
    }
    
    const paddedCounter = nextCounter.toString().padStart(4, '0');
    return `DEV-${currentYear}-${paddedCounter}`;
  } catch (err) {
    // Fallback if sheet fails
    const paddedCounter = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `DEV-${new Date().getFullYear()}-${paddedCounter}`;
  }
}

/**
 * Generates a new Invoice Number (FAC-YYYY-XXXX)
 * @returns {string} Invoice number
 */
function generateInvoiceNumber() {
  try {
    const helper = new SheetHelper(CONFIG.SHEETS.INVOICES);
    const { data } = helper.getAll();
    const currentYear = new Date().getFullYear();
    
    const invoicesThisYear = data.filter(i => i.number && i.number.includes(`FAC-${currentYear}-`));
    
    let nextCounter = 1;
    if (invoicesThisYear.length > 0) {
      const counters = invoicesThisYear.map(i => {
        const parts = i.number.split('-');
        return parseInt(parts[2], 10) || 0;
      });
      nextCounter = Math.max(...counters) + 1;
    }
    
    const paddedCounter = nextCounter.toString().padStart(4, '0');
    return `FAC-${currentYear}-${paddedCounter}`;
  } catch (err) {
    const paddedCounter = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `FAC-${new Date().getFullYear()}-${paddedCounter}`;
  }
}

/**
 * Calculates due date based on issue date and payment terms
 * @param {string|Date} issueDate - Issue date
 * @param {string} paymentTerms - e.g. "0", "30", "60", "EOM30"
 * @returns {string} ISO date string
 */
function calculateDueDate(issueDate, paymentTerms) {
  const d = new Date(issueDate);
  
  if (paymentTerms === '0' || paymentTerms === 'comptant') {
    // Same day
    return d.toISOString();
  } else if (paymentTerms === '30') {
    d.setDate(d.getDate() + 30);
    return d.toISOString();
  } else if (paymentTerms === '60') {
    d.setDate(d.getDate() + 60);
    return d.toISOString();
  } else if (paymentTerms === 'EOM30' || paymentTerms === 'fin_de_mois_30') {
    // End of month + 30 days
    d.setMonth(d.getMonth() + 1);
    d.setDate(0); // Last day of current month
    d.setDate(d.getDate() + 30);
    return d.toISOString();
  } else {
    // Default 30 days
    d.setDate(d.getDate() + 30);
    return d.toISOString();
  }
}

/**
 * Checks if a date is overdue compared to today
 * @param {string|Date} dueDate 
 * @returns {boolean}
 */
function isOverdue(dueDate) {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time part for fair comparison
  return due < today;
}

/**
 * Gets the number of days overdue
 * @param {string|Date} dueDate 
 * @returns {number} positive if overdue, negative if not yet due
 */
function getDaysOverdue(dueDate) {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = today - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
}

/**
 * Calculates invoice totals from an array of items
 * @param {Array} items - Array of {qty, unit_price, discount, tva_rate}
 * @returns {Object} { total_ht, total_tva, total_ttc }
 */
function calculateInvoiceTotals(items) {
  let total_ht = 0;
  let total_tva = 0;
  
  items.forEach(item => {
    const qty = parseFloat(item.qty) || 0;
    const price = parseFloat(item.unit_price) || 0;
    const discount = parseFloat(item.discount) || 0; // assuming percentage e.g. 10 for 10%
    const tva = parseFloat(item.tva_rate) || 0; // assuming percentage e.g. 20 for 20%
    
    let lineHt = qty * price;
    if (discount > 0) {
      lineHt = lineHt * (1 - (discount / 100));
    }
    
    const lineTva = lineHt * (tva / 100);
    
    total_ht += lineHt;
    total_tva += lineTva;
  });
  
  return {
    total_ht: Number(total_ht.toFixed(2)),
    total_tva: Number(total_tva.toFixed(2)),
    total_ttc: Number((total_ht + total_tva).toFixed(2))
  };
}

/**
 * Safely parses a JSON string
 * @param {string} str 
 * @returns {any}
 */
function parseJSON(str) {
  if (!str) return [];
  try {
    return JSON.parse(str);
  } catch (e) {
    return [];
  }
}

/**
 * Sanitizes string to prevent Sheets formula injection
 * @param {any} val 
 * @returns {any}
 */
function sanitize(val) {
  if (typeof val === 'string') {
    if (val.startsWith('=') || val.startsWith('+') || val.startsWith('-') || val.startsWith('@')) {
      return "'" + val;
    }
  }
  return val;
}
