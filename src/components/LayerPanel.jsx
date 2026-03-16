export default function LayerPanel({ layers }) {
  const items = [
    { key: 'background', label: '背景层' },
    { key: 'atmosphere', label: '氛围层' },
    { key: 'subject', label: '主体层' },
    { key: 'title', label: '标题层' },
    { key: 'button', label: '按钮层' },
  ];

  return (
    <div className="layer-panel">
      <div className="panel-title">图层</div>
      {items.map(({ key, label }) => (
        <div key={key} className={`layer-item ${layers[key] ? 'loaded' : 'empty'}`}>
          <span className="layer-dot" />
          <span className="layer-name">{label}</span>
          <span className="layer-status">{layers[key] ? '✓' : '—'}</span>
        </div>
      ))}
    </div>
  );
}
