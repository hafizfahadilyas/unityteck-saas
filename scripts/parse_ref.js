import fs from 'fs';

const path = 'C:/Users/fahad/.gemini/antigravity/brain/7f186f52-e583-45d4-a653-6515ea018cb5/.system_generated/steps/87/content.md';
if (fs.existsSync(path)) {
  const content = fs.readFileSync(path, 'utf8');
  const urls = content.match(/https:\/\/tanjeedmakkah\.com\/[^\s"'<>]+/g) || [];
  console.log('URLs found in category:', [...new Set(urls)]);
  
  // also look for product cards or names
  const titles = content.match(/title="[^"]+"/g) || [];
  console.log('Titles:', [...new Set(titles)].slice(0, 30));
  
  // look for img src
  const imgs = content.match(/https:\/\/cdn\.salla\.sa\/[^\s"'<>]+/g) || [];
  console.log('Images:', [...new Set(imgs)].slice(0, 20));
} else {
  console.log('File does not exist');
}
