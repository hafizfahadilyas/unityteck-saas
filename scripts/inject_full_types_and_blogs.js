import fs from 'fs';

const bak = fs.readFileSync('src/data/blecoStoreData.ts.bak', 'utf8');
const cur = fs.readFileSync('src/data/blecoStoreData.ts', 'utf8');

// 1. Extract FloorMatColorOption & FLOOR_MAT_COLORS from bak
const floorMatColorsBlock = bak.match(/export interface FloorMatColorOption[\s\S]*?export const FLOOR_MAT_COLORS: FloorMatColorOption\[\] = \[[\s\S]*?\];/)[0];

// 2. Extract blog interfaces & BLECO_BLOG_POSTS from bak
const blogInterfacesBlock = bak.match(/export interface BlecoBlogAuthor[\s\S]*?export interface BlecoBlogPost[\s\S]*?\n\}/)[0];
const blogPostsBlock = bak.match(/export const BLECO_BLOG_POSTS: BlecoBlogPost\[\] = \[[\s\S]*?\];\s*\/\//)[0].replace(/;\s*\/\/$/, ';');

// Now in cur, let's inject FloorMatColorOption and FLOOR_MAT_COLORS right after SEAT_COLORS
let updated = cur;

// Insert FloorMatColorOption and FLOOR_MAT_COLORS
updated = updated.replace('export interface BlecoFaqItem {', `${floorMatColorsBlock}\n\n${blogInterfacesBlock}\n\nexport interface BlecoFaqItem {`);

// Replace BLECO_BLOG_POSTS in cur with blogPostsBlock from bak
updated = updated.replace(/export const BLECO_BLOG_POSTS: BlecoBlogPost\[\] = \[[\s\S]*?\];\s*\/\//, `${blogPostsBlock}\n\n//`);

fs.writeFileSync('src/data/blecoStoreData.ts', updated, 'utf8');
console.log('Successfully updated src/data/blecoStoreData.ts with all types, floor mat colors and blog posts!');
