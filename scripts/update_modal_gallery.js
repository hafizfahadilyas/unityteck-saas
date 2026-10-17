import fs from 'fs';

let content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');

// 1. Update modal image and add thumbnail row
const oldModalImg = `<img 
                      src={liveSelectedProduct.type === 'seat-cover' ? (detailColor?.image || liveSelectedProduct.image) : liveSelectedProduct.image} 
                      alt={liveSelectedProduct.name} 
                      className="w-full h-full object-cover transition-all"
                    />`;

const newModalImg = `<img 
                      src={selectedProductGalleryImg || (liveSelectedProduct.type === 'seat-cover' ? (detailColor?.image || liveSelectedProduct.image) : liveSelectedProduct.image)} 
                      alt={liveSelectedProduct.name} 
                      className="w-full h-full object-cover transition-all"
                    />`;

if (content.includes(oldModalImg)) {
  content = content.replace(oldModalImg, newModalImg);
  console.log('Modal image updated successfully!');
} else {
  console.log('Warning: oldModalImg not found exactly');
}

// Add gallery thumbnails right under aspect-square
const targetUnderAspect = `</div>
                  <div className="text-center p-2 rounded-xl bg-purple-50/60 border border-purple-100">`;

const replacementWithThumbnails = `</div>

                  {/* Multi-photo Gallery Thumbnails */}
                  {liveSelectedProduct.galleryUrls && liveSelectedProduct.galleryUrls.length > 1 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold px-1">
                        <span>{isAr ? 'ألبوم الصور الحقيقية للمنتج:' : 'Product Gallery Photos:'}</span>
                        <span className="text-[#3e0f77]">{liveSelectedProduct.galleryUrls.length} {isAr ? 'صور' : 'photos'}</span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 px-0.5">
                        {liveSelectedProduct.galleryUrls.map((imgUrl, gIdx) => {
                          const isCur = (selectedProductGalleryImg || liveSelectedProduct.image) === imgUrl;
                          return (
                            <button
                              key={gIdx}
                              onClick={() => setSelectedProductGalleryImg(imgUrl)}
                              className={\`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer \${
                                isCur ? 'border-[#d5a027] ring-2 ring-[#d5a027]/40 scale-105 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100'
                              }\`}
                            >
                              <img src={imgUrl} alt={\`gallery-\${gIdx}\`} className="w-full h-full object-cover" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="text-center p-2 rounded-xl bg-purple-50/60 border border-purple-100">`;

if (content.includes(targetUnderAspect)) {
  content = content.replace(targetUnderAspect, replacementWithThumbnails);
  console.log('Modal thumbnails row added successfully!');
} else {
  console.log('Warning: targetUnderAspect not found');
}

// In modal color clicks, also update selectedProductGalleryImg
const oldColorClick = `onClick={() => {
                                setDetailColor(c);
                                setCardSelectedColors(prev => ({ ...prev, [liveSelectedProduct.id]: c }));
                              }}`;

const newColorClick = `onClick={() => {
                                setDetailColor(c);
                                setSelectedProductGalleryImg(c.image);
                                setCardSelectedColors(prev => ({ ...prev, [liveSelectedProduct.id]: c }));
                              }}`;

if (content.includes(oldColorClick)) {
  content = content.replace(oldColorClick, newColorClick);
  console.log('Modal color click updated successfully!');
}

fs.writeFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', content, 'utf8');
console.log('Saved SaudiaTransportThemeView.tsx');
