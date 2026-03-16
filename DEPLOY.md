# Banner 适配工具 - 部署说明

## 快速部署到 Vercel（推荐）

### 方法 1：通过 Vercel CLI（最快）

1. 安装 Vercel CLI：
```bash
npm i -g vercel
```

2. 在项目目录运行：
```bash
vercel --prod
```

3. 按提示登录并部署，完成后会得到公网链接

---

### 方法 2：通过 Vercel 网页（无需命令行）

1. 把整个 `banner-tool` 文件夹压缩成 ZIP
2. 去 [vercel.com](https://vercel.com) 注册/登录
3. 点击 "Add New Project"
4. 选择 "Import Git Repository" 或直接拖拽 ZIP 文件
5. 点击 "Deploy"
6. 等待 1-2 分钟，得到公网链接

---

### 方法 3：本地运行

如果只是自己用，不需要公网访问：

```bash
cd banner-tool
npm install
npm run dev
```

然后访问 `http://localhost:5173`

---

## 功能说明

- 支持 5 种图层：背景/氛围/主体/标题/按钮
- 5 个投放尺寸自动适配
- PSD 解析或单独上传 PNG
- 安全区可视化
- 手动微调每个尺寸
- 批量导出 ZIP

---

## 技术栈

- React + Vite
- Fabric.js (画布编辑)
- @webtoon/psd (PSD 解析)
- JSZip (批量导出)

---

有问题随时联系！
