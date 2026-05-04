import {
  BookOpen,
  FileText,
  Library,
  NotebookPen,
  Search,
  Upload,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "工作台" },
  { href: "/bible", label: "圣经" },
  { href: "/study/john-3-16", label: "研读" },
  { href: "/notes", label: "笔记" },
  { href: "/library", label: "资料" },
  { href: "/search", label: "搜索" },
  { href: "/obsidian", label: "Obsidian" },
];

export const bibleBooks = [
  { name: "创世记", chapters: 50 },
  { name: "出埃及记", chapters: 40 },
  { name: "诗篇", chapters: 150 },
  { name: "以赛亚书", chapters: 66 },
  { name: "马太福音", chapters: 28 },
  { name: "约翰福音", chapters: 21 },
  { name: "罗马书", chapters: 16 },
  { name: "以弗所书", chapters: 6 },
];

export const john3 = [
  { verse: 14, text: "摩西在旷野怎样举蛇，人子也必照样被举起来。" },
  { verse: 15, text: "叫一切信他的都得永生。" },
  {
    verse: 16,
    text: "神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。",
  },
  {
    verse: 17,
    text: "因为神差他的儿子降世，不是要定世人的罪，乃是要叫世人因他得救。",
  },
  {
    verse: 18,
    text: "信他的人，不被定罪；不信的人，罪已经定了，因为他不信神独生子的名。",
  },
  {
    verse: 19,
    text: "光来到世间，世人因自己的行为是恶的，不爱光，倒爱黑暗，定他们的罪就是在此。",
  },
  { verse: 20, text: "凡作恶的便恨光，并不来就光，恐怕他的行为受责备。" },
  {
    verse: 21,
    text: "但行真理的必来就光，要显明他所行的是靠神而行。",
  },
];

export const dashboardCards = [
  {
    title: "继续研读",
    body: "约翰福音 3:16-21",
    meta: "今天 13:12 更新",
    icon: BookOpen,
  },
  {
    title: "最近笔记",
    body: "恩典与永生",
    meta: "含 4 个双链，3 个标签",
    icon: NotebookPen,
  },
  {
    title: "资料整理",
    body: "约翰福音第三章解经摘录",
    meta: "已关联到约 3:16",
    icon: Library,
  },
];

export const quickActions = [
  { label: "新建研读", icon: NotebookPen },
  { label: "上传资料", icon: Upload },
  { label: "搜索笔记", icon: Search },
  { label: "导出 Markdown", icon: FileText },
];

export const notes = [
  {
    title: "约翰福音 3:16-21 研读",
    type: "经文笔记",
    tags: ["救恩", "信心", "永生"],
    excerpt: "经文的焦点不是抽象的爱，而是神主动赐下子的救赎行动。",
    updatedAt: "今天",
  },
  {
    title: "恩典",
    type: "主题笔记",
    tags: ["神学主题", "救恩"],
    excerpt: "恩典不是人配得的奖赏，而是神在基督里主动赐下的怜悯。",
    updatedAt: "昨天",
  },
  {
    title: "重生是什么意思？",
    type: "问题笔记",
    tags: ["约翰福音", "问题"],
    excerpt: "尼哥底母的困惑提示我们，重生不是道德改良，而是从神而来的新生命。",
    updatedAt: "周六",
  },
  {
    title: "约翰福音 3:16 讲章草稿",
    type: "讲章草稿",
    tags: ["讲章", "福音"],
    excerpt: "中心思想：神在基督里显明救赎之爱，呼召人以信心回应。",
    updatedAt: "上周",
  },
];

export const resources = [
  {
    title: "约翰福音第三章解经摘录",
    type: "Markdown",
    tags: ["约翰福音", "救恩"],
    passage: "约 3:16-21",
  },
  {
    title: "小组查经问题：重生与信心",
    type: "PDF",
    tags: ["查经", "问题"],
    passage: "约 3:1-21",
  },
  {
    title: "救恩主题经文汇编",
    type: "TXT",
    tags: ["主题", "救恩"],
    passage: "多处经文",
  },
];

export const studyMarkdown = `---
type: passage
passage: John 3:16-21
tags:
  - 救恩
  - 信心
  - 永生
---

# 约翰福音 3:16-21 研读

## 观察

- 这段经文多次出现“信”“永生”“定罪”“光”。
- 神的爱不是停留在情感，而是具体显明在“赐下独生子”。
- 经文把人的回应分成信与不信、来就光与爱黑暗。

## 解释

约 3:16 位于耶稣与尼哥底母谈重生的上下文中。这里的“信”不是单纯认同信息，而是转向被举起的人子，并在他里面领受生命。

## 应用

- 我的灵修是否只停在熟悉的金句，而没有回到基督的救赎行动？
- 查经带领时，需要帮助小组看到 16 节与 14-21 节的整体逻辑。

## 问题

- “定罪”在约翰福音中和“光”的主题有什么关系？
- 这段经文如何连接 [[重生]]、[[信心]] 与 [[永生]]？
`;
