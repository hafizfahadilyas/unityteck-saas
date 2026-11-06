/** Minimal SpreadsheetML workbook (.xlsx-compatible zip-free XML). Excel opens this format. */
export function buildXlsxXml(sheetName: string, rows: string[][]): string {
  const escape = (v: string) =>
    v
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const rowXml = rows
    .map(
      (cells, ri) =>
        `<Row ss:Index="${ri + 1}">` +
        cells
          .map(
            (cell, ci) =>
              `<Cell ss:Index="${ci + 1}"><Data ss:Type="String">${escape(String(cell ?? ''))}</Data></Cell>`,
          )
          .join('') +
        '</Row>',
    )
    .join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${escape(sheetName.slice(0, 31))}">
<Table>${rowXml}</Table>
</Worksheet>
</Workbook>`;
}

export function downloadXlsx(filename: string, sheetName: string, rows: string[][]): void {
  const xml = buildXlsxXml(sheetName, rows);
  const blob = new Blob([xml], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
