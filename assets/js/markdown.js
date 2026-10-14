/* ============================================================
   OFF-WORLD_LOG · markdown.js —— 手写迷你 Markdown 渲染器
   ------------------------------------------------------------
   为什么手写:站点要求零依赖、零构建,可以直接在浏览器里跑。

   支持的语法:
   - 标题        ## / ### / #### …
   - 段落        (同一段内的多行,中文之间无缝拼接)
   - 粗体 **x**  斜体 *x*  删除线 ~~x~~  行内代码 `x`
   - 链接 [文字](url)   图片 ![alt](url)
   - 代码块      ```lang … ```
   - 引用        > 引用内容
   - 分隔线      ---
   - 列表        - / * / + 与 1. 2. 3.,支持两级嵌套

   不支持(刻意省略):表格、任务列表、脚注、HTML 混排(已转义)。

   安全策略:先把全部原始 HTML 转义,再做样式转换,防止注入。
   ============================================================ */
const MD = (() => {
  'use strict';

  /* ---------- 基础工具 ---------- */
  const escapeHtml = (s) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  /* 中文字符判定:中文之间拼接时不加空格 */
  const isCJK = (ch) => /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch);

  /* 多行合并为一段:中文之间直接拼接,其余加一个空格 */
  function joinPara(lines) {
    let out = lines[0];
    for (let i = 1; i < lines.length; i++) {
      const a = out[out.length - 1], b = lines[i][0];
      out += (isCJK(a) && isCJK(b)) ? '' : ' ';
      out += lines[i];
    }
    return out;
  }

  /* ---------- 行内语法 ---------- */
  function renderInline(src) {
    const codeSpans = [];
    // ① 先保护行内代码,防止被后面的规则误伤
    src = src.replace(/`([^`\n]+)`/g, (m, code) => {
      codeSpans.push('<code>' + code + '</code>');
      return '\u0000C' + (codeSpans.length - 1) + '\u0000';
    });
    // ② 图片 ![alt](url)
    src = src.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
    // ③ 链接 [文字](url),外链自动新窗口打开
    src = src.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => {
      const ext = /^https?:\/\//i.test(url) ? ' target="_blank" rel="noopener"' : '';
      return '<a href="' + url + '"' + ext + '>' + text + '</a>';
    });
    // ④ 粗体 / 斜体 / 删除线
    src = src.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    src = src.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    src = src.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    // ⑤ 还原行内代码
    src = src.replace(/\u0000C(\d+)\u0000/g, (m, i) => codeSpans[+i]);
    return src;
  }

  /* ---------- 块级语法:列表(支持两级嵌套) ---------- */
  function renderList(lines, startIdx) {
    const ordered = /^\s*\d+\.\s+/.test(lines[startIdx]);
    const items = [];
    let i = startIdx;

    /* 收集连续的列表项,同时记录缩进深度(每 2 空格 = 1 级) */
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === '') break;
      const m = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
      if (!m) break;
      items.push({ depth: Math.floor(m[1].length / 2), text: m[3] });
      i++;
    }
    if (!items.length) return { html: '', next: startIdx };

    const topDepth = items[0].depth;

    /* 递归构造嵌套列表:顶层按有序/无序选标签,嵌套层一律 <ul> */
    function build(depth) {
      const tag = (depth === topDepth && ordered) ? 'ol' : 'ul';
      let html = '<' + tag + '>';
      while (items.length) {
        const item = items[0];
        if (item.depth < depth) break;                                // 回到上一层
        if (item.depth > depth) { html += build(item.depth); continue; } // 进入下一层
        items.shift();
        let children = '';
        if (items.length && items[0].depth > depth) children = build(items[0].depth);
        html += '<li>' + renderInline(item.text) + children + '</li>';
      }
      return html + '</' + tag + '>';
    }
    return { html: build(topDepth), next: i };
  }

  /* ---------- 主解析入口 ---------- */
  function parse(src) {
    src = escapeHtml(src);                              // 安全第一:先转义
    const lines = src.replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      /* 围栏代码块 ``` */
      if (/^```/.test(line)) {
        const lang = line.slice(3).trim();
        const buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
        i++;                                             // 吃掉结尾的 ```
        const cls = lang ? ' class="lang-' + lang + '"' : '';
        out.push('<pre><code' + cls + '>' + buf.join('\n') + '</code></pre>');
        continue;
      }

      /* 空行:跳过 */
      if (line.trim() === '') { i++; continue; }

      /* 标题 */
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        const lv = h[1].length;
        out.push('<h' + lv + '>' + renderInline(h[2]) + '</h' + lv + '>');
        i++;
        continue;
      }

      /* 分隔线 */
      if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

      /* 引用(连续 > 行;行内换行保留为 <br>) */
      if (/^\s*&gt;\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*&gt;\s?/.test(lines[i])) {
          buf.push(lines[i].replace(/^\s*&gt;\s?/, ''));
          i++;
        }
        out.push('<blockquote>' + renderInline(buf.join('<br>')) + '</blockquote>');
        continue;
      }

      /* 列表 */
      if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
        const r = renderList(lines, i);
        out.push(r.html);
        i = r.next;
        continue;
      }

      /* 普通段落:收集到空行或下一个块级语法之前 */
      const buf = [line];
      i++;
      while (i < lines.length) {
        const l = lines[i];
        if (l.trim() === '' ||
            /^```/.test(l) ||
            /^(#{1,6})\s/.test(l) ||
            /^\s*(---|\*\*\*|___)\s*$/.test(l) ||
            /^\s*&gt;\s?/.test(l) ||
            /^\s*([-*+]|\d+\.)\s+/.test(l)) break;
        buf.push(l);
        i++;
      }
      out.push('<p>' + renderInline(joinPara(buf)) + '</p>');
    }
    return out.join('\n');
  }

  return { parse };
})();
