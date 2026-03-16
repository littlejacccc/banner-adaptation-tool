export default function SizeTabs({ sizes, activeId, onChange }) {
  return (
    <div className="size-tabs">
      {sizes.map(size => (
        <button
          key={size.id}
          className={`tab ${activeId === size.id ? 'active' : ''}`}
          onClick={() => onChange(size.id)}
        >
          {size.name}
          <span className="size-label">{size.width}×{size.height}</span>
        </button>
      ))}
    </div>
  );
}
