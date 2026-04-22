/**
 * @file SettingsService.gs
 * Handles application settings stored in a simple key/value sheet
 */

const SettingsService = {
  helper: () => new SheetHelper(CONFIG.SHEETS.SETTINGS),

  getAll: () => {
    return SettingsService.helper().getAll({}, 1, 1000); // Pagination high to get all
  },

  getByKey: (key) => {
    if (!key) throw new Error('key is required');
    const records = SettingsService.getAll().data;
    const record = records.find(r => r.key === key);
    return record ? record.value : null;
  },

  upsert: (data) => {
    if (!data.key) throw new Error('key is required');
    if (data.value === undefined) throw new Error('value is required');

    const records = SettingsService.getAll().data;
    const existing = records.find(r => r.key === data.key);

    if (existing) {
      return SettingsService.helper().update(existing.id, {
        value: data.value,
        updated_at: now()
      });
    } else {
      return SettingsService.helper().create({
        key: data.key,
        value: data.value,
        updated_at: now()
      });
    }
  }
};
