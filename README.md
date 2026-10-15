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

