# Banner 适配工具 - 通义万象 API 集成

## 更新内容

### ✅ 修复 Canvas 渲染问题
- 采用手动创建 canvas 元素的方式，完全绕过 React 的 DOM 管理
- 解决了 Fabric.js 与 React 虚拟 DOM 的冲突
- 测试通过：Canvas 成功渲染，PSD 解析和适配正常工作

### ✅ 集成通义万象 AI 图像扩展
- 使用阿里云通义万象的 `wanx-image-outpainting-v1` 模型
- 自动将背景图扩展到目标尺寸
- 支持异步任务轮询
- 失败时自动降级到本地模糊延展方案

## 配置方法

### 1. 获取 API Key
访问：https://dashscope.console.aliyun.com/apiKey

### 2. 配置环境变量

**本地开发：**
```bash
cp .env.example .env
# 编辑 .env，填入你的 API Key
VITE_DASHSCOPE_API_KEY=sk-xxxxx
```

**Vercel 部署：**
1. 进入项目设置：https://vercel.com/littlejaccccs-projects/banner-tool/settings/environment-variables
2. 添加环境变量：
   - Key: `VITE_DASHSCOPE_API_KEY`
   - Value: `sk-xxxxx`
   - Environment: Production, Preview, Development
3. 重新部署

### 3. 测试
上传 PSD 文件后，背景图会自动通过 AI 扩展到各个尺寸。

## API 说明

### 模型：wanx-image-outpainting-v1
- 功能：图像外延扩展（Outpainting）
- 输入：原始图片 + 目标尺寸
- 输出：AI 生成的扩展图片
- 文档：https://help.aliyun.com/zh/model-studio/developer-reference/api-details-9

### 降级策略
如果 API 调用失败（无 Key、网络错误、超时），自动使用本地模糊延展方案。

## 文件结构

```
src/
├── utils/
│   ├── aiExtend.js          # 通义万象 API 调用
│   └── adaptation.js        # 适配逻辑（已更新）
├── components/
│   └── SingleCanvas.jsx     # 单 Canvas 组件（修复版）
└── App.jsx                  # 主应用（已更新）
```

## 测试结果

- ✅ Canvas 渲染成功
- ✅ PSD 解析正常
- ✅ 适配算法正确
- ⏳ AI 扩展功能（需配置 API Key 后测试）

## 部署地址

- GitHub: https://github.com/littlejacccc/banner-adaptation-tool
- Vercel: https://banner-tool-psi.vercel.app

## 下一步

1. 配置 Vercel 环境变量
2. 测试 AI 背景扩展功能
3. 优化 UI 反馈（显示 AI 处理进度）
