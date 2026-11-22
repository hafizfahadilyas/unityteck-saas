/**
 * PPTX import helpers (file type gates + Canva-like group flatten).
 * Run: npx tsx src/services/canvaPptImport.test.ts
 */
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { isLegacyPptFile, isPptxFile, importPptxFile } from './canvaPptImport';

const pptx = new File([new Uint8Array([0x50, 0x4b])], 'design.pptx', {
  type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
});
const ppt = new File([new Uint8Array([0xd0, 0xcf])], 'old.ppt', {
  type: 'application/vnd.ms-powerpoint',
});
const png = new File([new Uint8Array([0x89, 0x50])], 'flat.png', { type: 'image/png' });

assert.equal(isPptxFile(pptx), true);
assert.equal(isLegacyPptFile(ppt), true);
assert.equal(isPptxFile(ppt), false);
assert.equal(isPptxFile(png), false);
assert.equal(isLegacyPptFile(pptx), false);

/** Minimal Canva-style PPTX: text nested inside p:grpSp */
async function buildCanvaLikePptx(): Promise<File> {
  const zip = new JSZip();
  const side = Math.round(1080 * (914400 / 96));
  zip.file(
    'ppt/presentation.xml',
    `<?xml version="1.0"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst><p:sldSz cx="${side}" cy="${side}"/></p:presentation>`,
  );
  zip.file(
    'ppt/_rels/presentation.xml.rels',
    `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/></Relationships>`,
  );
  const gOffX = Math.round(100 * (914400 / 96));
  const gOffY = Math.round(200 * (914400 / 96));
  const gExtCx = Math.round(800 * (914400 / 96));
  const gExtCy = Math.round(400 * (914400 / 96));
  const cOffX = Math.round(50 * (914400 / 96));
  const cOffY = Math.round(80 * (914400 / 96));
  const cExtCx = Math.round(700 * (914400 / 96));
  const cExtCy = Math.round(120 * (914400 / 96));
  zip.file(
    'ppt/slides/slide1.xml',
    `<?xml version="1.0"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr/>
    <p:grpSp>
      <p:nvGrpSpPr><p:cNvPr id="2" name="Group"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="${gOffX}" y="${gOffY}"/>
          <a:ext cx="${gExtCx}" cy="${gExtCy}"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="${gExtCx}" cy="${gExtCy}"/>
        </a:xfrm>
      </p:grpSpPr>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="${cOffX}" y="${cOffY}"/>
            <a:ext cx="${cExtCx}" cy="${cExtCy}"/>
          </a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:p>
            <a:pPr algn="ctr"/>
            <a:r>
              <a:rPr sz="4000" b="1">
                <a:solidFill><a:srgbClr val="4C1D95"/></a:solidFill>
              </a:rPr>
              <a:t>لأنك تستحقين التميز</a:t>
            </a:r>
          </a:p>
          <a:p>
            <a:r>
              <a:rPr sz="2400">
                <a:solidFill><a:srgbClr val="4C1D95"/></a:solidFill>
              </a:rPr>
              <a:t>اختاري عطرك بثقة</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:grpSp>
  </p:spTree></p:cSld>
</p:sld>`,
  );
  zip.file(
    'ppt/slides/_rels/slide1.xml.rels',
    `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`,
  );
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>`,
  );
  const buf = await zip.generateAsync({ type: 'uint8array' });
  return new File([buf], 'canva-perfume.pptx', {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
}

const canvaFile = await buildCanvaLikePptx();
const design = await importPptxFile(canvaFile);
assert.ok(design.layers.length >= 1, 'expected at least one layer from grouped Canva PPTX');
assert.equal(design.source, 'pptx');
const textLayer = design.layers.find((l) => (l.text || '').includes('تستحقين'));
assert.ok(textLayer, 'Arabic Canva text should survive group flatten');
assert.ok(
  (textLayer!.text || '').includes('\n') || (textLayer!.text || '').includes('اختاري'),
  'multi-line Canva text should be preserved',
);
assert.ok(textLayer!.fontColor?.toLowerCase() === '#4c1d95', `fontColor=${textLayer!.fontColor}`);

console.log('canvaPptImport.test.ts: ok');
