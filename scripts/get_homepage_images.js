import fs from 'fs';

const path = 'C:/Users/fahad/.gemini/antigravity/brain/7f186f52-e583-45d4-a653-6515ea018cb5/.system_generated/steps/83/content.md';
const content = fs.readFileSync(path, 'utf8');

// find all images
const allImgs = [...new Set(content.match(/https:\/\/cdn\.salla\.sa\/[^\s"'<>]+/g) || [])];
console.log('Total Salla images on homepage:', allImgs.length);
allImgs.forEach((img, i) => console.log(`${i+1}: ${img}`));
