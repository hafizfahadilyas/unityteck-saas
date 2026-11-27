import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (fs.existsSync(dist)) {
  try {
    fs.rmSync(dist, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    console.log('Cleared dist/ (stale hashed chunks removed)');
  } catch {
    // If locked by Windows process, empty files inside instead
    try {
      for (const file of fs.readdirSync(dist)) {
        fs.rmSync(path.join(dist, file), { recursive: true, force: true, maxRetries: 3 });
      }
      console.log('Emptied dist/ contents');
    } catch (e) {
      console.warn('Notice: dist/ cleanup partially skipped, proceeding with build overwrite');
    }
  }
} else {
  console.log('dist/ already clean');
}
