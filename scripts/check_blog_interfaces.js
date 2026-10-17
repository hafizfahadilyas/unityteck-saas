import fs from 'fs';

const bak = fs.readFileSync('src/data/blecoStoreData.ts.bak', 'utf8');
const authorMatch = bak.match(/export interface BlecoBlogAuthor[\s\S]*?\}/);
if (authorMatch) console.log(authorMatch[0]);

const secMatch = bak.match(/export interface BlecoBlogSection[\s\S]*?\}/);
if (secMatch) console.log(secMatch[0]);

const blogPostMatch = bak.match(/export interface BlecoBlogPost[\s\S]*?\}/);
if (blogPostMatch) console.log(blogPostMatch[0]);
