import fs from 'fs';
import path from 'path';

const brainDir = 'C:/Users/fahad/.gemini/antigravity/brain/';
if (fs.existsSync(brainDir)) {
  const dirs = fs.readdirSync(brainDir);
  console.log('Brain directories:', dirs);
  for (const d of dirs) {
    const stepsDir = path.join(brainDir, d, '.system_generated/steps');
    if (fs.existsSync(stepsDir)) {
      const steps = fs.readdirSync(stepsDir);
      console.log(`Conv ${d} has ${steps.length} steps`);
    }
  }
}
