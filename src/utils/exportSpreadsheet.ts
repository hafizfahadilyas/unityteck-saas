/**
 * Real Excel / CSV downloads for Unityteck dashboards.
 * - CSV: UTF-8 BOM + `sep=;` + `;` delimiter (works AR + EN Excel; no mashed / leftover sep=).
 * - Excel: SpreadsheetML (.xls) with header colors, column widths, borders, phone-as-text, money numbers.
 */

function escapeXml(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Long digit strings Excel would show as 9.665E+11 */
function looksLikePhoneOrId(text: string): boolean {
  const digits = text.replace(/[\s\-()+]/g, '');
  return /^\d{9,}$/.test(digits);
}

function looksLikePlainNumber(text: string): boolean {
  const t = text.trim().replace(/,/g, '');
  if (!t || looksLikePhoneOrId(t)) return false;
  return /^-?\d+(\.\d+)?$/.test(t);
}

function cellWidthChars(text: string): number {
  let w = 0;
  for (const ch of text) {
    w += /[\u0600-\u06FF]/.test(ch) ? 1.6 : 1;
  }
  return w;
}

function colWidthPoints(maxChars: number): number {
  // Generous widths so Reference / Date / Method never visually overlap
  return Math.min(80, Math.max(16, Math.ceil(maxChars * 1.25) + 6));
}

export type SpreadsheetDownloadOptions = {
  /** Right-to-left sheet (Arabic locale) */
  rtl?: boolean;
  /** 0-based column indexes forced as text (phones, order #, references) */
  textColumnIndexes?: number[];
  /** 0-based column indexes as real numbers (Amount / Fee / Net) — no green triangle */
  numberColumnIndexes?: number[];
};

const BORDER_BLOCK = `<Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>`;

/**
 * SpreadsheetML workbook Excel opens correctly as .xls
 * with modern header styling and auto-sized columns (no overlap).
 */
export function buildXlsxXml(
  sheetName: string,
  rows: string[][],
  options: SpreadsheetDownloadOptions = {},
): string {
  const safeName = escapeXml((sheetName || 'Sheet1').slice(0, 31) || 'Sheet1');
  if (!rows.length) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="${safeName}"><Table/></Worksheet>
</Workbook>`;
  }

  const colCount = Math.max(...rows.map((r) => r.length), 0);
  const textCols = new Set(options.textColumnIndexes || []);
  const numberCols = new Set(options.numberColumnIndexes || []);

  for (let ci = 0; ci < colCount; ci++) {
    if (numberCols.has(ci)) continue;
    for (let ri = 1; ri < rows.length; ri++) {
      const v = String(rows[ri]?.[ci] ?? '');
      if (looksLikePhoneOrId(v)) {
        textCols.add(ci);
        break;
      }
    }
  }

  const maxLens: number[] = Array.from({ length: colCount }, () => 10);
  for (const row of rows) {
    for (let ci = 0; ci < colCount; ci++) {
      const len = cellWidthChars(String(row[ci] ?? ''));
      if (len > maxLens[ci]) maxLens[ci] = len;
    }
  }

  const columnXml = maxLens
    .map((chars, i) => `<Column ss:Index="${i + 1}" ss:AutoFitWidth="0" ss:Width="${colWidthPoints(chars)}"/>`)
    .join('');

  const rowXml = rows
    .map((cells, ri) => {
      const isHeader = ri === 0;
      const isAlt = !isHeader && ri % 2 === 0;
      const cellXml = Array.from({ length: colCount }, (_, ci) => {
        const raw = String(cells[ci] ?? '');
        if (isHeader) {
          return `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(raw)}</Data></Cell>`;
        }

        const asNumber = numberCols.has(ci) && looksLikePlainNumber(raw);
        if (asNumber) {
          const num = Number(raw.trim().replace(/,/g, ''));
          const styleId = isAlt ? 'MoneyAlt' : 'Money';
          return `<Cell ss:StyleID="${styleId}"><Data ss:Type="Number">${Number.isFinite(num) ? num : 0}</Data></Cell>`;
        }

        const forceText = textCols.has(ci) || looksLikePhoneOrId(raw);
        const display = forceText && looksLikePhoneOrId(raw) ? `\t${raw}` : raw;
        let styleId = 'Data';
        if (forceText && isAlt) styleId = 'TextAlt';
        else if (forceText) styleId = 'Text';
        else if (isAlt) styleId = 'Alt';
        return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(display)}</Data></Cell>`;
      }).join('');
      return `<Row ss:AutoFitHeight="0" ss:Height="${isHeader ? 28 : 22}">${cellXml}</Row>`;
    })
    .join('');

  const rtlBlock = options.rtl ? '\n   <DisplayRightToLeft/>' : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center" ss:WrapText="0"/>
   <Font ss:FontName="Tahoma" ss:Size="11" ss:Color="#0F172A"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Tahoma" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0D9488" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F766E"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F766E"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F766E"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F766E"/>
   </Borders>
  </Style>
  <Style ss:ID="Data">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="0"/>
   <Font ss:FontName="Tahoma" ss:Size="11" ss:Color="#0F172A"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   ${BORDER_BLOCK}
  </Style>
  <Style ss:ID="Alt">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="0"/>
   <Font ss:FontName="Tahoma" ss:Size="11" ss:Color="#0F172A"/>
   <Interior ss:Color="#F0FDFA" ss:Pattern="Solid"/>
   ${BORDER_BLOCK}
  </Style>
  <Style ss:ID="Text">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="0"/>
   <Font ss:FontName="Tahoma" ss:Size="11" ss:Color="#0F172A"/>
   <NumberFormat ss:Format="@"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   ${BORDER_BLOCK}
  </Style>
  <Style ss:ID="TextAlt">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="0"/>
   <Font ss:FontName="Tahoma" ss:Size="11" ss:Color="#0F172A"/>
   <NumberFormat ss:Format="@"/>
   <Interior ss:Color="#F0FDFA" ss:Pattern="Solid"/>
   ${BORDER_BLOCK}
  </Style>
  <Style ss:ID="Money">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Tahoma" ss:Size="11" ss:Color="#0F172A"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   ${BORDER_BLOCK}
  </Style>
  <Style ss:ID="MoneyAlt">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Tahoma" ss:Size="11" ss:Color="#0F172A"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Interior ss:Color="#F0FDFA" ss:Pattern="Solid"/>
   ${BORDER_BLOCK}
  </Style>
 </Styles>
 <Worksheet ss:Name="${safeName}">
  <Table ss:ExpandedColumnCount="${colCount}" ss:ExpandedRowCount="${rows.length}" ss:DefaultRowHeight="22">${columnXml}${rowXml}</Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
   <ActivePane>2</ActivePane>${rtlBlock}
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download Excel-compatible spreadsheet (.xls SpreadsheetML).
 * Modern teal header, sized columns, frozen header, phone-as-text, money numbers.
 */
export function downloadXlsx(
  filename: string,
  sheetName: string,
  rows: string[][],
  options: SpreadsheetDownloadOptions = {},
): void {
  if (!rows.length) return;
  const xml = buildXlsxXml(sheetName, rows, options);
  // BOM helps Excel Desktop recognize UTF-8 SpreadsheetML + Arabic
  const blob = new Blob(['\uFEFF', xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const base = String(filename || 'export')
    .replace(/\.xlsx$/i, '')
    .replace(/\.xls$/i, '');
  triggerDownload(blob, `${base}.xls`);
}

/** Escape one CSV cell; always quote so Arabic commas / phones stay intact. */
export function escapeCsvCell(cell: unknown): string {
  const s = String(cell ?? '');
  if (looksLikePhoneOrId(s)) {
    return `"=""${s.replace(/"/g, '""')}"""`;
  }
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * Download CSV that Excel (AR + EN) opens with real columns.
 * Uses `;` + `sep=;` so the sep line is never split into a junk A1 cell.
 */
export function downloadCsv(filename: string, rows: string[][]): void {
  if (!rows.length) return;
  const body = rows.map((r) => r.map(escapeCsvCell).join(';')).join('\r\n');
  const csvContent = `\uFEFFsep=;\r\n${body}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const name = String(filename || 'export.csv');
  triggerDownload(blob, name.toLowerCase().endsWith('.csv') ? name : `${name}.csv`);
}
