/**
 * Capture a DOM invoice node into a real PDF (A4) for print / WhatsApp share.
 */

export type InvoicePdfResult = {
  blob: Blob;
  fileName: string;
  file: File;
};

function safeFileName(base: string): string {
  return String(base || 'invoice')
    .replace(/[^\w\u0600-\u06FF\-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80);
}

/** Build A4 PDF blob from an HTMLElement (invoice sheet). */
export async function buildInvoicePdfFromElement(
  el: HTMLElement,
  fileBaseName: string,
): Promise<InvoicePdfResult> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;
  const naturalHeight = (canvas.height * usableWidth) / canvas.width;

  // Prefer a single A4 page: scale down when the sheet is only slightly tall.
  if (naturalHeight <= usableHeight * 1.35) {
    const scale = Math.min(1, usableHeight / naturalHeight);
    const w = usableWidth * scale;
    const h = naturalHeight * scale;
    const x = margin + (usableWidth - w) / 2;
    pdf.addImage(imgData, 'JPEG', x, margin, w, h, undefined, 'FAST');
  } else {
    let heightLeft = naturalHeight;
    let position = margin;
    pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, naturalHeight, undefined, 'FAST');
    heightLeft -= usableHeight;
    while (heightLeft > 4) {
      position = margin - (naturalHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, naturalHeight, undefined, 'FAST');
      heightLeft -= usableHeight;
    }
  }

  const blob = pdf.output('blob');
  const fileName = `${safeFileName(fileBaseName)}.pdf`;
  const file = new File([blob], fileName, { type: 'application/pdf' });
  return { blob, fileName, file };
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

/** Prefer native share with PDF file (mobile WhatsApp). Fallback: download + short WA caption. */
export async function shareInvoicePdfViaWhatsApp(opts: {
  file: File;
  caption: string;
  phoneDigits?: string;
}): Promise<'shared' | 'downloaded'> {
  const { file, caption, phoneDigits } = opts;

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] });

  if (canShareFiles) {
    try {
      await navigator.share({
        files: [file],
        title: file.name,
        text: caption,
      });
      return 'shared';
    } catch (err) {
      // User cancelled or share failed — fall through to download + WA text
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'downloaded';
      }
    }
  }

  downloadBlob(file, file.name);
  const encoded = encodeURIComponent(caption);
  const base = phoneDigits
    ? `https://api.whatsapp.com/send?phone=${phoneDigits.replace(/\D/g, '')}&text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(base, '_blank', 'noopener,noreferrer');
  return 'downloaded';
}
