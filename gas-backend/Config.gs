const CONFIG = {
  SPREADSHEET_ID: PropertiesService
    .getScriptProperties()
    .getProperty('SPREADSHEET_ID'),
  API_KEY: PropertiesService
    .getScriptProperties()
    .getProperty('API_KEY'),
  APP_NAME: 'LJ Cognitix ERP',
  VERSION: '1.0.0',
  MAX_ROWS: 10000,
  DEFAULT_PAGE_SIZE: 50,
  CORS_ORIGIN: '*',
  SHEETS: {
    CONTACTS  : 'contacts',
    COMPANIES : 'companies',
    PIPELINE  : 'pipeline',
    QUOTES    : 'quotes',
    INVOICES  : 'invoices',
    RELANCES  : 'relances',
    SETTINGS  : 'settings',
    LOGS      : 'logs',
  }
};
