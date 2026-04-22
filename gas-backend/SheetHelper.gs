class SheetHelper {
  /**
   * Initializes the helper for a specific sheet
   * @param {string} sheetName 
   */
  constructor(sheetName) {
    if (!CONFIG.SPREADSHEET_ID) {
      throw new Error('SPREADSHEET_ID is not defined in CONFIG');
    }
    this.spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    this.sheet = this.spreadsheet.getSheetByName(sheetName);
    
    if (!this.sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }
    this.sheetName = sheetName;
  }

  /**
   * Gets the headers of the sheet (row 1)
   * @returns {string[]} Array of headers
   */
  getHeaders() {
    const lastCol = this.sheet.getLastColumn();
    if (lastCol === 0) return [];
    return this.sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }

  /**
   * Retrieves all records, skipping deleted ones, with optional filtering and pagination
   * @param {Object} filters - Key-value pairs to filter by (or 'search' for full text)
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {Object} { data: Array, total: number }
   */
  getAll(filters = {}, page = 1, limit = CONFIG.DEFAULT_PAGE_SIZE) {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) return { data: [], total: 0 };

    const headers = this.getHeaders();
    const rawData = this.sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    
    let results = [];

    for (let i = 0; i < rawData.length; i++) {
      const obj = this.rowToObject(headers, rawData[i]);
      
      // Skip soft-deleted
      if (obj.is_deleted === true || obj.is_deleted === 'true' || obj.is_deleted === 1) {
        continue;
      }
      
      let match = true;

      // Apply filters
      for (const [key, val] of Object.entries(filters)) {
        if (!val || val === '') continue;

        if (key === 'search') {
          // Full-text search across all string fields
          const searchVal = String(val).toLowerCase();
          const objValues = Object.values(obj).map(v => String(v).toLowerCase());
          if (!objValues.some(v => v.includes(searchVal))) {
            match = false;
            break;
          }
        } else if (obj[key] !== undefined) {
          if (String(obj[key]).toLowerCase() !== String(val).toLowerCase()) {
            match = false;
            break;
          }
        }
      }

      if (match) {
        results.push(obj);
      }
    }

    // Pagination
    const total = results.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = results.slice(startIndex, startIndex + parseInt(limit, 10));

    return { data: paginatedData, total };
  }

  /**
   * Gets a specific record by ID
   * @param {string} id 
   * @returns {Object|null}
   */
  getById(id) {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) return null;

    const headers = this.getHeaders();
    const idIndex = headers.indexOf('id');
    
    if (idIndex === -1) return null;

    const rawData = this.sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    
    for (let i = 0; i < rawData.length; i++) {
      if (rawData[i][idIndex] === id) {
        const obj = this.rowToObject(headers, rawData[i]);
        if (obj.is_deleted !== true && obj.is_deleted !== 'true' && obj.is_deleted !== 1) {
          return obj;
        }
      }
    }
    return null;
  }

  /**
   * Creates a new record
   * @param {Object} data 
   * @returns {Object} The created object
   */
  create(data) {
    const headers = this.getHeaders();
    
    const newRecord = { ...data };
    newRecord.id = newRecord.id || generateId();
    newRecord.created_at = now();
    newRecord.updated_at = newRecord.created_at;
    newRecord.is_deleted = false;

    const rowData = this.objectToRow(headers, newRecord);
    this.sheet.appendRow(rowData);
    
    return newRecord;
  }

  /**
   * Updates an existing record
   * @param {string} id 
   * @param {Object} data 
   * @returns {Object} The updated object
   */
  update(id, data) {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) throw new Error(`Record with id ${id} not found`);

    const headers = this.getHeaders();
    const idIndex = headers.indexOf('id');
    
    const rawData = this.sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    
    let rowIndex = -1;
    let existingObj = null;

    for (let i = 0; i < rawData.length; i++) {
      if (rawData[i][idIndex] === id) {
        rowIndex = i + 2; // +2 because range starts at row 2, and i is 0-indexed
        existingObj = this.rowToObject(headers, rawData[i]);
        break;
      }
    }

    if (rowIndex === -1 || existingObj.is_deleted === true || existingObj.is_deleted === 'true') {
      throw new Error(`Record with id ${id} not found or deleted`);
    }

    // Merge data
    const updatedObj = { ...existingObj, ...data };
    updatedObj.id = id; // prevent id modification
    updatedObj.updated_at = now(); // force update time

    const rowData = this.objectToRow(headers, updatedObj);
    this.sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);

    return updatedObj;
  }

  /**
   * Soft deletes a record by setting is_deleted to true
   * @param {string} id 
   * @returns {Object} status
   */
  softDelete(id) {
    try {
      this.update(id, { is_deleted: true });
      return { deleted: true, id };
    } catch (e) {
      throw new Error(`Cannot delete: ${e.message}`);
    }
  }

  /**
   * Converts a sheet row array to a JS Object based on headers
   * @param {string[]} headers 
   * @param {any[]} row 
   * @returns {Object}
   */
  rowToObject(headers, row) {
    let obj = {};
    headers.forEach((header, index) => {
      let val = row[index];
      
      // Handle boolean
      if (val === 'TRUE' || val === 'true') val = true;
      if (val === 'FALSE' || val === 'false') val = false;
      
      // Parse JSON fields
      if (header.endsWith('_json') && typeof val === 'string') {
        val = parseJSON(val);
      }
      
      obj[header] = val;
    });
    return obj;
  }

  /**
   * Converts a JS Object to a sheet row array based on headers
   * @param {string[]} headers 
   * @param {Object} obj 
   * @returns {any[]}
   */
  objectToRow(headers, obj) {
    return headers.map(header => {
      let val = obj[header];
      
      if (val === undefined || val === null) {
        return '';
      }
      
      if (header.endsWith('_json') && typeof val === 'object') {
        return JSON.stringify(val);
      }
      
      // Sanitize inputs to prevent formula injection
      return sanitize(val);
    });
  }
}
