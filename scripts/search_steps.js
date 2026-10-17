import fs from 'fs';
import path from 'path';

const stepsDir = 'C:/Users/fahad/.gemini/antigravity/brain/7f186f52-e583-45d4-a653-6515ea018cb5/.system_generated/steps';
if (fs.existsSync(stepsDir)) {
  const steps = fs.readdirSync(stepsDir);
  console.log('Total steps in 7f186f52-e583-45d4-a653-6515ea018cb5:', steps.length);
  
  // Search for any step containing product info or ld+json
  let found = 0;
  for (const s of steps) {
    const f = path.join(stepsDir, s, 'content.md');
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf8');
      if (content.includes('schema.org') && content.includes('Product')) {
        found++;
        console.log(`Step ${s} has Product schema!`);
      }
    }
  }
  console.log('Total steps with Product schema:', found);
}
