import { getDefaultSafeZone } from '../config/sizes';

/**
 * Extend background to target size using cover + edge blur fill
 */
export async function adaptBackground(srcDataUrl, srcW, srcH, dstW, dstH) {
  const img = await loadImage(srcDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext('2d');

  const scaleX = dstW / srcW;
  const scaleY = dstH / srcH;
  const scale = Math.max(scaleX, scaleY);

  const scaledW = srcW * scale;
  const scaledH = srcH * scale;
  const offsetX = (dstW - scaledW) / 2;
  const offsetY = (dstH - scaledH) / 2;

  // If extreme ratio change, fill edges with blurred extension first
  const ratioChange = Math.max(scaleX / scaleY, scaleY / scaleX);
  if (ratioChange > 1.8) {
    // Draw blurred stretched version as base
    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = dstW;
    blurCanvas.height = dstH;
    const blurCtx = blurCanvas.getContext('2d');
    blurCtx.filter = 'blur(20px)';
    blurCtx.drawImage(img, 0, 0, dstW, dstH);
    blurCtx.filter = 'none';
    // Darken slightly
    blurCtx.fillStyle = 'rgba(0,0,0,0.2)';
    blurCtx.fillRect(0, 0, dstW, dstH);
    ctx.drawImage(blurCanvas, 0, 0);
  }

  // Draw cover-scaled image on top
  ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

  return canvas.toDataURL('image/png');
}

/**
 * Calculate subject placement within safe zone
 */
export function calcSubjectTransform(layer, safeZone, canvasW, canvasH) {
  const isWide = canvasW > canvasH * 2;
  const maxH = safeZone.height * 0.85;
  const maxW = isWide ? safeZone.width * 0.45 : safeZone.width * 0.7;

  const scale = Math.min(maxW / layer.width, maxH / layer.height);
  const w = layer.width * scale;
  const h = layer.height * scale;

  let x, y;
  if (isWide) {
    // Wide format: subject on right side
    x = safeZone.x + safeZone.width - w - safeZone.width * 0.05;
  } else {
    // Normal: center horizontally
    x = safeZone.x + (safeZone.width - w) / 2;
  }
  y = safeZone.y + safeZone.height - h; // bottom-align within safe zone

  return { x, y, scaleX: scale, scaleY: scale, width: w, height: h };
}

/**
 * Calculate title placement within safe zone
 */
export function calcTitleTransform(layer, safeZone) {
  const maxW = safeZone.width * 0.8;
  const maxH = safeZone.height * 0.35;
  const scale = Math.min(maxW / layer.width, maxH / layer.height);
  const w = layer.width * scale;
  const h = layer.height * scale;
  const x = safeZone.x + safeZone.width * 0.05;
  const y = safeZone.y + safeZone.height * 0.05;
  return { x, y, scaleX: scale, scaleY: scale, width: w, height: h };
}

/**
 * Build full adaptation config for a target size
 */
export async function buildAdaptation(layers, safeAreaFromPsd, targetSize) {
  const { width, height } = targetSize;
  const safeZone = safeAreaFromPsd || getDefaultSafeZone(width, height);

  const result = { safeZone, objects: [] };

  // Background
  if (layers.background) {
    const bgDataUrl = await adaptBackground(
      layers.background.dataUrl,
      layers.background.width,
      layers.background.height,
      width,
      height
    );
    result.objects.push({ type: 'background', dataUrl: bgDataUrl, x: 0, y: 0, width, height });
  }

  // Atmosphere (overlay on background)
  if (layers.atmosphere) {
    const t = calcSubjectTransform(layers.atmosphere, safeZone, width, height);
    result.objects.push({ type: 'atmosphere', dataUrl: layers.atmosphere.dataUrl, ...t });
  }

  // Subject
  if (layers.subject) {
    const t = calcSubjectTransform(layers.subject, safeZone, width, height);
    result.objects.push({ type: 'subject', dataUrl: layers.subject.dataUrl, ...t });
  }

  // Title
  if (layers.title) {
    const t = calcTitleTransform(layers.title, safeZone);
    result.objects.push({ type: 'title', dataUrl: layers.title.dataUrl, ...t });
  }

  // Button (bottom center of safe zone)
  if (layers.button) {
    const t = calcButtonTransform(layers.button, safeZone);
    result.objects.push({ type: 'button', dataUrl: layers.button.dataUrl, ...t });
  }

  return result;
}

/**
 * Calculate button placement: bottom-left of safe zone
 */
export function calcButtonTransform(layer, safeZone) {
  const maxW = safeZone.width * 0.35;
  const maxH = safeZone.height * 0.2;
  const scale = Math.min(maxW / layer.width, maxH / layer.height);
  const w = layer.width * scale;
  const h = layer.height * scale;
  const x = safeZone.x + safeZone.width * 0.05;
  const y = safeZone.y + safeZone.height - h - safeZone.height * 0.05;
  return { x, y, scaleX: scale, scaleY: scale, width: w, height: h };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
