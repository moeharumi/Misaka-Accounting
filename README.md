# 御坂记账

![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![Next](https://img.shields.io/badge/next-14.2.5-black)
![License](https://img.shields.io/badge/license-MIT-blue)
![Stars](https://img.shields.io/github/stars/moeharumi/misaka-ledger?style=social)

一个极简、好看的记账应用。支持自然语言输入、分类筛选、预算提醒、导出/导入、二次元自适应背景等，专注轻量与易用。

**预览与运行**
- 本地开发：`npm install && npm run dev`
- 默认端口：`http://localhost:3000`（端口占用时自动切到 `3001`）

**核心特性**
- 自然语言记账：支持“中午吃面25元”“地铁5元”等输入，自动识别金额与分类
- 分类选择器：在输入时选择分类，可覆盖自动解析结果
- 本地存储：账单与预算保存在浏览器 LocalStorage，零后端、零配置
- 预算设置与提醒：支持设置月预算，超额时高亮提醒
- 深色模式：一键切换、持久化偏好
- 分类筛选：快速查看“餐饮/交通/购物/娱乐/居家/其他/全部”
- 账单编辑与删除：支持修改金额、备注、分类，以及删除记录
- 本月分类汇总：按分类合计当前月支出
- 月度趋势图：极简条形图展示本月每日支出趋势
- 数据导出/导入：JSON 文件下载与粘贴导入
- 二次元背景：设备自适应随机背景，可一键换图，叠加半透明与模糊提升可读性

**Screenshots**
- 并列预览（缩小显示）
  <p align="center">
    <img src="public/screenshots/home-light.png" alt="Light" width="45%" />
    <img src="public/screenshots/home-night.png" alt="Dark" width="45%" />
  </p>

**技术栈**
- Next.js（App Router）
- TypeScript
- Tailwind CSS（含 `tailwindcss-animate`）
- Lucide React 图标
 
**使用指南**
- 记一笔：在输入框输入自然语言，按 Enter 或点“保存”
- 改分类：输入框左侧选择器改为指定分类
- 编辑/删除：在账单右侧使用“铅笔/垃圾桶”
- 预算设置：在“剩余预算”卡片点击齿轮设置并保存
- 深色模式：右上角太阳/月亮切换
- 导出/导入：顶部“导出/导入”，导出为 JSON，导入粘贴 JSON 应用
- 背景：点击“换背景”随机更换二次元自适应背景

**数据与隐私**
- 存储位置：浏览器 LocalStorage  
  - 账单：`minimal-ledger:bills`  
  - 预算：`minimal-ledger:budget`
- 无后端、无云存储，数据仅保存在本地设备

**背景 API**
- 设备自适应随机背景：`https://www.loliapi.com/acg/`
- 为避免缓存，请求中附带时间戳参数

**命令**

```bash
npm install
npm run dev
```

**部署指南**
- Vercel
  - Fork 仓库并连接 Vercel
  - 框架选择 Next.js（自动检测）
  - 构建命令：`npm run build`，输出：`.next`
  - 环境变量：默认无需配置（使用浏览器 LocalStorage）
  - 注意：不包含 Windows 桌面打包内容，避免仓库体积增大

**Roadmap**
- 周视图与更多图表
- 多币种与汇率
- 更丰富的分类与图标
- 可选云同步（保持默认离线）

**作者**
- RainMoe · GitHub: https://github.com/moeharumi

**License**
- MIT
