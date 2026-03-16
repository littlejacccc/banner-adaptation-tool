import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { fabric } from 'fabric';
import { buildAdaptation } from '../utils/adaptation';

const SAFE_ZONE_COLOR = 'rgba(255, 100, 0, 0.7)';
const DISPLAY_MAX = 800; // max display width in px

const SizeCanvas = forwardRef(function SizeCanvas({ size, layers, safeAreaFromPsd, showSafeZone }, ref) {
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const safeZoneRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error

  const scale = Math.min(1, DISPLAY_MAX / size.width);
  const displayW = Math.round(size.width * scale);
  const displayH = Math.round(size.height * scale);

  useImperativeHandle(ref, () => ({
    getCanvas: () => fabricRef.current,
    exportPng: () => {
      const fc = fabricRef.current;
      if (!fc) return null;
      // Export at full resolution
      return fc.toDataURL({ format: 'png', multiplier: 1 / scale });
    },
    resetAuto: () => initCanvas(),
  }));

  async function initCanvas() {
    if (!layers.background && !layers.subject && !layers.title) {
      setStatus('idle');
      return;
    }
    setStatus('loading');

    try {
      console.log('Building adaptation for size:', size.name);
      const adaptation = await buildAdaptation(layers, safeAreaFromPsd, size);
      console.log('Adaptation built, objects:', adaptation.objects.length);

      const fc = fabricRef.current;
      fc.clear();
      fc.setWidth(displayW);
      fc.setHeight(displayH);
      fc.setZoom(scale);
      fc.backgroundColor = '#2a2a2a'; // Lighter gray to see if canvas is rendering

      // Add objects in order
      for (const obj of adaptation.objects) {
        console.log('Adding object:', obj.type);
        await addFabricImage(fc, obj, scale);
      }

      // Store safe zone for overlay
      safeZoneRef.current = adaptation.safeZone;
      drawSafeZone(fc, adaptation.safeZone, showSafeZone);

      fc.renderAll();
      console.log('Canvas ready');
      setStatus('ready');
    } catch (e) {
      console.error('Canvas init error:', e);
      console.error('Error stack:', e.stack);
      setStatus('error');
    }
  }

  function addFabricImage(fc, obj) {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(
        obj.dataUrl,
        (img) => {
          if (!img || !img.width) {
            console.error('Failed to load image for:', obj.type);
            reject(new Error(`Image load failed for ${obj.type}`));
            return;
          }
          console.log(`Loaded ${obj.type}: ${img.width}x${img.height}`);
          img.set({
            left: obj.x,
            top: obj.y,
            scaleX: obj.width / img.width,
            scaleY: obj.height / img.height,
            selectable: obj.type !== 'background',
            evented: obj.type !== 'background',
            data: { type: obj.type },
          });
          if (obj.type === 'background') {
            fc.add(img);
            fc.sendToBack(img);
          } else {
            fc.add(img);
          }
          resolve();
        },
        { crossOrigin: 'anonymous' },
        (err) => {
          console.error('Image load error for', obj.type, ':', err);
          reject(err);
        }
      );
    });
  }

  function drawSafeZone(fc, safeZone, visible) {
    // Remove existing safe zone rect
    const existing = fc.getObjects().filter(o => o.data?.isSafeZone);
    existing.forEach(o => fc.remove(o));

    if (!visible || !safeZone) return;

    const rect = new fabric.Rect({
      left: safeZone.x,
      top: safeZone.y,
      width: safeZone.width,
      height: safeZone.height,
      fill: 'transparent',
      stroke: SAFE_ZONE_COLOR,
      strokeWidth: 2 / scale,
      strokeDashArray: [8 / scale, 4 / scale],
      selectable: false,
      evented: false,
      data: { isSafeZone: true },
    });
    fc.add(rect);
    fc.bringToFront(rect);
  }

  // Init fabric canvas once
  useEffect(() => {
    const fc = new fabric.Canvas(canvasElRef.current, {
      width: displayW,
      height: displayH,
      backgroundColor: '#2a2a2a',
      selection: true,
    });
    fabricRef.current = fc;
    console.log('Fabric canvas initialized:', displayW, 'x', displayH);
    return () => fc.dispose();
  }, []);

  // Re-init when layers change
  useEffect(() => {
    initCanvas();
  }, [layers, safeAreaFromPsd, size]);

  // Toggle safe zone overlay
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc || !safeZoneRef.current) return;
    drawSafeZone(fc, safeZoneRef.current, showSafeZone);
    fc.renderAll();
  }, [showSafeZone]);

  return (
    <div className="size-canvas-wrap">
      {status === 'loading' && <div className="canvas-status">适配中...</div>}
      {status === 'error' && <div className="canvas-status error">适配失败</div>}
      {status === 'idle' && <div className="canvas-status">请先导入素材</div>}
      <canvas ref={canvasElRef} />
    </div>
  );
});

export default SizeCanvas;
