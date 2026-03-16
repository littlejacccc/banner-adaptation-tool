/**
 * 通义万象 API - 图像扩展
 * 文档：https://help.aliyun.com/zh/model-studio/developer-reference/api-details-9
 */

const DASHSCOPE_API_KEY = process.env.VITE_DASHSCOPE_API_KEY || '';
const API_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation';

/**
 * 使用通义万象扩展背景图
 * @param {string} imageDataUrl - 原始图片的 data URL
 * @param {number} targetWidth - 目标宽度
 * @param {number} targetHeight - 目标高度
 * @returns {Promise<string>} 扩展后的图片 data URL
 */
export async function extendBackgroundWithAI(imageDataUrl, targetWidth, targetHeight) {
  if (!DASHSCOPE_API_KEY) {
    console.warn('DASHSCOPE_API_KEY not configured, falling back to local extend');
    return fallbackExtend(imageDataUrl, targetWidth, targetHeight);
  }

  try {
    // 将 data URL 转为 base64（去掉前缀）
    const base64Data = imageDataUrl.split(',')[1];

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable', // 异步模式
      },
      body: JSON.stringify({
        model: 'wanx-image-outpainting-v1', // 图像扩展模型
        input: {
          image_url: imageDataUrl, // 支持 data URL
          target_width: targetWidth,
          target_height: targetHeight,
        },
        parameters: {
          n: 1, // 生成 1 张
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    
    // 异步任务，需要轮询结果
    if (result.output && result.output.task_id) {
      const taskId = result.output.task_id;
      console.log('AI extend task created:', taskId);
      
      // 轮询任务状态
      const extendedImageUrl = await pollTaskResult(taskId);
      
      // 下载图片并转为 data URL
      return await fetchImageAsDataUrl(extendedImageUrl);
    } else if (result.output && result.output.results && result.output.results[0]) {
      // 同步返回
      return await fetchImageAsDataUrl(result.output.results[0].url);
    } else {
      throw new Error('Unexpected API response format');
    }
  } catch (error) {
    console.error('AI extend failed, falling back:', error);
    return fallbackExtend(imageDataUrl, targetWidth, targetHeight);
  }
}

/**
 * 轮询任务结果
 */
async function pollTaskResult(taskId, maxAttempts = 30) {
  const pollUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待 2 秒
    
    const response = await fetch(pollUrl, {
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      }
    });
    
    const result = await response.json();
    
    if (result.output && result.output.task_status === 'SUCCEEDED') {
      return result.output.results[0].url;
    } else if (result.output && result.output.task_status === 'FAILED') {
      throw new Error('Task failed');
    }
    
    console.log(`Polling task ${taskId}, attempt ${i + 1}/${maxAttempts}`);
  }
  
  throw new Error('Task timeout');
}

/**
 * 下载图片并转为 data URL
 */
async function fetchImageAsDataUrl(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 本地降级方案：使用模糊延展
 */
async function fallbackExtend(srcDataUrl, dstW, dstH) {
  const img = await loadImage(srcDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext('2d');

  const srcW = img.width;
  const srcH = img.height;
  const scaleX = dstW / srcW;
  const scaleY = dstH / srcH;
  const scale = Math.max(scaleX, scaleY);

  const scaledW = srcW * scale;
  const scaledH = srcH * scale;
  const offsetX = (dstW - scaledW) / 2;
  const offsetY = (dstH - scaledH) / 2;

  // 极端比例变化时，先填充模糊背景
  const ratioChange = Math.max(scaleX / scaleY, scaleY / scaleX);
  if (ratioChange > 1.8) {
    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = dstW;
    blurCanvas.height = dstH;
    const blurCtx = blurCanvas.getContext('2d');
    blurCtx.filter = 'blur(20px)';
    blurCtx.drawImage(img, 0, 0, dstW, dstH);
    blurCtx.filter = 'none';
    blurCtx.fillStyle = 'rgba(0,0,0,0.2)';
    blurCtx.fillRect(0, 0, dstW, dstH);
    ctx.drawImage(blurCanvas, 0, 0);
  }

  // 绘制 cover-scaled 图片
  ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

  return canvas.toDataURL('image/png');
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
