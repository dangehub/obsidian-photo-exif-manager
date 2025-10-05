# 照片EXIF管理器

[English Version](../README.md)

## 项目简介

照片EXIF管理器是一个强大的Obsidian插件，用于读取和管理照片的EXIF元数据，包括拍摄时间、相机型号、光圈、快门速度等摄影信息。通过这个插件，您可以在Obsidian笔记中轻松管理和查看照片的详细信息。

## 主要功能特点

- **EXIF数据提取**：自动读取照片的综合EXIF元数据
- **元数据显示**：查看详细的照片信息，包括：
  - 拍摄日期和时间
  - 相机品牌和型号
  - 光圈、快门速度和ISO设置
  - GPS坐标（如果可用）
  - 文件大小和尺寸
- **无缝集成**：直接在您的Obsidian库中工作

## ⚠️ 重要提示

**本插件采用AI辅助开发，可能存在漏洞或安全风险。** 我们努力提供可靠的工具，但请注意：

- 谨慎使用并检查提取数据的准确性
- 报告任何问题或意外行为
- 在处理敏感照片前考虑安全影响
- 定期备份您的库内容

## 安装方法

### 通过BRAT插件安装（推荐）

1. 在您的Obsidian库中安装 [BRAT插件](https://github.com/TfTHacker/obsidian42-brat)
2. 打开BRAT设置并添加以下测试插件：
   ```
   https://github.com/dangehub/obsidian-photo-exif-manager
   ```
3. 安装完成后启用插件

### 手动安装（备选方案）

1. 从[最新发布版本](https://github.com/dangehub/obsidian-photo-exif-manager/releases)下载 `main.js`、`manifest.json` 和 `styles.css`
2. 在您的库的 `.obsidian/plugins/` 目录中创建一个名为 `obsidian-photo-exif-manager` 的文件夹
3. 将下载的文件复制到此文件夹中
4. 重启Obsidian并在 **设置 → 社区插件** 中启用插件

## 使用方法

1. **选择照片**：在您的库中选择包含EXIF数据的照片
2. **提取元数据**：插件将自动读取并显示EXIF信息
3. **查看详情**：通过插件界面访问照片的综合元数据
4. **导出选项**：根据需要以各种格式导出EXIF数据

## 系统要求

- **Obsidian版本**：0.15.0或更高
- **平台支持**：桌面版（Windows、macOS、Linux）
- **移动端支持**：暂不支持（仅桌面功能）

## 技术细节

- **构建技术**：TypeScript和Obsidian插件API
- **EXIF处理**：使用 `exifr` 库进行可靠的元数据提取
- **性能优化**：针对处理多张照片进行了优化

## 开发信息

### 环境要求

- Node.js 16或更高版本
- npm包管理器

### 开发设置

```bash
# 安装依赖
npm install

# 启动开发模式（热重载）
npm run dev

# 构建生产版本
npm run build
```

## 贡献指南

欢迎贡献！请随时提交问题和拉取请求。

## 开源协议

本项目采用MIT许可证 - 查看 [LICENSE](../LICENSE) 文件了解详情。

## 开发路线图

本项目正在积极开发中，以下是计划中的功能：

- **EXIF转属性**：将EXIF数据导出为Obsidian笔记属性以获得更好的集成
- **批量处理**：支持同时处理多张照片
- **双向同步**：从Obsidian笔记将元数据写回照片EXIF
- **模板支持**：可自定义的导出模板以适应不同用例

## 支持与帮助

如果您遇到任何问题或有疑问：

1. 查看 [Issues](https://github.com/dangehub/obsidian-photo-exif-manager/issues) 页面
2. 创建新问题并提供详细的问题信息
3. 如果相关，请提供示例文件以帮助调试

## 更新日志

### 版本0.0.1
- 初始版本发布
- 基础EXIF数据提取和显示功能
- 支持常见照片格式（JPEG、PNG、TIFF）