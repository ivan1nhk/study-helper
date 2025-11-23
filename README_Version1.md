# 📚 学习助手 - 计量经济学分屏工具

一个基于 Electron 的桌面应用，用于分屏学习在线课程和本地 PDF 资料。

## ✨ 功能特性

- 🎥 **左侧在线课程** - 支持各种视频网站
- 📄 **右侧 PDF 阅读** - 本地 PDF 文件查看
- 🔍 **独立缩放控制** - 左侧页面可独立缩放 50%-300%
- ↔️ **可拖动分屏** - 自由调整左右比例（15%-85%）
- 📁 **自动扫描文件夹** - 自动识别课程资料
- 💾 **配置自动保存** - 记住上次使用的文件夹
- 🎯 **双击重置** - 双击分隔条恢复 50-50 分屏

## 📦 安装

### 前置要求

- Node.js 18+ (https://nodejs.org/)

### 克隆项目

```bash
git clone https://github.com/ivan1nhk/study-helper.git
cd study-helper
```

### 安装依赖

```bash
npm install
```

## 🚀 运行

```bash
npm start
```

## 📦 打包

打包成可执行文件：

```bash
npm run build
```

打包后的文件在 `dist` 文件夹中。

## 📖 使用说明

### 1. 选择学习文件夹

首次启动时，点击"选择/刷新学习文件夹"按钮，选择包含课程资料的文件夹。

### 2. 文件夹结构

推荐的文件夹结构：

```
学习资料/
├── 第一章/
│   ├── 视频1.url      # 在线视频链接
│   ├── 视频2.url
│   ├── 讲义.pdf       # 本地PDF文件
│   └── 习题.pdf
├── 第二章/
│   ├── 视频1.url
│   └── 第二章讲义.pdf
└── ...
```

### 3. 开始学习

- 点击课程卡片进入学习界面
- 点击顶部资源标签切换视频和PDF
- 使用右上角按钮调整左侧缩放
- 拖动中间分隔条调整左右比例
- 双击分隔条恢复 50-50 分屏

## 🛠️ 技术栈

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- HTML/CSS/JavaScript - 界面开发
- Node.js - 文件系统操作

## 📝 开发

### 项目结构

```
study-helper/
├── main.js           # Electron 主进程
├── preload.js        # 预加载脚本
├── renderer.js       # 渲染进程逻辑
├── index.html        # 主界面
├── styles.css        # 样式文件
└── package.json      # 项目配置
```

### 调试

取消 `main.js` 中的注释以打开开发者工具：

```javascript
mainWindow.webContents.openDevTools();
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👤 作者

[@ivan1nhk](https://github.com/ivan1nhk)

## 🙏 致谢

感谢所有使用和贡献的朋友们！