# 博客部署与配置指南

## 📋 目录

1. [启用 Giscus 评论系统](#1-启用-giscus-评论系统)
2. [Vercel 自动部署](#2-vercel-自动部署)
3. [写新文章](#3-写新文章)
4. [日常维护](#4-日常维护)

---

## 1. 启用 Giscus 评论系统

Giscus 是一个基于 GitHub Discussions 的评论系统，免费且无广告。

### 步骤一：启用 Discussions

1. 打开仓库：https://github.com/wudideayao/jiayao-blog-comments
2. 点击顶部导航栏的 **Settings**（齿轮图标）
3. 向下滚动到 **Features** 区域
4. 勾选 **Discussions** ✅
5. 回到仓库主页，顶部会出现 **Discussions** 标签

### 步骤二：创建分类

1. 点击仓库顶部的 **Discussions** 标签
2. 点击 **Category** 下拉菜单 → **Edit**（或直接新建一个）
3. 确保有一个 **Announcements** 或 **General** 分类
   - 建议创建一个名为 **Blog Comments** 的分类（Announcements 格式）

### 步骤三：获取配置参数

1. 打开 https://giscus.app/zh-CN
2. 在 **语言** 处选择 **简体中文**
3. 在 **仓库** 输入框填入：`wudideayao/jiayao-blog-comments`
4. 页面会自动检测仓库
5. 在 **页面 ↔ Discussion 映射** 选择 **特定文章 ID**
6. 在 **Discussion 分类** 选择你刚才创建的 **Blog Comments**（或 **Announcements**）
7. 下方 **特性** 勾选：
   - ☑ **启用反应**
   - ☑ **输入位置在上方**
8. 在 **主题** 选择 **跟随系统偏好**

### 步骤四：已配置完毕

Giscus 已配置完成，相关参数已更新到 `blog/js/blog.js` 中：

- `data-repo-id`: `R_kgDOS6bpuA`
- `data-category-id`: `DIC_kwDOS6bpuM4C_I5q`

### 步骤五：创建 Discussion

你需要在仓库 Discussions 中为每篇文章创建一个 Discussion，标题必须包含文章 ID：

| 文章 | Discussion 标题 |
|------|----------------|
| 你好，世界 | `📝 你好，世界 — hello-world` |
| 跑步教会我的三件事 | `🏃 跑步教会我的三件事 — running-and-life` |
| 音乐是我生活里的背景色 | `🎵 音乐是我生活里的背景色 — music-in-my-life` |
| 游戏里的另一个世界 | `🎮 游戏里的另一个世界 — game-world` |
| 日常生活中的美 | `🌅 日常生活中的美 — beauty-in-daily` |
| 二十多岁的一些思考 | `💭 二十多岁的一些思考 — thinking-about-life` |

### 步骤六：提交并推送

```bash
git add .
git commit -m "feat: 配置 Giscus 评论系统"
git push
```

---

## 2. Vercel 自动部署

### 方式 A：通过 GitHub 自动部署（推荐）

#### 前提条件

- 代码已推送到 GitHub
- 已有 Vercel 账号（用 GitHub 登录）

#### 步骤一：在 Vercel 导入项目

1. 打开 https://vercel.com
2. 点击 **Add New** → **Project**
3. 选择 **wudideayao/jiayao-blog-comments**
4. Vercel 会自动识别为静态站点
5. 点击 **Deploy** → 等待部署完成 ✅
6. 部署成功后记下你的域名，如 `jiayao-blog-comments.vercel.app`

#### 步骤二：配置自定义域名（可选）

1. 在 Vercel 项目页面点击 **Settings** → **Domains**
2. 输入你的域名（如果有的话）
3. 按照提示配置 DNS

#### 步骤三：配置 GitHub Actions（可选）

如果想通过 GitHub Actions 自动部署（每次 push 自动触发）：

1. 打开 https://vercel.com/account/tokens
2. 点击 **Create Token**，输入名称 `blog-deploy`，生成一个 Token
3. **复制并保存这个 Token**（关闭页面后无法再查看）

4. 打开 Vercel 项目页面 → **Settings** → 找到 **Project ID** 和 **Org ID**
   - Project ID 在 Settings 页面底部
   - Org ID 在 URL 中：`https://vercel.com/团队名/项目名/settings`

5. 打开 GitHub 仓库：https://github.com/wudideayao/jiayao-blog-comments
6. 点击 **Settings** → **Secrets and variables** → **Actions**
7. 点击 **New repository secret**，添加以下 3 个密钥：

| 名称 | 值 |
|------|-----|
| `VERCEL_TOKEN` | 第 3 步复制的 Token |
| `VERCEL_ORG_ID` | 第 4 步找到的 Org ID |
| `VERCEL_PROJECT_ID` | 第 4 步找到的 Project ID |

8. 之后每次 `git push` 都会自动部署到 Vercel

### 方式 B：直接用 Vercel CLI 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
cd e:\博客
vercel --prod
```

---

## 3. 写新文章

1. 打开 `blog/data/articles.json`

2. 在数组末尾添加一个新对象，格式如下：

```json
{
  "id": "你的文章id",
  "title": "文章标题",
  "date": "2026-07-03",
  "category": "分类名称",
  "tags": ["标签1", "标签2"],
  "summary": "文章简介，会显示在列表中",
  "content": "## 一级标题\n\n正文内容...\n\n### 二级标题\n\n更多内容..."
}
```

**字段说明：**
- `id` — 唯一标识，用英文小写+连字符，会出现在 URL 中
- `category` — 分类，已有的分类：随笔、跑步、音乐、游戏、思考
- `tags` — 标签数组，用于搜索
- `content` — 支持 Markdown 语法：
  - `#` / `##` / `###` — 标题
  - `> ` — 引用
  - `**加粗**` — 加粗
  - `- 列表项` — 无序列表
  - `1. 列表项` — 有序列表
  - `` `代码` `` — 行内代码
  - `---` — 分割线
  - 空行 = 段落分隔

3. 更新 RSS 订阅源 `blog/rss.xml`（可选）

4. 提交并推送：

```bash
git add .
git commit -m "feat: 添加新文章 - 文章标题"
git push
```

---

## 4. 日常维护

### 修改个人信息

- 主页文字：编辑 `index.html`
- 样式：编辑 `css/style.css`
- 打字机文案：编辑 `js/main.js` 中 `new TypeWriter` 的数组

### 修改联系邮箱

- Formspree：`index.html` 中 `<form action="...">`
- 显示的邮箱：同上页面中的 `.contact-value` 元素

### 更新网站图标

1. 替换 `images/icon-192.svg` 为你自己的图标
2. 更新 `manifest.json` 中的图标路径（如需）

### 常用 Git 命令

```bash
# 查看状态
git status

# 提交更改
git add .
git commit -m "feat: 修改说明"
git push

# 从远程拉取最新
git pull
```
