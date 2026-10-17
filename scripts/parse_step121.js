import fs from 'fs';

const path = 'C:/Users/fahad/.gemini/antigravity/brain/7f186f52-e583-45d4-a653-6515ea018cb5/.system_generated/steps/121/content.md';
if (fs.existsSync(path)) {
  const content = fs.readFileSync(path, 'utf8');
  console.log('File size:', content.length);
  
  // Look for product names, images, links
  const links = content.match(/https:\/\/tanjeedmakkah\.com\/[^\s"'<>]+/g) || [];
  console.log('Links:', [...new Set(links)]);

  const imgs = content.match(/https:\/\/cdn\.salla\.sa\/[^\s"'<>]+/g) || [];
  console.log('Images:', [...new Set(imgs)]);
  
  // Print some lines containing arabic text
  const lines = content.split('\n').filter(l => /[\u0600-\u06FF]/.test(l));
  console.log('Arabic lines count:', lines.length);
  lines.slice(0, 30).forEach(l => console.log('Line:', l.trim().substring(0, 150)));
}
