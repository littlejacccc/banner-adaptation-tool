import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { fabric } from 'fabric';
import { buildAdaptation } from '../utils/adaptation';
import { exportAllAsZip } from '../utils/export';
import { saveAs } from 'file-saver';

const SAFE_ZONE_COLOR = 'rgba(255, 100, 0, 0.7)';
const DISPLAY_MAX = 800;

const SingleCanvas = forwardRef(function SingleCanvas({ sizes, activeId, layers, safeAreaFromPsd, showSafeZone }, ref) {
  const containerRef = useRef(null);
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const safeZoneRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const adaptationsRef = useRef({});

  const activeSize = sizes.find(s => s.id === activeId);
  const scale = Math.min(1, DISPLAY_MAX / activeSize.width);
  const displayW = Math.round(activeSize.width * scale);
  const displayH = Math.round(activeSize.height * scale);

  useImperativeHandle(ref, () => ({
    exportAll: async () => {
      const canvasMap = {};
      for (const size of sizes) {
        await renderSize(size);
        await new Promise(resolve => setTimeout(resolve, 500));
        const fc = fabricRef.current;
        if (fc) {
          canvasMap[size.id] = fc;
        }
      }
      await exportAllAsZip(canvasMap, sizes);
      await renderSize(activeSize);
    },
    exportCurrent: () => {
      const fc = fabricRef.current;
      if (!fc) return;
      const dataUrl = fc.toDataURL({ format: 'png', multiplier: 1 / scale });
      const blob = dataUrlToBlob(dataUrl);
      saveAs(blob, `${activeSize.name}_${activeSize.width}x${activeSize.height}.png`);
    },
    resetCurrent: () => {
      delete adaptationsRef.current[activeId];
      renderSize(activeSize);
    },
  }));

  async function renderSize(size) {
    if (!fabricRef.current) {
      console.warn('Fabric not ready');
      return;
    }
    if (!layers.background && !layers.subject && !layers.title) {
      setStatus('idle');
      return;
    }

    setStatus('loading');

    try {
      let adaptation = adaptationsRef.current[size.id];
      if (!adaptation) {
        console.log('Building adaptation for', size.name);
        adaptation = await buildAdaptation(layers, safeAreaFromPsd, size);
        adaptationsRef.current[size.id] = adaptation;
      }

      const fc = fabricRef.current;
      const sizeScale = Math.min(1, DISPLAY_MAX / size.width);
      const w = Math.round(size.width * sizeScale);
      const h = Math.round(size.height * sizeScale);

      fc.clear();
      fc.setDimensions({ width: w, height: h });
      fc.setZoom(sizeScale);
      fc.setBackgroundColor('#2a2a2a', fc.renderAll.bind(fc));

      for (const obj of adaptation.objects) {
        await addFabricImage(fc, obj);
      }

      safeZoneRef.current = adaptation.safeZone;
      drawSafeZone(fc, adaptation.safeZone, showSafeZone, sizeScale);

      fc.renderAll();
      console.log('Canvas rendered for', size.name);
      setStatus('ready');
    } catch (e) {
      console.error('Render error:', e);
      setStatus('error');
    }
  }

  function addFabricImage(fc, obj) {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(
        obj.dataUrl,
        (img) => {
          if (!img || !img.width) {
            reject(new Error(`Image load failed for ${obj.type}`));
            return;
          }
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
        reject
      );
    });
  }

  function drawSafeZone(fc, safeZone, visible, sizeScale) {
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
      strokeWidth: 2 / sizeScale,
      strokeDashArray: [8 / sizeScale, 4 / sizeScale],
      selectable: false,
      evented: false,
      data: { isSafeZone: true },
    });
    fc.add(rect);
    fc.bringToFront(rect);
  }

  // Init Fabric once - create canvas element manually
  useEffect(() => {
    if (!containerRef.current) return;

    // Create canvas element outside React
    const canvas = document.createElement('canvas');
    canvas.width = displayW;
    canvas.height = displayH;
    canvas.id = 'banner-canvas';
    containerRef.current.appendChild(canvas);
    canvasElRef.current = canvas;

    console.log('Initializing Fabric on manual canvas');
    const fc = new fabric.Canvas(canvas, {
      backgroundColor: '#2a2a2a',
      selection: true,
    });
    fabricRef.current = fc;
    console.log('Fabric initialized');

    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
      if (canvasElRef.current && containerRef.current) {
        containerRef.current.removeChild(canvasElRef.current);
        canvasElRef.current = null;
      }
    };
  }, []);

  // Render when active size or layers change
  useEffect(() => {
    if (fabricRef.current && activeSize) {
      renderSize(activeSize);
    }
  }, [activeId, layers, safeAreaFromPsd]);

  // Toggle safe zone
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc || !safeZoneRef.current) return;
    const sizeScale = Math.min(1, DISPLAY_MAX / activeSize.width);
    drawSafeZone(fc, safeZoneRef.current, showSafeZone, sizeScale);
    fc.renderAll();
  }, [showSafeZone]);

  return (
    <div className="canvas-area">
      <div className="size-canvas-wrap">
        {status === 'loading' && <div className="canvas-status">适配中...</div>}
        {status === 'error' && <div className="canvas-status error">适配失败</div>}
        {status === 'idle' && <div className="canvas-status">请先导入素材</div>}
        <div ref={containerRef} className="canvas-container-manual" />
      </div>
    </div>
  );
});

function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

export default SingleCanvas;
