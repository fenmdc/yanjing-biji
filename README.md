# 研经笔记

研经笔记是一个本地优先的个人圣经研读工作台，用来读经、建立研读项目、写 Markdown 笔记、整理资料、搜索回顾，并和 Obsidian 互通。

当前稳定阶段：真实个人账户可长期使用。主线版本已包含账户登录、PostgreSQL 持久化、资料库、Obsidian 导入导出、PWA 安装入口、macOS 双击启动脚本，以及一键备份/恢复。

## 当前能力

- 邮箱注册、登录、退出，应用页面需要登录后访问。
- 仪表盘显示真实账户数据，包括最近研读、笔记、资料和快捷入口。
- 圣经阅读页读取本地处理后的圣经数据，支持译本、经卷和章节切换。
- 研读项目保存到 PostgreSQL，并可继续编辑 Markdown 研读笔记。
- 笔记库支持 Markdown 编辑、标签和详情页。
- 资料库支持文本、Markdown 摘录创建，资料详情编辑和删除。
- 全局搜索覆盖研读项目、笔记和资料。
- Obsidian 支持 Markdown/ZIP 导出，支持 `.md` / `.markdown` 预览、批量导入和重复检测。
- 数据安全支持完整账户备份 ZIP 导出，以及非破坏式合并恢复。
- PWA 支持浏览器安装到桌面或 Dock。
- macOS 双击启动脚本会自动寻找 `3100-3199` 的空闲端口。

## 页面入口

- `/dashboard` 工作台
- `/bible` 圣经阅读
- `/study/[id]` 研读工作区
- `/notes` 笔记库
- `/library` 资料库
- `/search` 全局搜索
- `/obsidian` Obsidian 互通与数据安全
- `/login` 登录页

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- CodeMirror Markdown 编辑器
- Prisma 7
- PostgreSQL
- JSZip

## 首次准备

确认本机已经安装：

- Node.js 和 npm
- PostgreSQL

准备环境变量：

```bash
cp .env.example .env
```

默认数据库连接：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bible_study_workbench"
```

如果你的 PostgreSQL 用户、密码或数据库名不同，请修改 `.env`。

安装依赖并准备数据库：

```bash
npm install
npx prisma migrate deploy
```

开发时也可以使用：

```bash
npx prisma migrate dev
npm run dev
```

打开命令行显示的本地地址，进入 `/login` 注册第一个个人账户。

## 日常启动

### macOS 双击启动

推荐日常使用：

1. 双击 `启动研经笔记.command`
2. 等待脚本检查依赖、数据库迁移和端口
3. 浏览器会自动打开应用
4. 使用期间保持终端窗口打开
5. 关闭时在终端按 `Ctrl+C`

脚本默认从 `3100` 开始寻找空闲端口，最多尝试到 `3199`。如果某个端口常被占用，可以指定起始端口：

```bash
YANJING_PORT=3200 ./启动研经笔记.command
```

也可以限制扫描范围：

```bash
YANJING_PORT=3200 YANJING_MAX_PORT=3299 ./启动研经笔记.command
```

### 命令行启动

```bash
npx prisma migrate deploy
npm run dev -- --hostname 127.0.0.1 --port 3100
```

如果 `3100` 被占用，请换一个端口：

```bash
npm run dev -- --hostname 127.0.0.1 --port 3110
```

## 安装为 PWA

PWA 是更方便的应用入口，但仍然需要本地服务和 PostgreSQL 正在运行。

推荐流程：

1. 先用 `启动研经笔记.command` 或命令行启动项目。
2. 打开应用地址，例如 `http://localhost:3100`。
3. 在 Chrome 或 Edge 地址栏点击安装图标。
4. 安装后可以从桌面、启动台或 Dock 打开。

如果本地服务没有启动，PWA 会显示离线提示页，提醒先运行本地应用服务。

## 数据安全：备份与恢复

入口：`/obsidian` 页面下方的“数据安全”区域。

### 下载备份

点击“下载备份”会导出一个 ZIP 文件，文件名类似：

```text
yanjing-biji-backup-2026-06-22T10-30-00-000Z.zip
```

备份内容包括：

- 标签
- 研读项目
- 笔记
- 资料
- 笔记双链

备份不会包含：

- 密码
- 登录会话
- 数据库连接信息
- 本机环境变量

### 从备份恢复

点击“选择备份 zip”，选择之前导出的备份文件。

恢复方式是非破坏式合并：

- 不会清空当前账户已有数据。
- 已存在的标签、笔记、资料和研读项目会跳过。
- 新内容会导入当前登录账户。
- 可以把一个账户的备份恢复到另一个账户。

建议在大量导入、整理资料、系统升级前先下载一份备份。

## Obsidian 互通

入口：`/obsidian`

### 导出到 Obsidian

点击“导出 Markdown”会生成 ZIP，包含：

- `Studies/` 研读项目
- `Notes/` 不同类型的笔记
- `Resources/` 资料库内容
- `README.md` 导出摘要

导出的 Markdown 会保留 YAML frontmatter、标签和正文，适合放入 Obsidian Vault。

### 从 Obsidian 导入

支持选择一个或多个 `.md` / `.markdown` 文件。

导入流程：

1. 选择 Markdown 文件。
2. 系统先做预览。
3. 预览会显示标题、类型、标签、摘要和重复状态。
4. 点击“确认导入”。
5. 重复文件会跳过。

识别规则：

- YAML frontmatter 会用于判断标题、类型和标签。
- 普通 Markdown 会尽量从标题和正文解析。
- 可导入为笔记或资料。

## 资料库

入口：`/library`

当前支持：

- 新建文本资料
- 上传并解析 `.txt`、`.md`、`.markdown`
- 编辑资料标题、类型、标签和正文
- 删除资料
- 搜索资料内容

PDF 已被识别为资料类型，但当前还没有内置 PDF 正文解析。临时做法是复制 PDF 摘录内容，或转为 Markdown/TXT 后导入。

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

校验圣经 JSON：

```bash
npm run bible:validate
```

## 常用维护命令

检查 Prisma schema：

```bash
npx prisma validate
```

查看数据库迁移状态：

```bash
npx prisma migrate status
```

运行代码检查：

```bash
npm run lint
```

生产构建检查：

```bash
npm run build
```

## 当前限制

- PWA 不是完全离线应用；数据仍来自本地 Next.js 服务和 PostgreSQL。
- 备份恢复目前是合并式恢复，不提供“清空后完全覆盖”的危险操作。
- PDF / DOCX 正文解析还未接入。
- 圣经经文仍主要来自本地处理后的 JSON 文件，尚未完整迁入数据库模型。
- README 中的流程按本地个人使用优化，尚未整理成多人部署说明。

## 下一步路线

1. 完善启动体验：更清晰的数据库、端口、错误提示和 PWA 安装引导。
2. 升级资料能力：PDF / DOCX 解析、全文索引、资料与经文/研读项目关联。
3. 升级研读工作流：研读模板、观察/解释/应用结构、问题记录和查经带领材料。
4. 增强备份策略：自动备份、备份历史列表、恢复前预览。
5. 整理发布版本：继续给稳定阶段打标签并保持 `main` 可直接使用。
