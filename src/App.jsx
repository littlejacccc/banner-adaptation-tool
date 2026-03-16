import { useState, useRef, useCallback } from 'react';
import { TARGET_SIZES } from './config/sizes';
import ImportPanel from './components/ImportPanel';
import LayerPanel from './components/LayerPanel';
import SizeTabs from './components/SizeTabs';
import SizeCanvas from './components/SizeCanvas';
import { exportAllAsZip } from './utils/export';
import { saveAs } from 'file-saver';
import './App.css';

const emptyLayers = { background: null, atmosphere: null, subject: null, title: null, button: null };

export default function App() {
  const [layers, setLayers] = useState(emptyLayers);
  const [safeAreaFromPsd, setSafeAreaFromPsd] = useState(null);
  const [activeId, setActiveId] = useState(TARGET_SIZES[0].id);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const canvasRefs = useRef({});

  const handleImport = useCallback((result, merge = false) => {
    if (merge) {
      setLayers(prev => ({ ...prev, ...result.layers }));
    } else {
      setLayers({ ...emptyLayers, ...result.layers });
      if (result.safeArea) setSafeAreaFromPsd(result.safeArea);
    }
  }, []);

  const handleExportAll = async () => {
    const canvasMap = {};
    for (const size of TARGET_SIZES) {
      const ref = canvasRefs.current[size.id];
      if (ref) canvasMap[size.id] = ref.getCanvas();
    }
    await exportAllAsZip(canvasMap, TARGET_SIZES);
  };

  const handleExportCurrent = () => {
    const ref = canvasRefs.current[activeId];
    if (!ref) return;
    const dataUrl = ref.exportPng();
    const size = TARGET_SIZES.find(s => s.id === activeId);
    const blob = dataUrlToBlob(dataUrl);
    saveAs(blob, `${size.name}_${size.width}x${size.height}.png`);
  };

  const handleReset = () => {
    const ref = canvasRefs.current[activeId];
    if (ref) ref.resetAuto();
  };

  const activeSize = TARGET_SIZES.find(s => s.id === activeId);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">🎨 Banner 适配工具</div>
        <div className="header-actions">
          <ImportPanel onImport={handleImport} />
          <button className="btn-export" onClick={handleExportAll}>⬇ 导出全部 ZIP</button>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <LayerPanel layers={layers} />
          <div className="safe-zone-toggle">
            <label>
              <input
                type="checkbox"
                checked={showSafeZone}
                onChange={e => setShowSafeZone(e.target.checked)}
              />
              显示安全区
            </label>
          </div>
        </aside>

        <main className="main-area">
          <SizeTabs sizes={TARGET_SIZES} activeId={activeId} onChange={setActiveId} />

          <div className="canvas-area">
            {TARGET_SIZES.map(size => (
              <div key={size.id} style={{ display: size.id === activeId ? 'block' : 'none' }}>
                <SizeCanvas
                  ref={el => canvasRefs.current[size.id] = el}
                  size={size}
                  layers={layers}
                  safeAreaFromPsd={safeAreaFromPsd}
                  showSafeZone={showSafeZone}
                />
              </div>
            ))}
          </div>

          <div className="canvas-actions">
            <button className="btn-secondary" onClick={handleReset}>↺ 重置自动适配</button>
            <button className="btn-primary" onClick={handleExportCurrent}>
              ⬇ 导出当前尺寸
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}
