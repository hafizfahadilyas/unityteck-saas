import fs from 'fs';

const top10 = JSON.parse(fs.readFileSync('scripts/formatted_top_10.json', 'utf8'));

// Format brands for each of top10
top10[0].brand = 'GMC';
top10[1].brand = 'Toyota';
top10[2].brand = 'Honda';
top10[3].brand = 'Ford';
top10[4].brand = 'Mazda';
top10[5].brand = 'GMC';
top10[6].brand = 'Toyota';
top10[7].brand = 'Kia';
top10[8].brand = 'Hyundai';
top10[9].brand = 'Lexus';

// Make sure top10 have rich gallery images
// For Product 1 (GMC Yukon 2021-2025), attach additional Yukon views
top10[0].galleryUrls = [
  'https://cdn.salla.sa/wYYVD/zYsjiTRpFRCgzbPdxlwaBsYZhpPR5oUFlr9EmDov.png',
  'https://cdn.salla.sa/wYYVD/eb50919f-da35-472e-820f-1319588bde31-750x1000-u2z52ESAtM9kL2R62p0rVycVUA7RhJQe4jwOsVtR.jpg',
  'https://cdn.salla.sa/wYYVD/sYPXud2ZQk3sQfd94yYRbfbEoX0R5G0c4fSzPjNH.jpg',
  'https://cdn.salla.sa/wYYVD/h6RnUf4ljn7vf9A1CzYkDhO4IJvfrwkhGaqWumfw.jpg'
];
top10[0].images = top10[0].galleryUrls;

// For Product 8 (Kia Cerato 2018-2023)
top10[7].galleryUrls = [
  'https://cdn.salla.sa/wYYVD/bc859832-a116-4c47-b6ad-a931a1a2ae52-886.52482269504x1000-re3CZ64qebIsjBVS2zEErigAfGS1pnOfOHL9cVNU.png',
  'https://cdn.salla.sa/wYYVD/re3CZ64qebIsjBVS2zEErigAfGS1pnOfOHL9cVNU.png',
  'https://cdn.salla.sa/wYYVD/cf3kyl1lN3NQzSgrex6Sp8YcV4ccBOajN6mmxEle.png',
  'https://cdn.salla.sa/wYYVD/iQgwJlEgEGqlIcVkCFQp5JAvtcV1jhgkz6mgWmnA.jpg'
];
top10[7].images = top10[7].galleryUrls;

// For Product 9 (Hyundai Accent 2024-2025)
top10[8].image = 'https://cdn.salla.sa/wYYVD/kJ4R3LLpMSl71C1fscqXCaeykEYyx5pHdX4B0l64.png';
top10[8].galleryUrls = [
  'https://cdn.salla.sa/wYYVD/kJ4R3LLpMSl71C1fscqXCaeykEYyx5pHdX4B0l64.png',
  'https://cdn.salla.sa/wYYVD/cVdD2fv4M7tFxKEr2Qolzcq9zgQXE4UhGUEOuvAF.png',
  'https://cdn.salla.sa/wYYVD/mxvpwbKs7HgjOvroP6zPnwVB6cO56TkZrasW0GPv.png',
  'https://cdn.salla.sa/wYYVD/abf29eff-f124-4ceb-80f1-dca55d161546-750x1000-oUBcGKNNeCBsZcKewMV0170NkVrlqXwTYbVPQRMn.jpg'
];
top10[8].images = top10[8].galleryUrls;

// For Product 10 (Lexus LX 2007-2012)
top10[9].image = 'https://cdn.salla.sa/wYYVD/f9f35631-1abe-44d2-8092-cafcf8064dc3-886.52482269504x1000-b7jn7rEtzd2oA8aUxvNv0TNfSSbvaVUNAhzsn4un.png';
top10[9].galleryUrls = [
  'https://cdn.salla.sa/wYYVD/f9f35631-1abe-44d2-8092-cafcf8064dc3-886.52482269504x1000-b7jn7rEtzd2oA8aUxvNv0TNfSSbvaVUNAhzsn4un.png',
  'https://cdn.salla.sa/wYYVD/b7jn7rEtzd2oA8aUxvNv0TNfSSbvaVUNAhzsn4un.png',
  'https://cdn.salla.sa/wYYVD/533e5580-b807-4d5d-8cdc-c88113841be2-750x1000-cusHPAMBUcXmtMSKkL7sqO6fPXmDqp4Vw5NtTOAy.jpg',
  'https://cdn.salla.sa/wYYVD/cusHPAMBUcXmtMSKkL7sqO6fPXmDqp4Vw5NtTOAy.jpg'
];
top10[9].images = top10[9].galleryUrls;

console.log('Top 10 prepared with rich galleries.');
fs.writeFileSync('scripts/ready_top_10.json', JSON.stringify(top10, null, 2), 'utf8');
