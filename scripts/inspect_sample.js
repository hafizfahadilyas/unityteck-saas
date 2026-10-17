import fs from 'fs';

const parsed = JSON.parse(fs.readFileSync('scripts/parsed_seat_covers.json', 'utf8'));

// Check Product interface
console.log('Sample parsed product:');
console.log(JSON.stringify(parsed[0], null, 2));
