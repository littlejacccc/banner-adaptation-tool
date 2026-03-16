import { useState, useRef, useCallback } from 'react';
import { TARGET_SIZES } from './config/sizes';
import ImportPanel from './components/ImportPanel';
import LayerPanel from './components/LayerPanel';
import SizeTabs from './components/SizeTabs';
import SingleCanvas from './components/SingleCanvas';
import { exportAllAsZip } from './utils/export';
import './App.css';

const emptyLayers = { background: null, atmosphere: null, subject: null, title: null, button: null };

export default function App() {
  const [layers, setLayers] = useState(emptyLayers);
  const [safeAreaFromPsd, setSafeAreaFromPsd] = useState(null);
  const [activeId, setActiveId] = useState(TARGET_SIZES[0].id);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const canvasRef = useRef(null);

  const handleImport = useCallback((result, merge = false) => {
    if (merge) {
      setLayers(prev => ({ ...prev, ...result.layers }));
    } else {
      setLayers({ ...emptyLayers, ...result.layers });
      if (result.safeArea) setSafeAreaFromPsd(result.safeArea);
    }
  }, []);

  const handleExportAll = async () => {
    if (!canvasRef.current) return;
    await canvasRef.current.exportAll();
  };

  const handleExportCurrent = () => {
    if (!canvasRef.current) {
      canvasRef.current.exportCurrent();
    }
  };

  const handleReset = () => {
    if (canvasRef.current) {
      canvasRef.current.resetCurrent();
    }
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

          <SingleCanvas
            ref={canvasRef}
            sizes={TARGET_SIZES}
            activeId={activeId}
            layers={layers}
            safeAreaFromPsd={safeAreaFromPsd}
            showSafeZone={showSafeZone}
          />

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
