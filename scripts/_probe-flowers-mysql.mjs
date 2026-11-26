/** Probe flowers MySQL with local .env password (never prints secret). */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const hosts = [
  process.env.FLOWERS_DB_REMOTE_HOST || 'srv1422.hstgr.io',
  process.env.FLOWERS_DB_HOST,
].filter(Boolean);
const user = process.env.FLOWERS_DB_USERNAME || 'u920689430_giftshop';
const database = process.env.FLOWERS_DB_DATABASE || 'u920689430_giftshop';
const password = process.env.FLOWERS_DB_PASSWORD || process.env.FTP_FLOWERS_DB_PASSWORD || '';

console.log('user', user);
console.log('database', database);
console.log('password_set', Boolean(password));

for (const host of hosts) {
  try {
    const c = await mysql.createConnection({
      host,
      user,
      password,
      database,
      port: 3306,
      connectTimeout: 12000,
      ssl: { rejectUnauthorized: false },
    });
    const [r] = await c.query('SELECT COUNT(*) AS c FROM stores');
    console.log('OK', host, 'stores', r[0]?.c);
    await c.end();
  } catch (e) {
    console.log('FAIL', host, e.code || e.message);
  }
}
