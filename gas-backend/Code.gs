/**
 * ══════════════════════════════════════
 * LJ COGNITIX ERP — BACKEND SETUP GUIDE
 * ══════════════════════════════════════
 * 
 * ÉTAPE 1 — Script Properties
 * Projet → Paramètres → Variables de script
 * Ajouter :
 *   SPREADSHEET_ID  = [ID de votre Google Sheet]
 *   API_KEY         = [Clé aléatoire forte - garder secrète]
 *
 * ÉTAPE 2 — Initialiser la base
 * Exécuter manuellement : SetupService.initDatabase()
 * (Facultatif) Exécuter : SetupService.seedMockData()
 *
 * ÉTAPE 3 — Déployer WebApp
 * Déployer → Nouveau déploiement → WebApp
 * Execute as  : Me
 * Who access  : Anyone
 * → Copier l'URL de déploiement
 *
 * ÉTAPE 4 — Configurer le Frontend
 * Dans .env de votre app Vercel :
 * VITE_API_URL = [URL copiée étape 3]
 *
 * ÉTAPE 5 — Test sanity check
 * GET [URL]/exec?resource=health
 * → Doit retourner { status: "ok" }
 *
 * ENDPOINTS TESTS :
 * GET ?resource=contacts&action=getAll&api_key=YOUR_KEY
 * GET ?resource=dashboard&action=getKPIs&api_key=YOUR_KEY
 */

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  const start = Date.now();
  let responseData;
  let resource = 'unknown';
  let endpointPath = 'GET';
  
  try {
    // 1. CORS Preflight / Basic checks
    if (!e || !e.parameter) {
      return jsonOutput(error('Invalid request format', 400));
    }

    resource = e.parameter.resource || 'health';
    const action = e.parameter.action;
    
    // 2. Health Check (unprotected)
    if (resource === 'health') {
      return jsonOutput(success({ status: "ok", version: CONFIG.VERSION, timestamp: now() }));
    }

    // 3. Auth
    const auth = verifyApiKey(e);
    if (!auth.valid) {
      return jsonOutput(error(auth.reason, 401));
    }

    endpointPath = `GET /${resource}/${action}`;

    // 4. Routing
    const params = { ...e.parameter };
    // Extract common pagination
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || CONFIG.DEFAULT_PAGE_SIZE;
    
    // Clean up internal params so they aren't used as filters unless intended
    delete params.resource;
    delete params.action;
    delete params.page;
    delete params.limit;
    delete params.api_key;

    responseData = routeRequest(resource, action, params, null, null, page, limit);
    
    // 5. Log
    logRequest('GET', endpointPath, 200, 0, Date.now() - start);

    // 6. Return
    return jsonOutput(responseData);
    
  } catch (err) {
    logRequest('GET', endpointPath, 500, 0, Date.now() - start, err.message);
    return jsonOutput(error(err.message, 500));
  }
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  const start = Date.now();
  let responseData;
  let resource = 'unknown';
  let endpointPath = 'POST';

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOutput(error('Missing POST body', 400));
    }

    const payloadSize = e.postData.contents.length;
    const body = JSON.parse(e.postData.contents);
    
    resource = body.resource;
    const action = body.action;
    const data = body.data;
    const id = body.id;

    endpointPath = `POST /${resource}/${action}`;

    // Auth (allow setup unprotected ONLY if using specific admin key check inside SetupService, but we'll enforce global here)
    const auth = verifyApiKey(e);
    if (!auth.valid) {
      // Small exception for setup if requested: typically requires auth
      return jsonOutput(error(auth.reason, 401));
    }

    responseData = routeRequest(resource, action, null, data, id);
    
    logRequest('POST', endpointPath, 200, payloadSize, Date.now() - start);

    return jsonOutput(responseData);

  } catch (err) {
    logRequest('POST', endpointPath, 500, e && e.postData ? e.postData.contents.length : 0, Date.now() - start, err.message);
    return jsonOutput(error(err.message, 500));
  }
}

/**
 * Handles OPTIONS for CORS preflight
 */
function doOptions(e) {
  return jsonOutput(success('CORS ok'));
}

/**
 * Router logic
 */
function routeRequest(resource, action, params, data, id, page = 1, limit = CONFIG.DEFAULT_PAGE_SIZE) {
  switch (resource) {
    // ----------------------------------------------------
    // CONTACTS
    // ----------------------------------------------------
    case 'contacts':
      if (action === 'getAll') return success(ContactsService.getAll(params, page, limit));
      if (action === 'getById') return success(ContactsService.getById(params.id || id));
      if (action === 'create') return success(ContactsService.create(data));
      if (action === 'update') return success(ContactsService.update(id, data));
      if (action === 'delete') return success(ContactsService.delete(id));
      if (action === 'import') return success(ContactsService.import(data));
      break;

    // ----------------------------------------------------
    // COMPANIES
    // ----------------------------------------------------
    case 'companies':
      if (action === 'getAll') return success(CompaniesService.getAll(params, page, limit));
      if (action === 'getById') return success(CompaniesService.getById(params.id || id));
      if (action === 'create') return success(CompaniesService.create(data));
      if (action === 'update') return success(CompaniesService.update(id, data));
      if (action === 'delete') return success(CompaniesService.delete(id));
      break;

    // ----------------------------------------------------
    // PIPELINE
    // ----------------------------------------------------
    case 'pipeline':
      if (action === 'getAll') return success(PipelineService.getAll(params, page, limit));
      if (action === 'getById') return success(PipelineService.getById(params.id || id));
      if (action === 'create') return success(PipelineService.create(data));
      if (action === 'update') return success(PipelineService.update(id, data));
      if (action === 'updateStage') return success(PipelineService.updateStage(id, data.stage));
      if (action === 'delete') return success(PipelineService.delete(id));
      break;

    // ----------------------------------------------------
    // QUOTES
    // ----------------------------------------------------
    case 'quotes':
      if (action === 'getAll') return success(QuotesService.getAll(params, page, limit));
      if (action === 'getById') return success(QuotesService.getById(params.id || id));
      if (action === 'getNextNumber') return success(QuotesService.getNextNumber());
      if (action === 'create') return success(QuotesService.create(data));
      if (action === 'update') return success(QuotesService.update(id, data));
      if (action === 'updateStatus') return success(QuotesService.updateStatus(id, data.status));
      if (action === 'convertToInvoice') return success(QuotesService.convertToInvoice(id));
      if (action === 'duplicate') return success(QuotesService.duplicate(id));
      if (action === 'delete') return success(QuotesService.delete(id));
      break;

    // ----------------------------------------------------
    // INVOICES
    // ----------------------------------------------------
    case 'invoices':
      if (action === 'getAll') return success(InvoicesService.getAll(params, page, limit));
      if (action === 'getById') return success(InvoicesService.getById(params.id || id));
      if (action === 'getNextNumber') return success(InvoicesService.getNextNumber());
      if (action === 'getOverdue') return success(InvoicesService.getOverdue());
      if (action === 'create') return success(InvoicesService.create(data));
      if (action === 'update') return success(InvoicesService.update(id, data));
      if (action === 'updateStatus') return success(InvoicesService.updateStatus(id, data.status));
      if (action === 'addPayment') return success(InvoicesService.addPayment(id, data)); // data = { amount, date }
      if (action === 'delete') return success(InvoicesService.delete(id));
      break;

    // ----------------------------------------------------
    // RELANCES
    // ----------------------------------------------------
    case 'relances':
      if (action === 'getAll') return success(RelancesService.getAll(params, page, limit));
      if (action === 'getById') return success(RelancesService.getById(params.id || id));
      if (action === 'getPending') return success(RelancesService.getPending());
      if (action === 'getByInvoice') return success(RelancesService.getByInvoice(params.id || id));
      if (action === 'create') return success(RelancesService.create(data));
      if (action === 'update') return success(RelancesService.update(id, data));
      if (action === 'markSent') return success(RelancesService.markSent(id));
      if (action === 'delete') return success(RelancesService.delete(id));
      break;

    // ----------------------------------------------------
    // DASHBOARD
    // ----------------------------------------------------
    case 'dashboard':
      if (action === 'getKPIs') return success(DashboardService.getKPIs());
      if (action === 'getRevenueChart') return success(DashboardService.getRevenueChart(params.year));
      if (action === 'getTopClients') return success(DashboardService.getKPIs().top_clients); // slightly redundant but works
      if (action === 'getActivityFeed') return success(DashboardService.getActivityFeed(params.limit || 20));
      break;

    // ----------------------------------------------------
    // SETTINGS
    // ----------------------------------------------------
    case 'settings':
      if (action === 'getAll') return success(SettingsService.getAll());
      if (action === 'getByKey') return success(SettingsService.getByKey(params.key));
      if (action === 'upsert') return success(SettingsService.upsert(data));
      break;

    // ----------------------------------------------------
    // SETUP
    // ----------------------------------------------------
    case 'setup':
      if (action === 'initDatabase') return success(SetupService.initDatabase());
      if (action === 'seedMockData') return success(SetupService.seedMockData());
      break;

    default:
      throw new Error(`Resource '${resource}' or action '${action}' not found`);
  }

  throw new Error(`Action '${action}' not found on resource '${resource}'`);
}

/**
 * Helper to log requests to the sheet
 */
function logRequest(method, endpoint, status, payloadSize, executionMs, errMsg = '') {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.SHEETS.LOGS);
    if (sheet) {
      sheet.appendRow([
        new Date().toISOString(),
        method,
        endpoint,
        status,
        payloadSize,
        executionMs,
        errMsg
      ]);
    }
  } catch (e) {
    console.error("Failed to write to logs sheet", e);
  }
}
