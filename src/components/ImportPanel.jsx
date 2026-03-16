import { parsePSD } from '../utils/psdParser';

export default function ImportPanel({ onImport }) {
  async function handlePsdUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log('Starting PSD upload:', file.name, file.size, 'bytes');
    try {
      console.log('Parsing PSD...');
      const result = await parsePSD(file);
      console.log('PSD parsed successfully:', result);
      onImport(result);
      console.log('Import callback completed');
    } catch (err) {
      console.error('PSD parse error:', err);
      console.error('Error stack:', err.stack);
      alert('PSD 解析失败: ' + err.message);
    }
  }

  async function handleLayerUpload(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const img = new Image();
      img.onload = () => {
        onImport({
          layers: {
            [type]: { dataUrl, width: img.width, height: img.height, x: 0, y: 0 }
          }
        }, true); // merge mode
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="import-panel">
      <div className="import-section">
        <label className="btn-primary">
          导入 PSD
          <input type="file" accept=".psd,.psb" onChange={handlePsdUpload} style={{ display: 'none' }} />
        </label>
      </div>
      <div className="import-divider">或分别导入图层</div>
      <div className="import-section layer-uploads">
        <label className="btn-secondary">
          背景层
          <input type="file" accept="image/png,image/jpeg" onChange={(e) => handleLayerUpload(e, 'background')} style={{ display: 'none' }} />
        </label>
        <label className="btn-secondary">
          氛围层
          <input type="file" accept="image/png,image/jpeg" onChange={(e) => handleLayerUpload(e, 'atmosphere')} style={{ display: 'none' }} />
        </label>
        <label className="btn-secondary">
          主体层
          <input type="file" accept="image/png,image/jpeg" onChange={(e) => handleLayerUpload(e, 'subject')} style={{ display: 'none' }} />
        </label>
        <label className="btn-secondary">
          标题层
          <input type="file" accept="image/png,image/jpeg" onChange={(e) => handleLayerUpload(e, 'title')} style={{ display: 'none' }} />
        </label>
        <label className="btn-secondary">
          按钮层
          <input type="file" accept="image/png,image/jpeg" onChange={(e) => handleLayerUpload(e, 'button')} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  );
}
