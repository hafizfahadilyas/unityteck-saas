import fs from 'fs';

let content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');

const oldSrc = `src={liveSelectedProduct.type === 'seat-cover' ? (detailColor?.image || liveSelectedProduct.image) : liveSelectedProduct.image} 
                      alt={liveSelectedProduct.name} 
                      className="w-full h-full object-cover transition-all duration-300"`;

const newSrc = `src={selectedProductGalleryImg || (liveSelectedProduct.type === 'seat-cover' ? (detailColor?.image || liveSelectedProduct.image) : liveSelectedProduct.image)} 
                      alt={liveSelectedProduct.name} 
                      className="w-full h-full object-cover transition-all duration-300"`;

if (content.includes(oldSrc)) {
  content = content.replace(oldSrc, newSrc);
  console.log('Successfully updated modal main image src!');
  fs.writeFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', content, 'utf8');
} else {
  console.log('oldSrc still not matched exactly');
}
