# OFF-WORLD_LOG

一个《银翼杀手 2049》风格的个人博客。**纯 HTML + CSS + 原生 JavaScript**：没有框架、没有构建工具、没有数据库，零配置即可部署到 GitHub Pages。

## 特性

- 🌃 2049 美学：深邃冷灰渐变背景 + 细网格 + 扫描线，琥珀橙 `#ff8c00` 与霓虹青 `#00d4ff` 作为极少量强调色
- ⚡ 科技感交互：首页开机动画、打字机标语、标题故障(glitch)效果、卡片扫光、移动端全屏终端菜单
- 📝 文章用 **Markdown** 编写，浏览器端手写解析器渲染（无需 Jekyll）
- 📱 完全响应式，适配手机与电脑
- ♿ 尊重系统「减少动态」偏好

## 目录结构

```
├── .nojekyll                 # 让 GitHub Pages 跳过 Jekyll,原样托管
├── index.html                # 首页:介绍 + 最新 3 篇文章
├── articles.html             # 档案页:全部文章 + 关键词过滤
├── article.html              # 文章阅读页(?slug=xxx)
├── projects.html             # 项目卡片页
├── about.html                # 关于页(身份卡)
├── 404.html                  # 自定义 404
├── assets/
│   ├── css/style.css         # 全部样式(顶部 :root 是设计变量)
│   └── js/
│       ├── core.js           # 公共逻辑:导航注入/时钟/动画/文章渲染
│       └── markdown.js       # 手写迷你 Markdown 解析器
└── posts/
    ├── posts.json            # ★ 文章清单(每篇文章登记一条)
    └── *.md                  # 文章正文(Markdown)
```

## 本地预览

> ⚠️ 不要直接双击 `index.html`（`file://` 协议下浏览器禁止 JS 读取本地文件）。

任选其一,在仓库根目录启动静态服务器:

```bash
# Python
python -m http.server 8000

# Node(任意版本)
npx serve .
```

然后访问 <http://localhost:8000>。

## 部署到 GitHub Pages

1. 把整个仓库内容推送到 GitHub 新建仓库;
2. 打开仓库 **Settings → Pages**;
3. **Build and deployment → Source** 选择 **Deploy from a branch**;
4. **Branch** 选择 `main`、目录选择 **`/ (root)`**,保存;
5. 等待 1~2 分钟,访问 `https://你的用户名.github.io/仓库名/` 即可。

仓库里的 `.nojekyll` 会让 GitHub Pages 跳过 Jekyll 构建、原样托管文件——这就是「零配置」的关键。

## 如何发布新文章

只需两步,全程不用碰 HTML:

1. 在 `posts/` 目录新建一个 Markdown 文件,命名建议 `YYYY-MM-DD-slug.md`,例如 `2025-04-01-rain-note.md`;
2. 在 `posts/posts.json` 数组里**登记一条记录**(保持数组语法,注意逗号):

```json
{
  "title": "文章标题",
  "date": "2025-04-01",
  "file": "2025-04-01-rain-note.md",
  "excerpt": "一句话摘要,显示在列表页。",
  "tags": ["随笔", "生活"]
}
```

推送后文章自动出现在首页「最新传输」与档案页。**阅读地址固定为** `article.html?slug=文件名去掉 .md`。

> 建议文章正文用 `##` 开始分节,不要再用 `#` 一级标题(页面顶部已自动显示文章标题)。

## 支持的 Markdown 语法

标题 `## ~ ######`、段落、粗体 `**x**`、斜体 `*x*`、删除线 `~~x~~`、行内代码 `` `x` ``、围栏代码块、链接 `[文字](url)`、图片 `![alt](url)`、引用 `>`、分隔线 `---`、有序/无序列表(支持两级嵌套)。

不支持:表格、任务列表、脚注、HTML 混排(会被安全转义)。文章里的图片请引用相对路径,例如 `![配图](assets/img/photo.png)`。

## 常用自定义

| 想改什么 | 去哪里改 |
| --- | --- |
| 站点名 / 开机台词 | `assets/js/core.js` 顶部 `SITE` 对象 |
| 导航菜单文案 | `assets/js/core.js` 顶部 `NAV` 数组 |
| 所有颜色 / 字体 / 间距 | `assets/css/style.css` 顶部 `:root` 变量 |
| 首页标语 | `index.html` 底部 `PHRASES` 数组 |
| 新增项目 | 复制 `projects.html` 里的注释模板卡片 |
| 自我介绍 / 联系方式 | `about.html` 身份卡部分 |

## 备注

- 纯静态 + JS 渲染意味着文章内容在页面加载后才出现;SEO 如需更佳表现,可后续切换 Jekyll,目录结构保持兼容(`posts.json` → `_posts` 迁移成本很低)。
- 如需部署在项目子路径(如 `用户名.github.io/仓库名/`),本项目全部使用相对路径,开箱即用;若改成绝对路径,修改 `core.js` 中 `SITE.base` 即可。
