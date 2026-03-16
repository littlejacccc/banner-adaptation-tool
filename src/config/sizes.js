export const TARGET_SIZES = [
  { id: 'frame1-large', name: '首帧1', width: 1600, height: 900 },
  { id: 'frame1-small', name: '首帧2', width: 880, height: 495 },
  { id: 'mid-insert', name: '中插', width: 702, height: 146 },
  { id: 'series-cover', name: '剧集封面', width: 1600, height: 1000 },
  { id: 'search-intervention', name: '搜索干预', width: 1000, height: 625 },
];

// Default safe zone: 5% margin on all sides
export function getDefaultSafeZone(width, height) {
  const mx = Math.round(width * 0.05);
  const my = Math.round(height * 0.05);
  return { x: mx, y: my, width: width - mx * 2, height: height - my * 2 };
}
