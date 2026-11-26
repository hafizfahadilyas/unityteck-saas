/**
 * Fix store-souq-default active theme → theme-souq-common-retail (central MySQL).
 * Usage: node scripts/_fix-souq-default-theme.mjs
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const STORE_ID = 'store-souq-default';
const THEME_ID = 'theme-souq-common-retail';

const c = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT || 3306),
  ssl: { rejectUnauthorized: false },
});

const [themeCols] = await c.query('SHOW COLUMNS FROM store_settings');
const settingColNames = themeCols.map((r) => r.Field);
console.log('store_settings cols', settingColNames.join(','));

const [themesBefore] = await c.query(
  'SELECT id, theme_id FROM store_themes WHERE store_id = ? LIMIT 5',
  [STORE_ID],
);
console.log('store_themes before', themesBefore);

const [settingsBefore] = await c.query(
  'SELECT * FROM store_settings WHERE store_id = ? LIMIT 1',
  [STORE_ID],
);
console.log('store_settings before count', settingsBefore.length);
if (settingsBefore[0]) {
  const row = settingsBefore[0];
  let settings = row.settings;
  if (typeof settings === 'string') {
    try {
      settings = JSON.parse(settings);
    } catch {
      settings = {};
    }
  }
  console.log('settings.active_theme_id', settings?.active_theme_id);
  if ('active_theme_id' in row) console.log('column active_theme_id', row.active_theme_id);
}

// 1) store_themes.theme_id
const [updTheme] = await c.query(
  'UPDATE store_themes SET theme_id = ? WHERE store_id = ?',
  [THEME_ID, STORE_ID],
);
console.log('updated store_themes', updTheme.affectedRows);

// 2) store_settings JSON + optional column
if (settingsBefore[0]) {
  const row = settingsBefore[0];
  let settings = row.settings;
  if (typeof settings === 'string') {
    try {
      settings = JSON.parse(settings);
    } catch {
      settings = {};
    }
  }
  if (!settings || typeof settings !== 'object') settings = {};
  settings.active_theme_id = THEME_ID;
  settings.theme_id = THEME_ID;

  if (settingColNames.includes('active_theme_id')) {
    await c.query(
      'UPDATE store_settings SET settings = ?, active_theme_id = ? WHERE store_id = ?',
      [JSON.stringify(settings), THEME_ID, STORE_ID],
    );
  } else {
    await c.query('UPDATE store_settings SET settings = ? WHERE store_id = ?', [
      JSON.stringify(settings),
      STORE_ID,
    ]);
  }
  console.log('updated store_settings');
} else {
  // create minimal settings row if missing
  const id = `sset-${STORE_ID}`.slice(0, 64);
  const settings = { active_theme_id: THEME_ID, theme_id: THEME_ID };
  if (settingColNames.includes('active_theme_id')) {
    await c.query(
      'INSERT INTO store_settings (id, store_id, settings, active_theme_id) VALUES (?, ?, ?, ?)',
      [id, STORE_ID, JSON.stringify(settings), THEME_ID],
    );
  } else {
    await c.query('INSERT INTO store_settings (id, store_id, settings) VALUES (?, ?, ?)', [
      id,
      STORE_ID,
      JSON.stringify(settings),
    ]);
  }
  console.log('inserted store_settings');
}

// Verify
const [themesAfter] = await c.query(
  'SELECT id, theme_id FROM store_themes WHERE store_id = ? LIMIT 5',
  [STORE_ID],
);
console.log('store_themes after', themesAfter);

await c.end();
console.log('OK', THEME_ID);
