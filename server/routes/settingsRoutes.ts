import { Router, Request, Response } from 'express';
import { pgPool } from '../app';

export const settingsRouter = Router();

// In-memory fallback if DATABASE_URL is not yet connected
const inMemorySettingsStore: Record<string, any> = {
  google_sheets_config: {
    activeSpreadsheetId: '',
    spreadsheetName: '',
    spreadsheetUrl: '',
    autoSyncEnabled: true,
    syncMethod: 'oauth',
    lastSyncTime: null,
    googleClientId: ''
  }
};

// 1. GET /api/settings/:key
settingsRouter.get('/:key', async (req: Request, res: Response) => {
  const { key } = req.params;

  if (!pgPool) {
    return res.status(200).json({
      success: true,
      key,
      value: inMemorySettingsStore[key] || null,
      source: 'in_memory'
    });
  }

  try {
    const result = await pgPool.query(
      'SELECT key, value, updated_at, updated_by FROM system_settings WHERE key = $1',
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        key,
        value: inMemorySettingsStore[key] || null,
        source: 'default'
      });
    }

    return res.status(200).json({
      success: true,
      key,
      value: result.rows[0].value,
      updatedAt: result.rows[0].updated_at,
      updatedBy: result.rows[0].updated_by,
      source: 'postgresql'
    });
  } catch (err: any) {
    console.warn(`[Settings] DB query fallback for key ${key}:`, err.message);
    return res.status(200).json({
      success: true,
      key,
      value: inMemorySettingsStore[key] || null,
      source: 'in_memory_fallback'
    });
  }
});

// 2. POST /api/settings/:key
settingsRouter.post('/:key', async (req: Request, res: Response) => {
  const { key } = req.params;
  const { value, updatedBy = 'ADMIN' } = req.body;

  if (!value) {
    return res.status(400).json({ success: false, message: 'Nilai konfigurasi (value) wajib disertakan.' });
  }

  inMemorySettingsStore[key] = value;

  if (!pgPool) {
    return res.status(200).json({
      success: true,
      key,
      value,
      source: 'in_memory'
    });
  }

  try {
    // Ensure table exists
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(50) DEFAULT 'ADMIN'
      );
    `);

    const result = await pgPool.query(
      `INSERT INTO system_settings (key, value, updated_at, updated_by)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP, updated_by = EXCLUDED.updated_by
       RETURNING key, value, updated_at, updated_by`,
      [key, JSON.stringify(value), updatedBy]
    );

    return res.status(200).json({
      success: true,
      key: result.rows[0].key,
      value: result.rows[0].value,
      updatedAt: result.rows[0].updated_at,
      updatedBy: result.rows[0].updated_by,
      source: 'postgresql'
    });
  } catch (err: any) {
    console.error(`[Settings] Failed to save setting ${key} to PostgreSQL:`, err);
    return res.status(200).json({
      success: true,
      key,
      value,
      source: 'in_memory_fallback',
      warning: `Disimpan di memori runtime (Gagal simpan ke DB: ${err.message})`
    });
  }
});
