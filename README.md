# 研经笔记

第一版目标是做一个克制的圣经研读 MVP：读经、建立研读项目、写 Markdown 笔记、使用标签与 Obsidian 双链、搜索回顾，并导出到 Obsidian。

## 初步可用能力

- 研读页支持浏览器本地保存，刷新后保留当前 Markdown。
- 研读页支持直接导出当前 Markdown 文件。
- Obsidian 页面支持导出 zip，并优先使用已保存的研读内容。
- 当前仍使用示例经文和示例资料，下一步接入真实数据库与完整圣经文本。

## 当前页面

- `/dashboard` 工作台
- `/bible` 圣经阅读
- `/study/john-3-16` 研读工作区
- `/notes` 笔记库
- `/library` 资料库
- `/search` 全局搜索
- `/obsidian` Obsidian 导入 / 导出
- `/login` 登录页

## 技术路线

- Next.js App Router
- TypeScript
- Tailwind CSS
- CodeMirror Markdown 编辑器
- Prisma 数据模型
- PostgreSQL 预期数据库

## 下一步

1. 接入真实数据库与登录。
2. 导入完整圣经译本文本。
3. 将当前示例数据替换成用户自己的研读、笔记和资料。
4. 完成 Markdown 导入导出与搜索索引。
