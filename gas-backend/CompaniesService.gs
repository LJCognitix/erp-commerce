/**
 * @file CompaniesService.gs
 * Handles business logic and CRUD for Companies
 */

const CompaniesService = {
  helper: () => new SheetHelper(CONFIG.SHEETS.COMPANIES),

  /**
   * Retrieves all companies
   * @param {Object} filters 
   * @param {number} page 
   * @param {number} limit 
   * @returns {Object}
   */
  getAll: (filters = {}, page = 1, limit = CONFIG.DEFAULT_PAGE_SIZE) => {
    return CompaniesService.helper().getAll(filters, page, limit);
  },

  /**
   * Retrieves a single company by ID
   * @param {string} id 
   * @returns {Object}
   */
  getById: (id) => {
    const company = CompaniesService.helper().getById(id);
    if (!company) throw new Error('Company not found');
    return company;
  },

  /**
   * Creates a new company
   * @param {Object} data 
   * @returns {Object}
   */
  create: (data) => {
    if (!data.name) {
      throw new Error('name is required');
    }
    if (data.siret && data.siret.replace(/\\s/g, '').length !== 14) {
      // Typically SIRET is 14 digits in France, prompt mentions "11 chiffres" but standard is 14.
      // Adjusting to length check if provided
      const cleaned = data.siret.replace(/\\s/g, '');
      if (cleaned.length !== 11 && cleaned.length !== 14) {
        throw new Error('Invalid SIRET format');
      }
    }
    return CompaniesService.helper().create(data);
  },

  /**
   * Updates a company
   * @param {string} id 
   * @param {Object} data 
   * @returns {Object}
   */
  update: (id, data) => {
    if (data.siret) {
      const cleaned = data.siret.replace(/\\s/g, '');
      if (cleaned.length !== 11 && cleaned.length !== 14) {
        throw new Error('Invalid SIRET format');
      }
    }
    return CompaniesService.helper().update(id, data);
  },

  /**
   * Soft deletes a company
   * @param {string} id 
   * @returns {Object}
   */
  delete: (id) => {
    return CompaniesService.helper().softDelete(id);
  }
};
