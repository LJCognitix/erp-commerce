/**
 * Verifies the API key from the request event
 * @param {Object} e - The event object from doGet or doPost
 * @returns {Object} { valid: boolean, reason?: string }
 */
function verifyApiKey(e) {
  try {
    // Check if e or e.parameter exists
    if (!e) {
      return { valid: false, reason: 'Missing request event' };
    }

    // Attempt to retrieve the API key from parameters (GET) or headers (POST if custom headers are passed in some specific way, though GAS Web Apps typically don't expose custom headers directly in standard doGet/doPost unless passed via query param or payload).
    // Often, clients must pass ?api_key=xxx or include it in the POST body/params
    
    let providedKey = null;
    
    if (e.parameter && e.parameter.api_key) {
      providedKey = e.parameter.api_key;
    } else if (e.parameter && e.parameter['x-api-key']) {
      providedKey = e.parameter['x-api-key'];
    } else if (e.postData && e.postData.contents) {
      try {
        const body = JSON.parse(e.postData.contents);
        if (body.api_key) providedKey = body.api_key;
      } catch (err) {
        // Body is not JSON or parsing failed
      }
    }

    if (!providedKey) {
      logError('Missing API Key', e);
      return { valid: false, reason: 'Missing API key' };
    }

    if (providedKey !== CONFIG.API_KEY) {
      logError('Invalid API Key', e);
      return { valid: false, reason: 'Invalid API key' };
    }

    return { valid: true };
  } catch (err) {
    logError('Error verifying API Key: ' + err.message, e);
    return { valid: false, reason: 'Internal server error during auth' };
  }
}

/**
 * Logs authentication errors
 */
function logError(message, e) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.SHEETS.LOGS);
    if (sheet) {
      sheet.appendRow([
        new Date().toISOString(),
        e && e.postData ? 'POST' : 'GET',
        'auth',
        401,
        0,
        0,
        message
      ]);
    }
  } catch (err) {
    console.error('Failed to log auth error', err);
  }
}
