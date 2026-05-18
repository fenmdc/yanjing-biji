# 研经笔记

第一版目标是做一个克制的圣经研读 MVP：读经、建立研读项目、写 Markdown 笔记、使用标签与 Obsidian 双链、搜索回顾，并导出到 Obsidian。

## 初步可用能力

- 支持邮箱注册、登录、退出，并用服务端会话保护应用页面。
- 笔记库和研读页已接入 PostgreSQL，按账户保存 Markdown 内容。
- 研读页支持直接导出当前 Markdown 文件。
- Obsidian 页面支持导出 zip，并优先使用已保存的研读内容。
- 圣经阅读页已读取本地处理后的真实圣经数据，支持通过 URL 切换译本、经卷和章节。

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
- PostgreSQL 数据库

## 本地启动

准备 `.env`：

```bash
cp .env.example .env
```

确认 PostgreSQL 已启动，并且 `DATABASE_URL` 指向可用数据库。然后执行：

```bash
npx prisma migrate dev
npm run dev
```

打开 `/login` 创建个人账户后，笔记与研读内容会保存到数据库。

## 下一步

1. 将资料库接入数据库与文件上传。
2. 导入完整圣经译本文本到数据库，而不只是读取本地 processed JSON。
3. 将仪表盘、搜索页和 Obsidian 导出接入真实账户数据。
4. 完成 Markdown 导入、双链解析与搜索索引。

## 圣经数据

待导入的圣经文件放在 `data/bibles/inbox/`。推荐先使用 JSON，每节经文一条记录。详细说明见 `docs/bible-data-import.md`。

当前 Bible SuperSearch 原始数据不提交到 Git。处理后的精选译本也默认不提交，需要在本地运行：

```bash
npm run bible:process
```

默认会处理：

- `chinese_union_simp`
- `chinese_union_trad`
- `kjv`
- `web`

查看可用译本：

```bash
npm run bible:inspect
```
