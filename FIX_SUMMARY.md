# Fabric.js Canvas 渲染问题修复

## 问题描述
- PSD 文件解析成功（找到 2 个图层）
- 适配逻辑执行成功（buildAdaptation 返回对象）
- 但 Fabric.js canvas 初始化后立即报错：`Cannot read properties of null (reading 'clearRect')`
- 最终页面上没有 canvas 元素

## 根本原因
React 组件有 5 个 SizeCanvas 实例（对应 5 个尺寸），但只有一个是可见的（其他使用 `display:none` 隐藏）。Fabric.js 无法在隐藏的 canvas 上获取 2D context，因为 `display:none` 的元素没有尺寸（offsetWidth/offsetHeight 为 0）。

## 解决方案

### 1. 修改 CSS 隐藏策略 (`App.css`)
将隐藏 canvases 的方式从 `display:none` 改为 `visibility:hidden` + `position:absolute`：

```css
.canvas-hidden {
  visibility: hidden;
  position: absolute;
  pointer-events: none;
}
```

**原因：** `visibility:hidden` 的元素仍然保留在布局中，具有正常的尺寸，可以获取 2D context。

### 2. 修改 App.jsx 渲染逻辑
- 所有 5 个 canvases 都渲染在 DOM 中
- 使用 CSS 类控制可见性，而不是条件渲染
- 移除 `renderTrigger` 状态（不再需要）

```jsx
<div 
  key={size.id} 
  className={size.id === activeId ? 'size-canvas-wrap' : 'size-canvas-wrap canvas-hidden'}
  style={size.id === activeId ? {} : { position: 'absolute', left: 0, top: 0 }}
>
  <SizeCanvas ... />
</div>
```

### 3. 修改 SizeCanvas.jsx 初始化逻辑
- **所有 canvases 在挂载时立即初始化**（不再依赖 `isActive` prop）
- 移除 `renderTrigger` prop
- 保留 `isActive` 用于其他可能的交互逻辑

```jsx
// Init fabric canvas on mount
useEffect(() => {
  if (!canvasElRef.current) {
    console.warn('Canvas element not found for', size.name);
    return;
  }

  // Initialize Fabric canvas
  const fc = new fabric.Canvas(canvasElRef.current, {
    width: displayW,
    height: displayH,
    backgroundColor: '#2a2a2a',
    selection: true,
  });
  fabricRef.current = fc;

  // Trigger init if we have layers
  if (layers.background || layers.subject || layers.title) {
    initCanvas();
  }

  return () => {
    if (fabricRef.current) {
      fabricRef.current.dispose();
      fabricRef.current = null;
    }
  };
}, []);
```

## 修改的文件
1. `/root/.openclaw/workspace-xiaomianbao/banner-tool/src/components/SizeCanvas.jsx`
2. `/root/.openclaw/workspace-xiaomianbao/banner-tool/src/App.jsx`
3. `/root/.openclaw/workspace-xiaomianbao/banner-tool/src/App.css`

## 测试步骤
1. 启动开发服务器：`npm run dev`
2. 访问 http://localhost:5173
3. 上传测试 PSD 文件：`/root/.openclaw/workspace-xiaomianbao/test-real.psd`
4. 验证：
   - ✅ 页面显示 canvas 元素
   - ✅ 可以看到渲染的 banner
   - ✅ 切换标签页正常
   - ✅ 导出全部尺寸功能正常

## 技术要点

### visibility:hidden vs display:none
| 属性 | 布局占用 | 可获取尺寸 | 可获取 context |
|------|---------|-----------|---------------|
| `display:none` | ❌ | ❌ | ❌ |
| `visibility:hidden` | ✅ | ✅ | ✅ |

### 为什么所有 canvases 都要初始化？
- 导出全部尺寸功能需要访问所有 5 个 canvases
- 使用 `visibility:hidden` 隐藏 canvases 不影响性能（它们不在视口中）
- Fabric.js canvas 只在需要时渲染内容，内存占用可控

## 开发服务器状态
- 运行在：http://localhost:5173
- 进程 ID: 1805
