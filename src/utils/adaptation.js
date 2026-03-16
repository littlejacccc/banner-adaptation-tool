import { getDefaultSafeZone } from '../config/sizes';
import { extendBackgroundWithAI } from './aiExtend';

/**
 * Extend background to target size using AI or fallback
 */
export async function adaptBackground(srcDataUrl, srcW, srcH, dstW, dstH) {
  console.log(`Adapting background from ${srcW}x${srcH} to ${dstW}x${dstH}`);
  
  // 使用通义万象 AI 扩展
  return await extendBackgroundWithAI(srcDataUrl, dstW, dstH);
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
