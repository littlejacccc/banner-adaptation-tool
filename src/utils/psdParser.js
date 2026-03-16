import Psd from '@webtoon/psd';

const LAYER_NAMES = {
  background: ['background', '背景', 'bg'],
  atmosphere: ['atmosphere', '氛围', 'atmos'],
  subject: ['subject', '主体', '人物', 'character'],
  title: ['title', '标题'],
  button: ['button', '按钮', 'btn', 'cta'],
  safeArea: ['safe-area', '安全区', 'safezone', 'safe_area'],
};

function matchLayerType(name) {
  const lower = name.toLowerCase().trim();
  for (const [type, aliases] of Object.entries(LAYER_NAMES)) {
    if (aliases.some(a => lower.includes(a.toLowerCase()))) return type;
  }
  return null;
}

async function layerToImageData(layer, psd) {
  const composed = await layer.composite(true, true);
  const canvas = document.createElement('canvas');
  canvas.width = layer.width;
  canvas.height = layer.height;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(layer.width, layer.height);
  imageData.data.set(composed);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export async function parsePSD(file) {
  console.log('parsePSD: Reading file buffer...');
  const buffer = await file.arrayBuffer();
  console.log('parsePSD: Buffer size:', buffer.byteLength);
  
  console.log('parsePSD: Parsing with @webtoon/psd...');
  const psd = Psd.parse(buffer);
  console.log('parsePSD: PSD parsed, dimensions:', psd.width, 'x', psd.height);

  const result = {
    width: psd.width,
    height: psd.height,
    layers: { background: null, atmosphere: null, subject: null, title: null, button: null },
    safeArea: null,
  };

  async function processNode(node) {
    if (node.type === 'Layer') {
      const type = matchLayerType(node.name);
      if (!type) return;

      if (type === 'safeArea') {
        result.safeArea = {
          x: node.left,
          y: node.top,
          width: node.width,
          height: node.height,
        };
        console.log('parsePSD: Found safe area:', result.safeArea);
        return;
      }

      if (result.layers[type] === null && node.width > 0 && node.height > 0) {
        try {
          console.log(`parsePSD: Processing layer "${node.name}" as ${type}...`);
          const dataUrl = await layerToImageData(node, psd);
          result.layers[type] = {
            dataUrl,
            x: node.left,
            y: node.top,
            width: node.width,
            height: node.height,
          };
          console.log(`parsePSD: Layer ${type} processed successfully`);
        } catch (e) {
          console.warn(`Failed to composite layer "${node.name}":`, e);
        }
      }
    } else if (node.children) {
      for (const child of node.children) {
        await processNode(child);
      }
    }
  }

  console.log('parsePSD: Processing', psd.children.length, 'top-level nodes...');
  for (const child of psd.children) {
    await processNode(child);
  }

  console.log('parsePSD: Complete. Layers found:', Object.keys(result.layers).filter(k => result.layers[k]));
  return result;
}
