import fs from 'fs';

const bak = fs.readFileSync('src/data/blecoStoreData.ts.bak', 'utf8');
const blogMatch = bak.match(/export const BLECO_BLOG_POSTS: BlecoBlogPost\[\] = (\[[\s\S]*?\]);\s*\/\//);
if (blogMatch) {
  console.log('Found BLECO_BLOG_POSTS in bak, length:', blogMatch[1].length);
  fs.writeFileSync('scripts/bak_blog_posts.json', blogMatch[1], 'utf8');
}
