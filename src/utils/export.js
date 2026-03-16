import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Export a single canvas to PNG data URL
 */
export function exportCanvas(canvas) {
  return canvas.toDataURL('image/png');
}

/**
 * Export all canvases as a ZIP file
 */
export async function exportAllAsZip(canvasMap, sizes) {
  const zip = new JSZip();

  for (const size of sizes) {
    const canvas = canvasMap[size.id];
    if (!canvas) continue;

    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    zip.file(`${size.name}_${size.width}x${size.height}.png`, base64, { base64: true });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'banner-export.zip');
}

/**
 * Convert data URL to blob for download
 */
export function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
