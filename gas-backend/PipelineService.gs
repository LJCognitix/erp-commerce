/**
 * @file PipelineService.gs
 * Handles business logic and CRUD for Pipeline (Opportunities)
 */

const PipelineService = {
  helper: () => new SheetHelper(CONFIG.SHEETS.PIPELINE),

  /**
   * Retrieves all pipeline opportunities
   * @param {Object} filters 
   * @param {number} page 
   * @param {number} limit 
   * @returns {Object}
   */
  getAll: (filters = {}, page = 1, limit = CONFIG.DEFAULT_PAGE_SIZE) => {
    return PipelineService.helper().getAll(filters, page, limit);
  },

  /**
   * Retrieves a single opportunity by ID
   * @param {string} id 
   * @returns {Object}
   */
  getById: (id) => {
    const opp = PipelineService.helper().getById(id);
    if (!opp) throw new Error('Opportunity not found');
    return opp;
  },

  /**
   * Creates a new opportunity
   * @param {Object} data 
   * @returns {Object}
   */
  create: (data) => {
    if (!data.title) throw new Error('title is required');
    if (!data.stage) data.stage = 'lead';
    return PipelineService.helper().create(data);
  },

  /**
   * Updates an opportunity
   * @param {string} id 
   * @param {Object} data 
   * @returns {Object}
   */
  update: (id, data) => {
    return PipelineService.helper().update(id, data);
  },

  /**
   * Updates the stage of an opportunity
   * @param {string} id 
   * @param {string} stage 
   * @returns {Object}
   */
  updateStage: (id, stage) => {
    if (!stage) throw new Error('stage is required');
    return PipelineService.helper().update(id, { stage });
  },

  /**
   * Soft deletes an opportunity
   * @param {string} id 
   * @returns {Object}
   */
  delete: (id) => {
    return PipelineService.helper().softDelete(id);
  }
};
