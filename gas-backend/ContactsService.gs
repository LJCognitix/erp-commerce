/**
 * @file ContactsService.gs
 * Handles business logic and CRUD for Contacts
 */

const ContactsService = {
  helper: () => new SheetHelper(CONFIG.SHEETS.CONTACTS),
  
  /**
   * Retrieves all contacts, joining company name
   * @param {Object} filters 
   * @param {number} page 
   * @param {number} limit 
   * @returns {Object} { data: [], total: number }
   */
  getAll: (filters = {}, page = 1, limit = CONFIG.DEFAULT_PAGE_SIZE) => {
    const helper = ContactsService.helper();
    const result = helper.getAll(filters, page, limit);
    
    // Join company_name
    const compHelper = new SheetHelper(CONFIG.SHEETS.COMPANIES);
    const companies = compHelper.getAll({}, 1, 10000).data;
    const compMap = {};
    companies.forEach(c => compMap[c.id] = c.name);
    
    result.data = result.data.map(contact => {
      contact.company_name = compMap[contact.company_id] || null;
      return contact;
    });
    
    return result;
  },

  /**
   * Retrieves a single contact by ID, with company name and recent invoices
   * @param {string} id 
   * @returns {Object}
   */
  getById: (id) => {
    const helper = ContactsService.helper();
    const contact = helper.getById(id);
    
    if (!contact) throw new Error('Contact not found');
    
    // Join company name
    if (contact.company_id) {
      const compHelper = new SheetHelper(CONFIG.SHEETS.COMPANIES);
      const company = compHelper.getById(contact.company_id);
      contact.company_name = company ? company.name : null;
    }
    
    // Get recent invoices
    const invHelper = new SheetHelper(CONFIG.SHEETS.INVOICES);
    const invoicesData = invHelper.getAll({ contact_id: id }, 1, 10).data; // max 10
    contact.recent_invoices = invoicesData;
    
    return contact;
  },

  /**
   * Creates a new contact
   * @param {Object} data 
   * @returns {Object}
   */
  create: (data) => {
    // Validation
    if (!data.first_name || !data.last_name) {
      throw new Error('first_name and last_name are required');
    }
    if (data.email) {
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Invalid email format');
      }
      
      // Check for duplicates
      const helper = ContactsService.helper();
      const existing = helper.getAll({ email: data.email }, 1, 1).data;
      if (existing.length > 0) {
        throw new Error('Email already exists');
      }
    }
    
    return ContactsService.helper().create(data);
  },

  /**
   * Updates a contact
   * @param {string} id 
   * @param {Object} data 
   * @returns {Object}
   */
  update: (id, data) => {
    if (data.email) {
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailRegex.test(data.email)) throw new Error('Invalid email format');
      
      const helper = ContactsService.helper();
      const existing = helper.getAll({ email: data.email }, 1, 10).data;
      const dup = existing.find(c => c.id !== id);
      if (dup) throw new Error('Email already exists');
    }
    return ContactsService.helper().update(id, data);
  },

  /**
   * Soft deletes a contact
   * @param {string} id 
   * @returns {Object}
   */
  delete: (id) => {
    return ContactsService.helper().softDelete(id);
  },
  
  /**
   * Imports multiple contacts
   * @param {Array} dataList 
   * @returns {Object}
   */
  import: (dataList) => {
    if (!Array.isArray(dataList)) throw new Error('Data must be an array');
    const created = [];
    const errors = [];
    
    dataList.forEach((item, index) => {
      try {
        created.push(ContactsService.create(item));
      } catch (err) {
        errors.push({ index, error: err.message, item });
      }
    });
    
    return { imported: created.length, failed: errors.length, errors };
  }
};
