import fs from 'fs';
import path from 'path';

const stepsDir = 'C:/Users/fahad/.gemini/antigravity/brain/7f186f52-e583-45d4-a653-6515ea018cb5/.system_generated/steps';
const checkSteps = [83, 87, 121, 175, 181, 362, 398, 404];

for (const s of checkSteps) {
  const p = path.join(stepsDir, String(s), 'content.md');
  if (fs.existsSync(p)) {
    const c = fs.readFileSync(p, 'utf8');
    console.log(`\n--- Step ${s} (length ${c.length}) ---`);
    console.log(c.substring(0, 300));
  }
}
