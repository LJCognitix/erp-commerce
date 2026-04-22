/**
 * Returns a standardized JSON response for success
 * @param {Object|Array} data - The payload
 * @param {Object} [meta={}] - Additional metadata
 * @returns {Object} Formatted success object
 */
function success(data, meta = {}) {
  return {
    success: true,
    data: data,
    meta: meta,
    timestamp: new Date().toISOString()
  };
}

/**
 * Returns a standardized JSON response for an error
 * @param {string} message - Error message
 * @param {number} [code=400] - HTTP style error code
 * @param {Object} [details=null] - Additional error details
 * @returns {Object} Formatted error object
 */
function error(message, code = 400, details = null) {
  return {
    success: false,
    error: {
      message: message,
      code: code,
      details: details
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Returns a paginated JSON response
 * @param {Array} data - Array of items for the current page
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} Formatted paginated response object
 */
function paginate(data, page, limit, total) {
  return {
    success: true,
    data: data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      pages: Math.ceil(total / limit)
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates the ContentService response with proper MIME type and CORS headers
 * @param {Object} payload - The object to be returned as JSON
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function jsonOutput(payload) {
  const output = ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
    
  // Note: Apps Script does not fully support modifying headers of the HTTP response 
  // in the traditional sense via ContentService. However, when deployed as a Web App,
  // Google handles standard CORS. The requested CORS headers can't be set directly here
  // but standard Web App behavior allows cross-origin when "Execute as ME" and "Anyone" are used.
  // We'll simulate it or format it cleanly. If deployed as web app correctly, fetch() works.
  
  return output;
}
