/* ============================================================
   OFF-WORLD_LOG · core.js —— 全站公共逻辑(纯原生 JS)
   ------------------------------------------------------------
   本文件负责:
   ① 站点配置(改名/改标语,先来这里)
   ② 导航与页脚的统一注入(改一处,全站生效)
   ③ 移动端菜单、页脚时钟、滚动显现动画
   ④ 首页开机动画(终端式逐行打印)
   ⑤ 文章清单(JSON)读取与列表/详情渲染

   依赖:assets/js/markdown.js(文章详情页需要)
   ============================================================ */
(() => {
  'use strict';

  /* ============ ① 站点配置 ============ */
  const SITE = {
    name: 'OFF-WORLD_LOG',            // 站点名(导航、页脚、页面标题)
    base: './',                       // 站点根路径;若部署在项目页需要绝对路径,可改成 '/仓库名/'
    postsIndex: 'posts/posts.json',   // 文章清单文件位置
    bootLines: [                      // 首页开机动画逐行打印的台词
      '> INITIALIZING OFF-WORLD_LOG … OK',
      '> MEMORY CHECK … 100%',
      '> SIGNAL LOCKED … CHANNEL 07',
      '> WELCOME BACK, USER'
    ],
  };

  /* ---------- 工具 ---------- */
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const escapeHtml = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ============ ② 导航与页脚注入 ============ */
  /* 改导航文案:只改下面这个数组 */
  const NAV = [
    { key: 'index',    num: '01.', label: 'INDEX',    href: 'index.html' },
    { key: 'articles', num: '02.', label: 'LOGS',     href: 'articles.html' },
    { key: 'projects', num: '03.', label: 'PROJECTS', href: 'projects.html' },
    { key: 'about',    num: '04.', label: 'ABOUT',    href: 'about.html' },
  ];

  function injectShell() {
    const page = document.body.dataset.page || '';

    /* --- 导航(顶部固定) --- */
    const navHost = $('#site-nav');
    if (navHost) {
      navHost.innerHTML = `
        <div class="wrap nav-inner">
          <a class="brand" href="${SITE.base}index.html">${escapeHtml(SITE.name)}<span class="blink">▮</span></a>
          <nav class="nav-links" id="nav-links">
            ${NAV.map(n => `
              <a href="${SITE.base}${n.href}" data-key="${n.key}" class="${n.key === page ? 'active' : ''}">
                <span class="num">${n.num}</span>${n.label}
              </a>`).join('')}
          </nav>
          <button class="nav-toggle" id="nav-toggle" aria-label="打开菜单" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>`;

      /* 移动端菜单:切换 body.nav-open,其余交给 CSS */
      const btn = $('#nav-toggle');
      btn.addEventListener('click', () => {
        const open = document.body.classList.toggle('nav-open');
        btn.setAttribute('aria-expanded', String(open));
        btn.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
      });
      $('#nav-links').addEventListener('click', (e) => {
        if (e.target.closest('a')) document.body.classList.remove('nav-open');
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          document.body.classList.remove('nav-open');
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    /* --- 页脚(版权 + 本地时钟) --- */
    const footHost = $('#site-footer');
    if (footHost) {
      footHost.innerHTML = `
        <div class="wrap footer-inner">
          <p>© ${new Date().getFullYear()} ${escapeHtml(SITE.name)} · ALL SIGNALS RESERVED</p>
          <p class="footer-clock">LOCAL // <span id="clock">--:--:--</span><span class="blink">_</span></p>
        </div>`;
      tick();
      setInterval(tick, 1000);
    }
  }

  /* 页脚本地时钟 HH:MM:SS */
  function tick() {
    const el = $('#clock');
    if (!el) return;
    const d = new Date(), p = (n) => String(n).padStart(2, '0');
    el.textContent = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  /* ============ ③ 首页开机动画 ============ */
  /* 逐字打印 bootLines,完成后淡出遮罩并触发内容显现 */
  async function boot() {
    const overlay = $('#boot');
    if (!overlay) return;
    const out = $('#boot-lines');
    let acc = '';
    for (const line of SITE.bootLines) {
      for (const ch of line) {
        acc += ch;
        out.textContent = acc + '▮';
        await wait(11);
      }
      acc += '\n';
      await wait(150);
    }
    out.textContent = acc;                       // 收尾:去掉光标
    await wait(420);
    overlay.classList.add('boot--off');          // 触发 CSS 淡出
    setTimeout(() => overlay.remove(), 800);
  }

  /* ============ ④ 滚动显现(reveal) ============ */
  let _io = null;
  function reveal() {
    const els = $$('.reveal:not(.in)');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'));
      return;
    }
    _io = _io || new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          _io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    els.forEach(el => _io.observe(el));
  }

  /* ============ ⑤ 文章数据与渲染 ============ */
  async function loadPosts() {
    const res = await fetch(SITE.base + SITE.postsIndex);
    if (!res.ok) throw new Error('posts.json 读取失败: HTTP ' + res.status);
    const list = await res.json();
    list.sort((a, b) => (String(a.date) < String(b.date) ? 1 : -1));  // 日期倒序
    return list;
  }

  /* 文章唯一标识:file 去掉 .md(如 2025-03-09-baseline) */
  const slugOf = (p) => p.slug || String(p.file || '').replace(/\.md$/i, '');

  /* 2025-03-09 → 2025.03.09 */
  const fmtDate = (s) => {
    const d = new Date(String(s) + 'T00:00:00');
    if (isNaN(d)) return String(s);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
  };

  /* 渲染文章列表(首页最新 3 篇 / 档案页全部) */
  function renderPostList(el, posts, start = 1) {
    if (!el) return;
    if (!posts || !posts.length) {
      el.innerHTML = `<div class="empty">// NO MATCH — 没有找到匹配的档案<span class="blink">_</span></div>`;
      return;
    }
    el.innerHTML = posts.map((p, i) => {
      const tags = (p.tags || []).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('');
      return `
      <a class="log-row reveal" style="--d:${(i * 0.06).toFixed(2)}s"
         href="${SITE.base}article.html?slug=${encodeURIComponent(slugOf(p))}">
        <span class="log-index">${String(start + i).padStart(3, '0')}</span>
        <div class="log-main">
          <div class="log-meta">
            <time>${fmtDate(p.date)}</time>
            <span class="log-tags">${tags}</span>
          </div>
          <h3 class="log-title">${escapeHtml(p.title)}</h3>
          <p class="log-excerpt">${escapeHtml(p.excerpt || '')}</p>
        </div>
        <span class="log-arrow" aria-hidden="true">→</span>
      </a>`;
    }).join('');
    reveal();
  }

  /* ============ ⑥ 文章详情页(article.html) ============ */
  async function renderArticle() {
    const host = $('#article');
    if (!host) return;
    const slug = new URLSearchParams(location.search).get('slug') || '';
    try {
      const posts = await loadPosts();
      const post = posts.find(p => slugOf(p) === slug);
      if (!post) throw new Error('未找到档案: ' + slug);

      const res = await fetch(SITE.base + 'posts/' + encodeURIComponent(post.file));
      if (!res.ok) throw new Error('文章文件读取失败: HTTP ' + res.status);
      const md = await res.text();
      const html = MD.parse(md);

      /* 阅读时长估算:按中文字符数 ÷ 400 */
      const mins = Math.max(1, Math.round(md.replace(/\s/g, '').length / 400));
      const idx = posts.findIndex(p => slugOf(p) === slug);
      const prev = posts[idx + 1];   // 日期更早的一篇
      const next = posts[idx - 1];   // 日期更新的一篇
      const tags = (post.tags || []).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('');
      const navLink = (p, dir, label) => p
        ? `<a class="post-nav-${dir}" href="article.html?slug=${encodeURIComponent(slugOf(p))}">
             <span class="dir">${label}</span><span class="ttl">${escapeHtml(p.title)}</span></a>`
        : '<span class="post-nav-empty"></span>';

      document.title = `${post.title} — ${SITE.name}`;
      host.innerHTML = `
        <article>
          <header class="article-head reveal">
            <p class="eyebrow">// TRANSMISSION ${fmtDate(post.date)}</p>
            <h1 class="page-title glitch" data-text="${escapeHtml(post.title)}">${escapeHtml(post.title)}</h1>
            <div class="article-meta">
              <span>DATE ${fmtDate(post.date)}</span>
              <span class="dot">·</span>
              <span>READ ~${mins} MIN</span>
              <span class="dot">·</span>
              <span class="tags">${tags}</span>
            </div>
          </header>

          <div class="article-body reveal">${html}</div>

          <div class="end-mark reveal">──── ■ END OF TRANSMISSION ────</div>

          <nav class="post-nav reveal">
            ${navLink(prev, 'prev', '← PREV')}
            ${navLink(next, 'next', 'NEXT →')}
          </nav>

          <p class="back-line reveal">
            <a class="btn ghost" href="articles.html">← 返回全部档案</a>
          </p>
        </article>`;

      initProgress();
      reveal();
    } catch (err) {
      console.error('[OFF-WORLD_LOG]', err);
      host.innerHTML = `
        <section class="lost">
          <p class="eyebrow">// ERROR</p>
          <h1 class="page-title glitch" data-text="SIGNAL_LOST">SIGNAL_LOST</h1>
          <p>没有找到这篇档案。它可能从未存在，或已在数据风暴中消失。</p>
          <p class="back-line">
            <a class="btn" href="articles.html">返回全部档案 →</a>
            <a class="btn ghost" href="index.html">返回首页 →</a>
          </p>
        </section>`;
    }
  }

  /* 阅读进度条(顶部 2px 光带) */
  function initProgress() {
    const bar = $('#progress');
    if (!bar) return;
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ============ 启动 ============ */
  document.addEventListener('DOMContentLoaded', () => {
    injectShell();
    /* 首页先播开机动画,动画结束再让内容显现;
       其他页面没有 #boot,boot() 立即返回,直接显现 */
    boot().then(() => reveal());
  });

  /* 暴露给各页面内联脚本使用 */
  window.SITE = SITE;
  window.Blog = { loadPosts, renderPostList, renderArticle, fmtDate, slugOf, escapeHtml };
})();
